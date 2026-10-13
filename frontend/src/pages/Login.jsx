import { useState } from 'react';
import { loginUser, logout, getStoredUser } from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './Login.css';

function Login({ onNavigate, onLoginSuccess, onLogout }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(() => getStoredUser());

  // Validate form inputs
  const validate = () => {
    const newErrors = {};

    // 1. Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // 2. Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
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

    // Clear server error banner
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Clear password from local component state immediately
      setFormData({
        email: '',
        password: '',
      });

      // Never store password in local or session storage
      const userDetails = {
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
      };

      setLoggedInUser(userDetails);

      // Immediately notify parent and redirect to the appropriate dashboard
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(userDetails);
      } else {
        const targetView =
          userDetails.role === 'DOCTOR'
            ? 'doctor-dashboard'
            : userDetails.role === 'ADMIN'
            ? 'admin-dashboard'
            : 'dashboard';
        onNavigate(targetView);
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLoggedInUser(null);
    setServerError('');
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  const navigateToDashboard = (role) => {
    if (role === 'DOCTOR') onNavigate('doctor-dashboard');
    else if (role === 'ADMIN') onNavigate('admin-dashboard');
    else onNavigate('dashboard');
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Branding Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-badge" onClick={() => onNavigate('home')}>
          <img src={logoMark} alt="MediCare logo" className="brand-logo-mark" />
          <span className="brand-badge-text">MediCare Health</span>
        </div>

        <h1 className="auth-brand-title">Your Health, Managed Seamlessly.</h1>
        <p className="auth-brand-desc">
          Sign in to access your appointments, doctor consultations, and medical records
          in one secure, HIPAA-conscious portal.
        </p>

        <div className="auth-highlights-list">
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">🩺</span>
            <div>
              <h4>Verified Specialists</h4>
              <p>Certified physicians in Cardiology, Dermatology, and General Medicine.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">⚡</span>
            <div>
              <h4>Instant Appointments</h4>
              <p>Reserve doctor slots in seconds with immediate confirmation.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-highlight-icon">🔒</span>
            <div>
              <h4>Enterprise Security</h4>
              <p>Protected patient records with BCrypt encryption and JWT tokens.</p>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>Trusted by users &amp; certified healthcare specialists</span>
        </div>
      </div>

      {/* Right Form Card Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Card Header */}
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your MediCare portal.</p>
          </div>

          {/* Server Error Message */}
          {serverError && (
            <div className="alert-banner error" role="alert">
              {serverError}
            </div>
          )}

          {/* Already Logged In State */}
          {loggedInUser ? (
            <div className="already-logged-in-box">
              <div className="alert-banner info" role="alert">
                <p>
                  You are currently signed in as <strong>{loggedInUser.fullName}</strong> ({loggedInUser.role}).
                </p>
              </div>

              <div className="logged-in-profile">
                <div className="profile-field">
                  <span className="profile-label">Name:</span>
                  <span className="profile-value">{loggedInUser.fullName}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{loggedInUser.email}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">Role:</span>
                  <span className="profile-value">
                    <span className="role-badge">{loggedInUser.role}</span>
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => navigateToDashboard(loggedInUser.role)}
                >
                  Go to {loggedInUser.role === 'DOCTOR' ? 'Doctor' : loggedInUser.role === 'ADMIN' ? 'Admin' : 'Patient'} Dashboard →
                </button>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  type="email"
                  id="login-email"
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
                <label htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={errors.password ? 'input-field input-error' : 'input-field'}
                />
                {errors.password && (
                  <span className="field-error-text">{errors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="auth-card-footer">
            <p className="register-prompt">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-link-button"
                onClick={() => onNavigate('register')}
              >
                Create an account
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

export default Login;
