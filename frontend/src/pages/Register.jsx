import { useState } from 'react';
import { registerUser } from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './Register.css';

function Register({ onNavigate }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validate user inputs on the frontend
  const validate = () => {
    const newErrors = {};

    // 1. Full name is required
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // 2. Email is required and must have a valid format
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // 3. Password is required and minimum 6 characters
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // 4. Confirm password is required and must match
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-level error as user edits
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Clear server messages when user starts editing
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

    setIsLoading(true);
    try {
      const response = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      setSuccessMessage(
        response.message || 'Registration successful! You can now log in.'
      );
      // Reset form on success
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'PATIENT',
      });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Branding Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-badge" onClick={() => onNavigate('home')}>
          <img src={logoMark} alt="MediCare logo" className="brand-logo-mark" />
          <span className="brand-badge-text">MediCare Health</span>
        </div>

        <h1 className="auth-brand-title">Join the MediCare Healthcare Network.</h1>
        <p className="auth-brand-desc">
          Create an account to book specialist consultations, track your appointments,
          or register as a medical practitioner to open clinical slots.
        </p>

        <div className="auth-highlights-list">
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">📋</span>
            <div>
              <h4>Personalized Care History</h4>
              <p>Keep track of all your upcoming and past doctor visits in one place.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">👨‍⚕️</span>
            <div>
              <h4>Doctor Schedule Management</h4>
              <p>Certified physicians can set up consultations and manage appointment slots.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">🛡️</span>
            <div>
              <h4>Encrypted Health Records</h4>
              <p>Built with Spring Boot REST security, BCrypt hashing, and MySQL data isolation.</p>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>Trusted platform for users and healthcare providers</span>
        </div>
      </div>

      {/* Right Form Card Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Card Header */}
          <div className="auth-header">
            <h2>Create an Account</h2>
            <p>Get started with MediCare in just a few steps.</p>
          </div>

          {/* Server Messages */}
          {serverError && (
            <div className="alert-banner error" role="alert">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="alert-banner success" role="alert">
              <p>{successMessage}</p>
              <button
                type="button"
                className="alert-action-btn"
                onClick={() => onNavigate('login')}
              >
                Proceed to Login →
              </button>
            </div>
          )}

          {/* Registration Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name Field */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="e.g. Priya Sharma"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="name"
                className={errors.fullName ? 'input-field input-error' : 'input-field'}
              />
              {errors.fullName && (
                <span className="field-error-text">{errors.fullName}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. priya@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className={errors.email ? 'input-field input-error' : 'input-field'}
              />
              {errors.email && (
                <span className="field-error-text">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
                className={errors.password ? 'input-field input-error' : 'input-field'}
              />
              {errors.password && (
                <span className="field-error-text">{errors.password}</span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
                className={errors.confirmPassword ? 'input-field input-error' : 'input-field'}
              />
              {errors.confirmPassword && (
                <span className="field-error-text">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Account Role Selector */}
            <div className="form-group">
              <label htmlFor="role">Register As</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                className="input-field"
              >
                <option value="PATIENT">Patient (Book Appointments &amp; Track Health)</option>
                <option value="DOCTOR">Doctor (Medical Practitioner)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="auth-card-footer">
            <p className="register-prompt">
              Already have an account?{' '}
              <button
                type="button"
                className="text-link-button"
                onClick={() => onNavigate('login')}
              >
                Log in
              </button>
            </p>
            <div className="return-home-wrap">
              <button
                type="button"
                className="back-home-link"
                onClick={() => onNavigate('home')}
              >
                ← Return to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
