import { useState, useEffect } from 'react';
import {
  getStoredUser,
  getMyDoctorApplication,
  submitDoctorApplication,
  getPatientProfile,
} from '../api/api';
import './ApplyAsDoctor.css';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'ENT',
  'Ophthalmology',
  'Dental care',
  'Other',
];

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function ApplyAsDoctor({ onNavigate }) {
  const [currentUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    experience: '',
    consultationFee: '',
    clinicAddress: '',
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
  });
  const [credentialFile, setCredentialFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadApplication() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError('');
      try {
        const [appResult, profileData] = await Promise.all([
          getMyDoctorApplication().catch(() => ({ application: null })),
          getPatientProfile().catch(() => null),
        ]);
        if (!isMounted) return;
        const latest = appResult?.application || null;
        setApplication(latest);

        setFormData((prev) => ({
          ...prev,
          fullName: latest?.fullName || profileData?.fullName || currentUser?.fullName || '',
          email: latest?.email || profileData?.email || currentUser?.email || '',
          phoneNumber: latest?.phoneNumber || profileData?.phoneNumber || '',
          specialization: latest?.specialization || '',
          experience: latest?.experience != null ? String(latest.experience) : '',
          consultationFee: latest?.consultationFee != null ? String(latest.consultationFee) : '',
          clinicAddress: latest?.clinicAddress || '',
          availabilityStart: latest?.availabilityStart || '09:00',
          availabilityEnd: latest?.availabilityEnd || '17:00',
        }));
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load your application status.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadApplication();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9+()\-.\s]{7,20}$/.test(formData.phoneNumber.trim())) {
      nextErrors.phoneNumber = 'Enter a valid phone number (7-20 characters)';
    }
    if (!formData.specialization.trim()) nextErrors.specialization = 'Specialization is required';
    const experience = Number(formData.experience);
    if (formData.experience === '' || Number.isNaN(experience) || experience < 0 || experience > 60) {
      nextErrors.experience = 'Experience must be between 0 and 60 years';
    }
    const fee = Number(formData.consultationFee);
    if (formData.consultationFee === '' || Number.isNaN(fee) || fee < 1) {
      nextErrors.consultationFee = 'Consultation fee must be a positive amount';
    }
    if (!formData.clinicAddress.trim()) nextErrors.clinicAddress = 'Clinic address is required';
    if (!formData.availabilityStart) nextErrors.availabilityStart = 'Start time is required';
    if (!formData.availabilityEnd) nextErrors.availabilityEnd = 'End time is required';
    if (
      formData.availabilityStart
      && formData.availabilityEnd
      && formData.availabilityEnd <= formData.availabilityStart
    ) {
      nextErrors.availabilityEnd = 'End time must be after the start time';
    }

    if (!credentialFile) {
      nextErrors.credentials = 'Please upload your medical credentials (PDF, JPG or PNG)';
    } else {
      const lowerName = credentialFile.name.toLowerCase();
      const extensionOk = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      const typeOk = ACCEPTED_TYPES.includes(credentialFile.type);
      if (!extensionOk && !typeOk) {
        nextErrors.credentials = 'Unsupported file type. Please upload a PDF, JPG or PNG document.';
      } else if (credentialFile.size > MAX_FILE_BYTES) {
        nextErrors.credentials = `File is too large (${formatFileSize(credentialFile.size)}). Maximum size is 5 MB.`;
      } else if (credentialFile.size === 0) {
        nextErrors.credentials = 'The selected file appears to be empty.';
      }
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (serverError) setServerError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setCredentialFile(file);
    if (errors.credentials) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.credentials;
        return updated;
      });
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('fullName', formData.fullName.trim());
      payload.append('email', formData.email.trim());
      payload.append('phoneNumber', formData.phoneNumber.trim());
      payload.append('specialization', formData.specialization.trim());
      payload.append('experience', String(Number(formData.experience)));
      payload.append('consultationFee', String(Number(formData.consultationFee)));
      payload.append('clinicAddress', formData.clinicAddress.trim());
      payload.append('availabilityStart', formData.availabilityStart);
      payload.append('availabilityEnd', formData.availabilityEnd);
      payload.append('credentials', credentialFile);

      const saved = await submitDoctorApplication(payload);
      setApplication(saved);
      setCredentialFile(null);
      setSuccessMessage(
        'Your application has been submitted successfully. An administrator will review it shortly.'
      );
    } catch (err) {
      setServerError(err.message || 'Failed to submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Not logged in ---------------- */
  if (!currentUser) {
    return (
      <div className="aa-page">
        <div className="aa-card aa-status-card">
          <div className="aa-status-icon">🔒</div>
          <h2>Sign In Required</h2>
          <p>
            Please register or sign in to your MediCare account before applying to join our
            network of medical practitioners.
          </p>
          <div className="aa-status-actions">
            <button type="button" className="aa-btn aa-btn-primary" onClick={() => onNavigate('login')}>
              Sign In →
            </button>
            <button type="button" className="aa-btn aa-btn-outline" onClick={() => onNavigate('register')}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="aa-page">
        <div className="aa-card aa-status-card">
          <div className="aa-spinner" />
          <p>Loading your application status...</p>
        </div>
      </div>
    );
  }

  /* ---------------- Already approved / pending status banners ---------------- */
  const statusBanner = application ? (
    <div className={`aa-status-card aa-status-card--${(application.status || 'PENDING').toLowerCase()}`}>
      <div className="aa-status-header">
        <div>
          <h2>
            Application Status:{' '}
            <span className={`aa-status-chip aa-status-chip--${(application.status || 'PENDING').toLowerCase()}`}>
              {application.status}
            </span>
          </h2>
          <p className="aa-status-meta">
            Application #{application.id} &bull; Submitted {formatDateTime(application.submittedAt)}
            {application.reviewedAt ? ` &bull; Reviewed ${formatDateTime(application.reviewedAt)}` : ''}
          </p>
        </div>
      </div>

      {application.status === 'PENDING' && (
        <p className="aa-status-note">
          Your application is being reviewed by our medical administration team. You will be
          able to use the Doctor Dashboard once it is approved.
        </p>
      )}

      {application.status === 'APPROVED' && (
        <p className="aa-status-note">
          Congratulations! Your application has been approved and your account is now a verified
          doctor on MediCare. Please sign out and sign in again to access the Doctor Dashboard.
        </p>
      )}

      {application.status === 'REJECTED' && (
        <div className="aa-status-note">
          <p>
            Unfortunately your application was not approved this time. You can review the
            feedback below and submit a new application with updated details.
          </p>
          {application.reviewNotes && (
            <p className="aa-review-notes">
              <strong>Administrator feedback:</strong> {application.reviewNotes}
            </p>
          )}
        </div>
      )}

      <div className="aa-submitted-summary">
        <div><span>Specialization</span><strong>{application.specialization}</strong></div>
        <div><span>Experience</span><strong>{application.experience} years</strong></div>
        <div><span>Consultation Fee</span><strong>₹{application.consultationFee}</strong></div>
        <div><span>Availability</span><strong>{application.availabilityStart} - {application.availabilityEnd}</strong></div>
        <div className="aa-summary-wide"><span>Clinic Address</span><strong>{application.clinicAddress}</strong></div>
        <div>
          <span>Credentials Document</span>
          <strong>{application.credentialsFileName} ({formatFileSize(application.credentialsFileSize)})</strong>
        </div>
      </div>

      {application.status === 'APPROVED' && (
        <div className="aa-status-actions">
          <button type="button" className="aa-btn aa-btn-primary" onClick={() => onNavigate('home')}>
            Return Home
          </button>
        </div>
      )}
    </div>
  ) : null;

  const showForm = !application || application.status === 'REJECTED';

  return (
    <div className="aa-page">
      <div className="aa-page-header">
        <button type="button" className="aa-back-link" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="aa-header-row">
          <div>
            <h1>Apply as Doctor</h1>
            <p>
              Join the MediCare network of verified medical practitioners. Complete the
              application below and our administrators will review your credentials.
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="alert-banner error" role="alert">
          {loadError}
        </div>
      )}

      {statusBanner}

      {successMessage && (
        <div className="alert-banner success" role="alert">
          {successMessage}
        </div>
      )}

      {serverError && (
        <div className="alert-banner error" role="alert">
          {serverError}
        </div>
      )}

      {showForm && (
        <form className="aa-card aa-form" onSubmit={handleSubmit} noValidate>
          <section className="aa-form-section">
            <h3>
              <span className="aa-section-number">1</span> Personal Information
            </h3>
            <div className="aa-form-grid">
              <div className="form-group">
                <label htmlFor="aa-fullName">Full Name</label>
                <input
                  type="text"
                  id="aa-fullName"
                  name="fullName"
                  className={errors.fullName ? 'input-field input-error' : 'input-field'}
                  placeholder="e.g. Dr. Ananya Rao"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.fullName && <span className="field-error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="aa-email">Email Address</label>
                <input
                  type="email"
                  id="aa-email"
                  name="email"
                  className={errors.email ? 'input-field input-error' : 'input-field'}
                  placeholder="e.g. doctor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="aa-phone">Phone Number</label>
                <input
                  type="tel"
                  id="aa-phone"
                  name="phoneNumber"
                  className={errors.phoneNumber ? 'input-field input-error' : 'input-field'}
                  placeholder="e.g. 9876543210"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.phoneNumber && <span className="field-error-text">{errors.phoneNumber}</span>}
              </div>
            </div>
          </section>

          <section className="aa-form-section">
            <h3>
              <span className="aa-section-number">2</span> Professional Information
            </h3>
            <div className="aa-form-grid">
              <div className="form-group">
                <label htmlFor="aa-specialization">Specialization</label>
                <select
                  id="aa-specialization"
                  name="specialization"
                  className={errors.specialization ? 'input-field input-error' : 'input-field'}
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select your specialization</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {errors.specialization && <span className="field-error-text">{errors.specialization}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="aa-experience">Years of Experience</label>
                <input
                  type="number"
                  id="aa-experience"
                  name="experience"
                  min="0"
                  max="60"
                  className={errors.experience ? 'input-field input-error' : 'input-field'}
                  placeholder="e.g. 8"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.experience && <span className="field-error-text">{errors.experience}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="aa-fee">Consultation Fee (₹)</label>
                <input
                  type="number"
                  id="aa-fee"
                  name="consultationFee"
                  min="1"
                  step="1"
                  className={errors.consultationFee ? 'input-field input-error' : 'input-field'}
                  placeholder="e.g. 500"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.consultationFee && <span className="field-error-text">{errors.consultationFee}</span>}
              </div>
            </div>
          </section>

          <section className="aa-form-section">
            <h3>
              <span className="aa-section-number">3</span> Clinic Address
            </h3>
            <div className="form-group">
              <label htmlFor="aa-address">Clinic Address</label>
              <textarea
                id="aa-address"
                name="clinicAddress"
                rows={3}
                className={errors.clinicAddress ? 'input-field input-error' : 'input-field'}
                placeholder="e.g. MediCare Clinic, 123 Healthcare Ave, City, State - PIN"
                value={formData.clinicAddress}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.clinicAddress && <span className="field-error-text">{errors.clinicAddress}</span>}
            </div>
          </section>

          <section className="aa-form-section">
            <h3>
              <span className="aa-section-number">4</span> Availability
            </h3>
            <div className="aa-form-grid">
              <div className="form-group">
                <label htmlFor="aa-start">Start Time</label>
                <input
                  type="time"
                  id="aa-start"
                  name="availabilityStart"
                  className={errors.availabilityStart ? 'input-field input-error' : 'input-field'}
                  value={formData.availabilityStart}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.availabilityStart && <span className="field-error-text">{errors.availabilityStart}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="aa-end">End Time</label>
                <input
                  type="time"
                  id="aa-end"
                  name="availabilityEnd"
                  className={errors.availabilityEnd ? 'input-field input-error' : 'input-field'}
                  value={formData.availabilityEnd}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.availabilityEnd && <span className="field-error-text">{errors.availabilityEnd}</span>}
              </div>
            </div>
          </section>

          <section className="aa-form-section">
            <h3>
              <span className="aa-section-number">5</span> Medical Credentials
            </h3>
            <div className="form-group">
              <label htmlFor="aa-credentials">Upload Credentials Document</label>
              <input
                type="file"
                id="aa-credentials"
                className={`aa-file-input ${errors.credentials ? 'input-error' : ''}`}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <span className="aa-file-hint">
                Accepted formats: PDF, JPG, PNG &bull; Maximum file size: 5 MB
                {credentialFile ? ` &bull; Selected: ${credentialFile.name} (${formatFileSize(credentialFile.size)})` : ''}
              </span>
              {errors.credentials && <span className="field-error-text">{errors.credentials}</span>}
            </div>
          </section>

          <div className="aa-form-actions">
            <button type="submit" className="aa-btn aa-btn-primary aa-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Application...' : 'Apply for Verification'}
            </button>
            <button
              type="button"
              className="aa-btn aa-btn-outline"
              onClick={() => onNavigate('dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ApplyAsDoctor;
