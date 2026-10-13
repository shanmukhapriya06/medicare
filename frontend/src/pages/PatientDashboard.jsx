import { useState, useEffect } from 'react';
import {
  getStoredUser,
  getPatientProfile,
  getMyAppointments,
  getMyDoctorApplication,
  cancelAppointment,
  logout,
} from '../api/api';
import { ConfirmationModal } from '../components';
import logoMark from '../assets/medicare-logo.svg';
import './PatientDashboard.css';

function initials(name) {
  if (!name) return 'P';
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function PatientDashboard({ onNavigate, onLogout }) {
  const [currentUser] = useState(getStoredUser());
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmCancelAppt, setConfirmCancelAppt] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const executeCancel = async (apptId) => {
    setIsCancelling(true);
    try {
      await cancelAppointment(apptId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a))
      );
      setConfirmCancelAppt(null);
    } catch (err) {
      setLoadError(err.message || 'Failed to cancel appointment.');
      setConfirmCancelAppt(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Load patient profile & live appointments on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [profileData, apptsData, applicationData] = await Promise.all([
          getPatientProfile().catch(() => null),
          getMyAppointments('all').catch(() => []),
          getMyDoctorApplication()
          .then((data) => (data && data.application ? data.application : null))
          .catch(() => null),
        ]);

        if (isMounted) {
          if (profileData) setProfile(profileData);
          if (Array.isArray(apptsData)) setAppointments(apptsData);
          if (applicationData) setApplication(applicationData);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load all dashboard data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogoutClick = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      logout();
      if (typeof onNavigate === 'function') {
        onNavigate('home');
      }
    }
  };

  const patientName = profile?.fullName || currentUser?.fullName || 'User';
  const patientEmail = profile?.email || currentUser?.email || 'user@medicare.com';
  const applicationStatusLabel = !application
    ? 'Not Applied'
    : application.status === 'PENDING'
    ? 'Under Review'
    : application.status === 'APPROVED'
    ? 'Approved'
    : 'Not Approved';
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED'
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  return (
    <div className="pd-dashboard-wrapper">
      {/* Mobile Header Bar */}
      <header className="pd-mobile-header">
        <div className="pd-logo-brand" onClick={() => onNavigate('home')}>
          <img src={logoMark} alt="MediCare logo" className="pd-logo-mark" />
          <span className="pd-logo-text">MediCare</span>
        </div>
        <button
          type="button"
          className="pd-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ========================================================
          A. LEFT SIDEBAR (Dark Navy Background)
          ======================================================== */}
      <aside className={`pd-sidebar ${mobileMenuOpen ? 'pd-sidebar--open' : ''}`}>
        {/* Brand Logo at top */}
        <div className="pd-sidebar-top">
          <div className="pd-sidebar-logo" onClick={() => onNavigate('home')}>
            <img src={logoMark} alt="MediCare logo" className="pd-logo-mark" />
            <div className="pd-logo-title-group">
              <span className="pd-logo-text">MediCare</span>
              <span className="pd-logo-tagline">User Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="pd-sidebar-nav">
          <ul className="pd-nav-list">
            {/* 1. Home */}
            <li className="pd-nav-item">
              <button
                type="button"
                className="pd-nav-link"
                onClick={() => onNavigate('home')}
              >
                <span className="pd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <span className="pd-nav-label">Home</span>
              </button>
            </li>

            {/* 2. Dashboard (Active) */}
            <li className="pd-nav-item">
              <button
                type="button"
                className="pd-nav-link pd-nav-link--active"
                onClick={() => onNavigate('dashboard')}
              >
                <span className="pd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                </span>
                <span className="pd-nav-label">Dashboard</span>
              </button>
            </li>

            {/* 3. My Appointments */}
            <li className="pd-nav-item">
              <button
                type="button"
                className="pd-nav-link"
                onClick={() => onNavigate('appointments')}
              >
                <span className="pd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="pd-nav-label">My Appointments</span>
                {upcomingAppointments.length > 0 && (
                  <span className="pd-nav-pill-badge">{upcomingAppointments.length}</span>
                )}
              </button>
            </li>

            {/* 4. Find Doctors */}
            <li className="pd-nav-item">
              <button
                type="button"
                className="pd-nav-link"
                onClick={() => onNavigate('doctors')}
              >
                <span className="pd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
                    <path d="M18 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    <path d="M9 12.5V17a4 4 0 0 0 8 0v-4.5" />
                  </svg>
                </span>
                <span className="pd-nav-label">Find Doctors</span>
              </button>
            </li>

            {/* 5. Apply as Doctor */}
            <li className="pd-nav-item">
              <button
                type="button"
                className="pd-nav-link"
                onClick={() => onNavigate('apply-doctor')}
              >
                <span className="pd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v4" />
                    <path d="M10 5h4" />
                    <path d="M4.5 20.5V19a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v1.5" />
                    <circle cx="12" cy="11" r="4" />
                  </svg>
                </span>
                <span className="pd-nav-label">Apply as Doctor</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* ========================================================
            Sidebar Footer: Patient Avatar & Profile (Clickable to Edit)
            ======================================================== */}
        <div className="pd-sidebar-footer">
          <div
            className="pd-user-profile-widget"
            onClick={() => onNavigate('profile')}
            role="button"
            tabIndex={0}
            title="Click to view & edit your user profile"
          >
            <div className="pd-user-avatar">
              {initials(patientName)}
            </div>
            <div className="pd-user-info">
              <span className="pd-user-name">{patientName}</span>
              <span className="pd-user-email">{patientEmail}</span>
              <span className="pd-user-view-profile-hint">View Profile &rarr;</span>
            </div>
          </div>

          <button
            type="button"
            className="pd-logout-btn"
            onClick={handleLogoutClick}
            title="Sign out of MediCare"
          >
            <span className="pd-logout-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="pd-logout-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          B. MAIN CONTENT AREA (Light Gray Background)
          ======================================================== */}
      <main className="pd-main-content">
        {/* Top Header Bar */}
        <div className="pd-top-bar">
          <div className="pd-top-bar-left">
            <h2 className="pd-top-page-title">User Dashboard</h2>
            <span className="pd-top-breadcrumbs">MediCare Portal &bull; User Overview</span>
          </div>
          <div className="pd-top-bar-right">
            <button
              type="button"
              className="pd-top-action-btn pd-top-action-btn--primary"
              onClick={() => onNavigate('doctors')}
            >
              + Book New Visit
            </button>
          </div>
        </div>

        {loadError && (
          <div className="pd-alert-banner" role="alert">
            <span className="pd-alert-icon">⚠️</span>
            <span>{loadError}</span>
          </div>
        )}

        {/* ========================================================
            WELCOME BANNER (Wide Blue Gradient)
            ======================================================== */}
        <section className="pd-welcome-banner">
          <div className="pd-welcome-content">
            <span className="pd-welcome-pill">Healthcare Dashboard</span>
            <h1 className="pd-welcome-title">Welcome Back, {patientName}!</h1>
            <p className="pd-welcome-desc">
              Manage your upcoming consultations, view your medical history,
              and stay connected with certified healthcare specialists.
            </p>
            <div className="pd-welcome-actions">
              <button
                type="button"
                className="pd-welcome-find-btn"
                onClick={() => onNavigate('doctors')}
              >
                🩺 Find Doctors &amp; Book
              </button>
            </div>
          </div>
          <div className="pd-welcome-decoration" aria-hidden="true">
            <div className="pd-deco-circle pd-deco-circle--1" />
            <div className="pd-deco-circle pd-deco-circle--2" />
            <span className="pd-deco-icon">🩺</span>
          </div>
        </section>

        {/* ========================================================
            SUMMARY CARDS (3 in one row on desktop)
            ======================================================== */}
        <section className="pd-summary-cards-grid" aria-label="Appointment summary statistics">
          {/* Card 1: Upcoming Appointments */}
          <div
            className="pd-summary-card pd-summary-card--upcoming"
            onClick={() => onNavigate('appointments')}
            role="button"
            tabIndex={0}
          >
            <div className="pd-summary-card-inner">
              <div className="pd-summary-text-group">
                <span className="pd-summary-label">UPCOMING APPOINTMENTS</span>
                <span className="pd-summary-number">{upcomingAppointments.length}</span>
                <span className="pd-summary-subtext">
                  {upcomingAppointments.length === 1 ? '1 visit scheduled' : `${upcomingAppointments.length} visits scheduled`}
                </span>
              </div>
              <div className="pd-summary-icon-box pd-summary-icon-box--blue">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Completed Appointments */}
          <div
            className="pd-summary-card pd-summary-card--completed"
            onClick={() => onNavigate('appointments')}
            role="button"
            tabIndex={0}
          >
            <div className="pd-summary-card-inner">
              <div className="pd-summary-text-group">
                <span className="pd-summary-label">COMPLETED APPOINTMENTS</span>
                <span className="pd-summary-number">{completedAppointments.length}</span>
                <span className="pd-summary-subtext">Archived consultation visits</span>
              </div>
              <div className="pd-summary-icon-box pd-summary-icon-box--green">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Apply as Doctor */}
          <div
            className="pd-summary-card pd-summary-card--apply"
            onClick={() => onNavigate('apply-doctor')}
            role="button"
            tabIndex={0}
          >
            <div className="pd-summary-card-inner">
              <div className="pd-summary-text-group">
                <span className="pd-summary-label">APPLY AS DOCTOR</span>
                <span className="pd-summary-number">{applicationStatusLabel}</span>
                <span className="pd-summary-subtext">
                  Join our panel of certified specialists
                </span>
              </div>
              <div className="pd-summary-icon-box pd-summary-icon-box--amber">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v4" />
                  <path d="M10 5h4" />
                  <path d="M4.5 20.5V19a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v1.5" />
                  <circle cx="12" cy="11" r="4" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            MAIN CONTENT: Full-Width Prominent Sections
            1. Upcoming Appointments
            2. Recent Appointment History
            ======================================================== */}
        <div className="pd-full-sections-column">
          {/* Section 1: Upcoming Appointments */}
          <div className="pd-card pd-prominent-card">
            <div className="pd-card-header">
              <div>
                <h3 className="pd-card-title">Upcoming Appointments</h3>
                <p className="pd-card-subtitle">Your scheduled healthcare specialist consultations</p>
              </div>
              {upcomingAppointments.length > 0 && (
                <button
                  type="button"
                  className="pd-text-action-link"
                  onClick={() => onNavigate('appointments')}
                >
                  View All ({upcomingAppointments.length}) →
                </button>
              )}
            </div>

            <div className="pd-card-body">
              {isLoading ? (
                <div className="pd-loading-box">Checking scheduled appointments...</div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="pd-upcoming-list">
                  {upcomingAppointments.map((appt) => (
                    <div key={appt.id} className="pd-upcoming-item">
                      <div className="pd-upcoming-date-box">
                        <span className="pd-upcoming-date-icon">🗓️</span>
                        <span className="pd-upcoming-date-text">
                          {appt.appointmentDate || appt.date || 'Scheduled'}
                        </span>
                      </div>
                      <div className="pd-upcoming-details">
                        <h4 className="pd-upcoming-doc-name">{appt.doctorName || 'Medical Practitioner'}</h4>
                        <span className="pd-upcoming-spec">{appt.specialization || 'Clinical Specialist'}</span>
                        {appt.reason && <p className="pd-upcoming-reason">Reason: {appt.reason}</p>}
                      </div>
                      <div className="pd-upcoming-actions-group">
                        <span className={`pd-status-pill pd-status-pill--${(appt.status || 'confirmed').toLowerCase()}`}>
                          {appt.status || 'CONFIRMED'}
                        </span>
                        {(appt.status === 'PENDING' || appt.status === 'APPROVED' || appt.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            className="pd-btn-cancel-appt"
                            onClick={() => setConfirmCancelAppt(appt)}
                            title="Cancel this scheduled appointment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state when no upcoming appointments */
                <div className="pd-empty-state-card">
                  <div className="pd-empty-state-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h4 className="pd-empty-state-title">No Upcoming Appointments</h4>
                  <p className="pd-empty-state-desc">
                    You do not have any scheduled appointments right now. Browse our certified doctors
                    and book a convenient consultation slot today.
                  </p>
                  <button
                    type="button"
                    className="pd-btn-primary"
                    onClick={() => onNavigate('doctors')}
                  >
                    Find Doctors
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Recent Appointment History */}
          <div className="pd-card pd-prominent-card">
            <div className="pd-card-header">
              <div>
                <h3 className="pd-card-title">Recent Appointment History</h3>
                <p className="pd-card-subtitle">Archived consultation visits and medical reviews</p>
              </div>
              {pastAppointments.length > 0 && (
                <button
                  type="button"
                  className="pd-text-action-link"
                  onClick={() => onNavigate('appointments')}
                >
                  View Full History →
                </button>
              )}
            </div>

            <div className="pd-card-body">
              {isLoading ? (
                <div className="pd-loading-box">Loading consultation history...</div>
              ) : pastAppointments.length > 0 ? (
                <div className="pd-upcoming-list">
                  {pastAppointments.map((appt) => (
                    <div key={appt.id} className="pd-upcoming-item">
                      <div className="pd-upcoming-date-box pd-upcoming-date-box--past">
                        <span className="pd-upcoming-date-icon">📋</span>
                        <span className="pd-upcoming-date-text">
                          {appt.appointmentDate || appt.date || 'Past Consultation'}
                        </span>
                      </div>
                      <div className="pd-upcoming-details">
                        <h4 className="pd-upcoming-doc-name">{appt.doctorName || 'Doctor Consultation'}</h4>
                        <span className="pd-upcoming-spec">{appt.specialization || 'Medical Service'}</span>
                        {appt.notes && <p className="pd-upcoming-reason">Notes: {appt.notes}</p>}
                      </div>
                      <span className={`pd-status-pill pd-status-pill--${(appt.status || 'completed').toLowerCase()}`}>
                        {appt.status || 'COMPLETED'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state when no past appointments */
                <div className="pd-empty-state-card">
                  <div className="pd-empty-state-icon pd-empty-state-icon--folder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h4 className="pd-empty-state-title">No Completed Consultation History</h4>
                  <p className="pd-empty-state-desc">
                    Your past consultations, doctor clinical notes, and treatment records will appear here
                    following your completed appointments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationModal
        isOpen={Boolean(confirmCancelAppt)}
        title="Cancel Appointment Confirmation"
        message="Are you sure you want to cancel this scheduled appointment? This action will immediately release your time slot back to the doctor's calendar."
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={() => executeCancel(confirmCancelAppt.id)}
        onCancel={() => setConfirmCancelAppt(null)}
        details={[
          { label: 'Doctor', value: confirmCancelAppt?.doctorName || 'Specialist' },
          { label: 'Specialization', value: confirmCancelAppt?.specialization || confirmCancelAppt?.doctorSpecialization || 'Clinical' },
          { label: 'Scheduled Date', value: confirmCancelAppt?.appointmentDate || confirmCancelAppt?.date },
          {
            label: 'Time',
            value: confirmCancelAppt?.appointmentTime
              ? confirmCancelAppt.appointmentTime.substring(0, 5)
              : 'Scheduled',
          },
          { label: 'Booking ID', value: `#${confirmCancelAppt?.id}` },
        ]}
      />
    </div>
  );
}

export default PatientDashboard;
