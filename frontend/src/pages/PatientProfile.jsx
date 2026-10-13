import { useState, useEffect } from 'react';
import { getPatientProfile, updatePatientProfile } from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './PatientProfile.css';

function PatientProfile({ onNavigate, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    bloodGroup: '',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch patient profile on component mount
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setInitialLoading(true);
      setServerError('');
      try {
        const data = await getPatientProfile();
        if (isMounted) {
          setFormData({
            fullName: data.fullName || '',
            email: data.email || '',
            role: data.role || 'PATIENT',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            dateOfBirth: data.dateOfBirth || '',
            bloodGroup: data.bloodGroup || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setServerError(err.message || 'Unable to load profile. Please make sure you are logged in.');
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
      const updated = await updatePatientProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
      });

      setSuccessMessage('Patient profile updated successfully!');
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(updated);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="loading-container">
            Loading user profile details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <button
            type="button"
            className="profile-back-link"
            onClick={() => onNavigate('dashboard')}
          >
            ← Back to Dashboard
          </button>
          <div className="profile-brand" onClick={() => onNavigate('dashboard')}>
            <img src={logoMark} alt="MediCare logo" className="brand-logo-mark brand-logo-mark--sm" /> MediCare
          </div>
          <h2>User Profile</h2>
          <p>View and manage your personal healthcare information.</p>
        </div>

        {/* Identity & Role banner */}
        <div className="user-identity-bar">
          <div className="identity-email">
            Account Email: <strong>{formData.email}</strong>
          </div>
          <span className="role-pill">{formData.role}</span>
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

        {/* Profile Update Form */}
        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g. Priya Sharma"
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
            <label htmlFor="email">Email Address <span className="readonly-hint">(Primary login identifier)</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled={true}
              className="input-field"
            />
          </div>

          {/* Phone & Date of Birth */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
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

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={isSaving}
                className="input-field"
              />
            </div>
          </div>

          {/* Blood Group */}
          <div className="form-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              disabled={isSaving}
              className="input-field"
            >
              <option value="">Select Blood Group (Optional)</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="address">Residential Address</label>
            <textarea
              id="address"
              name="address"
              rows={3}
              placeholder="e.g. 123 Healthcare Ave, City, State"
              value={formData.address}
              onChange={handleChange}
              disabled={isSaving}
              className="input-field"
            />
          </div>

          {/* Action Buttons */}
          <div className="profile-actions-bar">
            <button
              type="submit"
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => onNavigate('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientProfile;
