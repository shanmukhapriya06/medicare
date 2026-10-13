import { useState, useEffect } from 'react';
import { getDoctorProfile, updateDoctorProfile } from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './DoctorProfile.css';

function DoctorProfile({ onNavigate, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'DOCTOR',
    phoneNumber: '',
    specialization: '',
    qualifications: '',
    experience: 0,
    consultationFee: 0.0,
    bio: '',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch doctor profile on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setInitialLoading(true);
      setServerError('');
      try {
        const data = await getDoctorProfile();
        if (isMounted) {
          setFormData({
            fullName: data.fullName || '',
            email: data.email || '',
            role: data.role || 'DOCTOR',
            phoneNumber: data.phoneNumber || '',
            specialization: data.specialization || '',
            qualifications: data.qualifications || '',
            experience: data.experience !== null && data.experience !== undefined ? data.experience : 0,
            consultationFee: data.consultationFee !== null && data.consultationFee !== undefined ? data.consultationFee : 0.0,
            bio: data.bio || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setServerError(err.message || 'Unable to load doctor profile. Make sure you are logged in as a DOCTOR.');
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required (e.g. Cardiology, Neurology)';
    }

    if (!formData.qualifications.trim()) {
      newErrors.qualifications = 'Qualifications are required (e.g. MBBS, MD)';
    }

    if (formData.experience === '' || isNaN(formData.experience) || Number(formData.experience) < 0) {
      newErrors.experience = 'Experience must be 0 or more years';
    }

    if (formData.consultationFee === '' || isNaN(formData.consultationFee) || Number(formData.consultationFee) < 0) {
      newErrors.consultationFee = 'Consultation fee cannot be negative';
    }

    if (formData.phoneNumber && !/^[0-9+() -]{7,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number (7-15 digits)';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDoctorProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        specialization: formData.specialization.trim(),
        qualifications: formData.qualifications.trim(),
        experience: Number(formData.experience),
        consultationFee: Number(formData.consultationFee),
        bio: formData.bio.trim(),
      });

      setSuccessMessage('Doctor profile updated successfully!');
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(updated);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to update doctor profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-card">
          <div className="loading-container">
            Loading doctor profile details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-profile-page">
      <div className="doctor-profile-card">
        {/* Header */}
        <div className="doctor-header">
          <div className="doctor-brand" onClick={() => onNavigate('doctor-dashboard')}>
            <img src={logoMark} alt="MediCare logo" className="brand-logo-mark brand-logo-mark--sm" /> MediCare
          </div>
          <h2>Doctor Profile</h2>
          <p>Manage your professional medical credentials, fees, and patient biography.</p>
        </div>

        {/* Identity & Role banner */}
        <div className="doctor-identity-bar">
          <div className="identity-info">
            Doctor Account: <strong>{formData.email}</strong>
          </div>
          <span className="doctor-role-badge">{formData.role}</span>
        </div>

        {/* Alert Messages */}
        {serverError && (
          <div className="alert-banner error" role="alert">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="alert-banner success" role="alert">
            {successMessage}
          </div>
        )}

        {/* Doctor Form */}
        <form className="doctor-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="doctor-fullName">Doctor Full Name</label>
            <input
              type="text"
              id="doctor-fullName"
              name="fullName"
              placeholder="e.g. Dr. Rajesh Kumar"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSaving}
              className={errors.fullName ? 'input-field input-error' : 'input-field'}
            />
            {errors.fullName && (
              <span className="field-error-text">{errors.fullName}</span>
            )}
          </div>

          {/* Email (Readonly for identification) */}
          <div className="form-group">
            <label htmlFor="doctor-email">Account Email <span className="readonly-hint">(Primary login identifier)</span></label>
            <input
              type="email"
              id="doctor-email"
              name="email"
              value={formData.email}
              disabled={true}
              className="input-field"
            />
          </div>

          {/* Specialization & Qualifications */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="specialization">Medical Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                placeholder="e.g. Cardiologist, Dermatologist"
                value={formData.specialization}
                onChange={handleChange}
                disabled={isSaving}
                className={errors.specialization ? 'input-field input-error' : 'input-field'}
              />
              {errors.specialization && (
                <span className="field-error-text">{errors.specialization}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="qualifications">Qualifications</label>
              <input
                type="text"
                id="qualifications"
                name="qualifications"
                placeholder="e.g. MBBS, MD (Cardiology)"
                value={formData.qualifications}
                onChange={handleChange}
                disabled={isSaving}
                className={errors.qualifications ? 'input-field input-error' : 'input-field'}
              />
              {errors.qualifications && (
                <span className="field-error-text">{errors.qualifications}</span>
              )}
            </div>
          </div>

          {/* Experience, Fee, & Phone */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experience">Experience (Years)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                min="0"
                placeholder="e.g. 10"
                value={formData.experience}
                onChange={handleChange}
                disabled={isSaving}
                className={errors.experience ? 'input-field input-error' : 'input-field'}
              />
              {errors.experience && (
                <span className="field-error-text">{errors.experience}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="consultationFee">Consultation Fee ($ / ₹)</label>
              <input
                type="number"
                id="consultationFee"
                name="consultationFee"
                min="0"
                step="50"
                placeholder="e.g. 500"
                value={formData.consultationFee}
                onChange={handleChange}
                disabled={isSaving}
                className={errors.consultationFee ? 'input-field input-error' : 'input-field'}
              />
              {errors.consultationFee && (
                <span className="field-error-text">{errors.consultationFee}</span>
              )}
            </div>
          </div>

          {/* Contact Phone */}
          <div className="form-group">
            <label htmlFor="doctor-phone">Clinic / Contact Phone</label>
            <input
              type="tel"
              id="doctor-phone"
              name="phoneNumber"
              placeholder="e.g. 9876543210"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isSaving}
              className={errors.phoneNumber ? 'input-field input-error' : 'input-field'}
            />
            {errors.phoneNumber && (
              <span className="field-error-text">{errors.phoneNumber}</span>
            )}
          </div>

          {/* Biography */}
          <div className="form-group">
            <label htmlFor="bio">Professional Biography</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={1000}
              placeholder="Brief introduction for patients, clinical focus, and background..."
              value={formData.bio}
              onChange={handleChange}
              disabled={isSaving}
              className="input-field"
            />
          </div>

          {/* Actions */}
          <div className="doctor-actions-bar">
            <button
              type="submit"
              className="doctor-save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Doctor Profile'}
            </button>
            <button
              type="button"
              className="doctor-cancel-button"
              onClick={() => onNavigate('doctor-dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorProfile;
