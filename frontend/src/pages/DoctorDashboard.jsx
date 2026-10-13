import { useState, useEffect } from 'react';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorDashboard,
  getDoctorAppointments,
  updateDoctorAppointmentStatus,
  getMyDoctorSlots,
  createDoctorSlot,
  deleteDoctorSlot,
  getStoredUser,
  logout,
} from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './DoctorDashboard.css';

export function DoctorDashboard({ onNavigate, onLogout }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [profile, setProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Active section inside the doctor portal: 'overview' | 'appointments' | 'slots' | 'profile'
  const [activeSection, setActiveSection] = useState('overview');

  // Appointments filter tab
  const [activeApptTab, setActiveApptTab] = useState('pending');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New slot creation state
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [newSlot, setNewSlot] = useState({
    slotDate: tomorrowStr(),
    startTime: '09:00',
    endTime: '09:30',
  });
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);

  // Profile form state for in-portal profile editing
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    specialization: '',
    qualifications: '',
    experience: 0,
    consultationFee: 0,
    bio: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [profData, statsData, apptsData, slotsData] = await Promise.all([
        getDoctorProfile().catch(() => null),
        getDoctorDashboard().catch(() => null),
        getDoctorAppointments().catch(() => []),
        getMyDoctorSlots().catch(() => []),
      ]);

      if (profData) {
        setProfile(profData);
        setProfileForm({
          fullName: profData.fullName || '',
          phoneNumber: profData.phoneNumber || '',
          specialization: profData.specialization || '',
          qualifications: profData.qualifications || '',
          experience: profData.experience || 0,
          consultationFee: profData.consultationFee || 0,
          bio: profData.bio || '',
        });
      }
      if (statsData) setDashboardStats(statsData);
      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setSlots(Array.isArray(slotsData) ? slotsData : []);
    } catch (err) {
      setNotice({ type: 'warning', message: err.message || 'Unable to load doctor portal data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
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

  const handleStatusChange = async (appointmentId, newStatus) => {
    setActionLoadingId(appointmentId);
    try {
      const updated = await updateDoctorAppointmentStatus(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a))
      );
      setNotice({
        type: 'success',
        message: `Appointment #${appointmentId} status successfully marked as ${newStatus}.`,
      });
      // Refresh full appointments list, metrics & slot status
      const freshAppts = await getDoctorAppointments().catch(() => null);
      if (Array.isArray(freshAppts)) setAppointments(freshAppts);
      getDoctorDashboard().then((s) => s && setDashboardStats(s)).catch(() => {});
      getMyDoctorSlots().then((sl) => Array.isArray(sl) && setSlots(sl)).catch(() => {});
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update appointment status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.slotDate || !newSlot.startTime || !newSlot.endTime) {
      setNotice({ type: 'warning', message: 'Please provide consultation date, start time, and end time.' });
      return;
    }

    if (newSlot.endTime <= newSlot.startTime) {
      setNotice({ type: 'warning', message: 'End time must be after start time.' });
      return;
    }

    setIsCreatingSlot(true);
    try {
      const created = await createDoctorSlot(newSlot);
      setSlots((prev) =>
        [...prev, created].sort(
          (a, b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime)
        )
      );
      setNotice({
        type: 'success',
        message: `New consultation slot on ${created.slotDate} (${created.startTime.substring(0, 5)} - ${created.endTime.substring(0, 5)}) is now open for patient bookings!`,
      });
      getDoctorDashboard().then((s) => s && setDashboardStats(s)).catch(() => {});
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to open slot. Check for overlapping hours.' });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove this unbooked consultation slot?')) return;
    setDeletingSlotId(slotId);
    try {
      await deleteDoctorSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      setNotice({ type: 'success', message: 'Consultation slot successfully removed from your calendar.' });
      getDoctorDashboard().then((s) => s && setDashboardStats(s)).catch(() => {});
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete slot.' });
    } finally {
      setDeletingSlotId(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await updateDoctorProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        specialization: profileForm.specialization.trim(),
        qualifications: profileForm.qualifications.trim(),
        experience: Number(profileForm.experience),
        consultationFee: Number(profileForm.consultationFee),
        bio: profileForm.bio.trim(),
      });
      setProfile(updated);
      setCurrentUser((prev) => ({ ...prev, fullName: updated.fullName }));
      setNotice({ type: 'success', message: 'Doctor profile updated successfully!' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const doctorName = profile?.fullName || currentUser?.fullName || 'Doctor';
  const doctorInitials = doctorName
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'DR';

  const pendingList = appointments.filter((a) => a.status === 'PENDING');
  const approvedList = appointments.filter((a) => a.status === 'APPROVED');
  const completedList = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelledList = appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED');

  const filteredAppointments = appointments.filter((a) => {
    if (activeApptTab === 'pending') return a.status === 'PENDING';
    if (activeApptTab === 'approved') return a.status === 'APPROVED';
    if (activeApptTab === 'completed') return a.status === 'COMPLETED';
    if (activeApptTab === 'cancelled') return a.status === 'CANCELLED' || a.status === 'REJECTED';
    return true;
  });

  if (isLoading) {
    return (
      <div className="dd-dashboard-wrapper">
        <div className="dd-loading-full">
          <div className="dd-spinner"></div>
          <p>Loading Doctor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-dashboard-wrapper">
      {/* Mobile Header Bar */}
      <header className="dd-mobile-header">
        <div className="dd-logo-brand" onClick={() => setActiveSection('overview')}>
          <img src={logoMark} alt="MediCare logo" className="dd-logo-mark" />
          <span className="dd-logo-text">MediCare</span>
        </div>
        <button
          type="button"
          className="dd-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ========================================================
          A. LEFT SIDEBAR (Dark Navy Background)
          ======================================================== */}
      <aside className={`dd-sidebar ${mobileMenuOpen ? 'dd-sidebar--open' : ''}`}>
        {/* Brand Logo at top */}
        <div className="dd-sidebar-top">
          <div className="dd-sidebar-logo" onClick={() => { setActiveSection('overview'); setMobileMenuOpen(false); }}>
            <img src={logoMark} alt="MediCare logo" className="dd-logo-mark" />
            <div className="dd-logo-title-group">
              <span className="dd-logo-text">MediCare</span>
              <span className="dd-logo-tagline">Doctor Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Items - Purely Doctor Workflows */}
        <nav className="dd-sidebar-nav">
          <ul className="dd-nav-list">
            {/* 1. Dashboard / Overview */}
            <li className="dd-nav-item">
              <button
                type="button"
                className={`dd-nav-link ${activeSection === 'overview' ? 'dd-nav-link--active' : ''}`}
                onClick={() => { setActiveSection('overview'); setMobileMenuOpen(false); }}
              >
                <span className="dd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span className="dd-nav-label">Dashboard</span>
              </button>
            </li>

            {/* 2. Appointments */}
            <li className="dd-nav-item">
              <button
                type="button"
                className={`dd-nav-link ${activeSection === 'appointments' ? 'dd-nav-link--active' : ''}`}
                onClick={() => { setActiveSection('appointments'); setMobileMenuOpen(false); }}
              >
                <span className="dd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="dd-nav-label">Appointments</span>
                {pendingList.length > 0 && (
                  <span className="dd-nav-pill-badge">{pendingList.length}</span>
                )}
              </button>
            </li>

            {/* 3. Schedule & Slots */}
            <li className="dd-nav-item">
              <button
                type="button"
                className={`dd-nav-link ${activeSection === 'slots' ? 'dd-nav-link--active' : ''}`}
                onClick={() => { setActiveSection('slots'); setMobileMenuOpen(false); }}
              >
                <span className="dd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="dd-nav-label">Schedule &amp; Slots</span>
              </button>
            </li>

            {/* 4. Doctor Profile */}
            <li className="dd-nav-item">
              <button
                type="button"
                className={`dd-nav-link ${activeSection === 'profile' ? 'dd-nav-link--active' : ''}`}
                onClick={() => { setActiveSection('profile'); setMobileMenuOpen(false); }}
              >
                <span className="dd-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="dd-nav-label">My Profile</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer with Doctor Profile Widget (Clickable) */}
        <div className="dd-sidebar-footer">
          <div
            className="dd-user-profile-widget"
            onClick={() => { setActiveSection('profile'); setMobileMenuOpen(false); }}
            title="Click to view and edit doctor profile"
          >
            <div className="dd-user-avatar">{doctorInitials}</div>
            <div className="dd-user-meta">
              <span className="dd-user-name">Dr. {doctorName.replace(/^Dr\.\s*/i, '')}</span>
              <span className="dd-user-spec">{profile?.specialization || 'Clinical Specialist'}</span>
            </div>
            <span className="dd-user-arrow">↗</span>
          </div>

          <button
            type="button"
            className="dd-logout-button"
            onClick={handleLogoutClick}
            title="Sign out of Doctor Portal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          B. MAIN CONTENT AREA
          ======================================================== */}
      <main className="dd-main-content">
        {/* Top Header Bar */}
        <header className="dd-content-header">
          <div>
            <h1 className="dd-page-title">
              {activeSection === 'overview' && `Welcome, Dr. ${doctorName.replace(/^Dr\.\s*/i, '')}`}
              {activeSection === 'appointments' && 'Patient Consultations & Requests'}
              {activeSection === 'slots' && 'Consultation Schedule & Slot Management'}
              {activeSection === 'profile' && 'Practitioner Professional Profile'}
            </h1>
            <p className="dd-page-subtitle">
              {activeSection === 'overview' && 'Overview of your consultations, incoming requests, and open slots.'}
              {activeSection === 'appointments' && 'Review and respond to incoming patient bookings with instant status updates.'}
              {activeSection === 'slots' && 'Publish, review, and manage online appointment slots on your calendar.'}
              {activeSection === 'profile' && 'Manage your clinical qualifications, outpatient fees, contact number, and biography.'}
            </p>
          </div>
          <div className="dd-header-badges">
            <span className="dd-verified-badge">✓ Verified Practitioner</span>
            <span className="dd-fee-badge">Fee: ₹{profile?.consultationFee || '500'}</span>
          </div>
        </header>

        {notice && (
          <div className={`dd-alert-banner ${notice.type}`}>
            <span>{notice.message}</span>
            <button type="button" className="dd-alert-close" onClick={() => setNotice(null)}>✕</button>
          </div>
        )}

        {/* ====================================================
            VIEW 1: OVERVIEW / DASHBOARD
            ==================================================== */}
        {activeSection === 'overview' && (
          <div className="dd-section-container">
            {/* KPI Stat Cards */}
            <div className="dd-stats-grid">
              <div className="dd-stat-card amber" onClick={() => { setActiveSection('appointments'); setActiveApptTab('pending'); }}>
                <div className="dd-stat-icon">⏳</div>
                <div className="dd-stat-body">
                  <span className="dd-stat-val">{dashboardStats?.pendingRequestsCount ?? pendingList.length}</span>
                  <span className="dd-stat-label">Pending Requests</span>
                  <span className="dd-stat-hint">Requires response</span>
                </div>
              </div>

              <div className="dd-stat-card blue" onClick={() => { setActiveSection('appointments'); setActiveApptTab('approved'); }}>
                <div className="dd-stat-icon">📅</div>
                <div className="dd-stat-body">
                  <span className="dd-stat-val">{dashboardStats?.confirmedAppointmentsCount ?? approvedList.length}</span>
                  <span className="dd-stat-label">Confirmed Visits</span>
                  <span className="dd-stat-hint">Scheduled patients</span>
                </div>
              </div>

              <div className="dd-stat-card teal" onClick={() => setActiveSection('slots')}>
                <div className="dd-stat-icon">⏰</div>
                <div className="dd-stat-body">
                  <span className="dd-stat-val">{dashboardStats?.availableSlotsCount ?? slots.filter((s) => s.status === 'AVAILABLE').length}</span>
                  <span className="dd-stat-label">Available Slots</span>
                  <span className="dd-stat-hint">Open for booking</span>
                </div>
              </div>

              <div className="dd-stat-card green" onClick={() => setActiveSection('profile')}>
                <div className="dd-stat-icon">🩺</div>
                <div className="dd-stat-body">
                  <span className="dd-stat-val">₹{profile?.consultationFee || '500'}</span>
                  <span className="dd-stat-label">Consultation Fee</span>
                  <span className="dd-stat-hint">{profile?.specialization || 'Clinical Specialist'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Today's Consultations */}
            <div className="dd-card">
              <div className="dd-card-header">
                <div>
                  <h3 className="dd-card-title">Pending Consultation Requests</h3>
                  <p className="dd-card-desc">Patients awaiting your confirmation</p>
                </div>
                <button
                  type="button"
                  className="dd-text-btn"
                  onClick={() => { setActiveSection('appointments'); setActiveApptTab('pending'); }}
                >
                  View All Requests →
                </button>
              </div>
              <div className="dd-card-content">
                {pendingList.length > 0 ? (
                  <div className="dd-req-list">
                    {pendingList.slice(0, 3).map((appt) => (
                      <div key={appt.id} className="dd-req-row">
                        <div className="dd-req-patient-info">
                          <h4 className="dd-req-patient-name">{appt.patientName || 'Registered Patient'}</h4>
                          <span className="dd-req-meta">
                            🗓️ {appt.appointmentDate} • ⏰ {appt.appointmentTime ? appt.appointmentTime.substring(0, 5) : ''}
                            {appt.patientPhone ? ` • 📞 ${appt.patientPhone}` : ''}
                          </span>
                          <p className="dd-req-reason"><strong>Reason:</strong> {appt.reason || 'General medical examination'}</p>
                        </div>
                        <div className="dd-req-actions">
                          <button
                            type="button"
                            className="dd-btn-success"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'APPROVED')}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            className="dd-btn-danger"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'REJECTED')}
                          >
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dd-empty-box">
                    <p>🎉 All incoming requests have been reviewed! No pending bookings.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Schedule Preview */}
            <div className="dd-card">
              <div className="dd-card-header">
                <div>
                  <h3 className="dd-card-title">Upcoming Consultation Slots</h3>
                  <p className="dd-card-desc">Active slots visible to patients in the MediCare directory</p>
                </div>
                <button
                  type="button"
                  className="dd-text-btn"
                  onClick={() => setActiveSection('slots')}
                >
                  Manage Calendar Slots →
                </button>
              </div>
              <div className="dd-card-content">
                {slots.length > 0 ? (
                  <div className="dd-slots-grid">
                    {slots.slice(0, 6).map((slot) => (
                      <div key={slot.id} className={`dd-slot-chip ${slot.status === 'BOOKED' ? 'booked' : 'available'}`}>
                        <span className="dd-slot-date">🗓️ {slot.slotDate}</span>
                        <span className="dd-slot-time">⏰ {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                        <span className="dd-slot-badge">{slot.status === 'BOOKED' ? '🔒 Booked' : '✓ Open'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dd-empty-box">
                    <p>No consultation slots currently listed. Use the Schedule section to open booking slots.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            VIEW 2: APPOINTMENTS & PATIENTS
            ==================================================== */}
        {activeSection === 'appointments' && (
          <div className="dd-section-container">
            <div className="dd-tabs-bar">
              <button
                type="button"
                className={`dd-tab-btn ${activeApptTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveApptTab('pending')}
              >
                Pending Requests ({pendingList.length})
              </button>
              <button
                type="button"
                className={`dd-tab-btn ${activeApptTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveApptTab('approved')}
              >
                Confirmed Visits ({approvedList.length})
              </button>
              <button
                type="button"
                className={`dd-tab-btn ${activeApptTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveApptTab('completed')}
              >
                Completed ({completedList.length})
              </button>
              <button
                type="button"
                className={`dd-tab-btn ${activeApptTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveApptTab('cancelled')}
              >
                Cancelled / Declined ({cancelledList.length})
              </button>
              <button
                type="button"
                className={`dd-tab-btn ${activeApptTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveApptTab('all')}
              >
                All Consultations ({appointments.length})
              </button>
            </div>

            {filteredAppointments.length > 0 ? (
              <div className="dd-appointments-grid">
                {filteredAppointments.map((appt) => (
                  <div key={appt.id} className="dd-appt-card">
                    <div className="dd-appt-card-top">
                      <div>
                        <span className="dd-appt-date-tag">
                          🗓️ {appt.appointmentDate} • ⏰ {appt.appointmentTime ? appt.appointmentTime.substring(0, 5) : ''}
                        </span>
                        <h3 className="dd-appt-patient-title">{appt.patientName || 'Registered Patient'}</h3>
                        <p className="dd-appt-contact">
                          {appt.patientPhone && <span>📞 {appt.patientPhone}</span>}
                          {appt.patientEmail && <span>✉️ {appt.patientEmail}</span>}
                        </p>
                      </div>
                      <span className={`dd-status-badge ${appt.status.toLowerCase()}`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="dd-appt-reason-box">
                      <strong>Chief Complaint / Reason for Visit:</strong>
                      <p>{appt.reason || 'General routine consultation'}</p>
                    </div>

                    <div className="dd-appt-details-row">
                      <span>Booking ID: #{appt.id}</span>
                      <span>Consultation Fee: ₹{appt.consultationFee || profile?.consultationFee || '500'}</span>
                    </div>

                    <div className="dd-appt-actions-bar">
                      {appt.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="dd-btn-success"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'APPROVED')}
                          >
                            ✓ Accept &amp; Confirm Visit
                          </button>
                          <button
                            type="button"
                            className="dd-btn-danger"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'REJECTED')}
                          >
                            ✕ Decline Request
                          </button>
                        </>
                      )}

                      {appt.status === 'APPROVED' && (
                        <>
                          <button
                            type="button"
                            className="dd-btn-primary"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                          >
                            ✓ Mark Consultation Completed
                          </button>
                          <button
                            type="button"
                            className="dd-btn-outline"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                          >
                            Cancel Consultation
                          </button>
                        </>
                      )}

                      {appt.status === 'COMPLETED' && (
                        <span className="dd-text-muted">✓ Consultation marked as completed</span>
                      )}

                      {(appt.status === 'CANCELLED' || appt.status === 'REJECTED') && (
                        <span className="dd-text-muted">✕ Consultation cancelled and slot freed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dd-empty-view">
                <div className="dd-empty-icon">📅</div>
                <h3>No {activeApptTab} consultations found</h3>
                <p>When patient bookings match this status filter, they will be displayed here.</p>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            VIEW 3: SCHEDULE & SLOTS MANAGER
            ==================================================== */}
        {activeSection === 'slots' && (
          <div className="dd-section-container">
            {/* Slot Creator Card */}
            <div className="dd-card">
              <div className="dd-card-header">
                <div>
                  <h3 className="dd-card-title">Open New Consultation Slot</h3>
                  <p className="dd-card-desc">Publish bookable calendar time slots for patients searching in the MediCare directory</p>
                </div>
              </div>
              <div className="dd-card-content">
                <form className="dd-slot-form" onSubmit={handleCreateSlot}>
                  <div className="dd-form-row">
                    <div className="dd-form-field">
                      <label htmlFor="form-slot-date">Consultation Date</label>
                      <input
                        id="form-slot-date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={newSlot.slotDate}
                        onChange={(e) => setNewSlot((prev) => ({ ...prev, slotDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="dd-form-field">
                      <label htmlFor="form-start-time">Start Time</label>
                      <input
                        id="form-start-time"
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="dd-form-field">
                      <label htmlFor="form-end-time">End Time</label>
                      <input
                        id="form-end-time"
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="dd-form-action">
                      <button
                        type="submit"
                        className="dd-btn-primary"
                        disabled={isCreatingSlot}
                      >
                        {isCreatingSlot ? 'Publishing...' : '+ Publish Slot to Calendar'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing Slots List */}
            <div className="dd-card">
              <div className="dd-card-header">
                <div>
                  <h3 className="dd-card-title">Your Scheduled Consultation Slots ({slots.length})</h3>
                  <p className="dd-card-desc">Active slots visible to patients for online appointment bookings</p>
                </div>
              </div>
              <div className="dd-card-content">
                {slots.length > 0 ? (
                  <div className="dd-slots-schedule-grid">
                    {slots.map((slot) => (
                      <div key={slot.id} className={`dd-slot-item ${slot.status === 'BOOKED' ? 'booked' : 'available'}`}>
                        <div className="dd-slot-item-top">
                          <span className="dd-slot-item-date">🗓️ {slot.slotDate}</span>
                          <span className={`dd-slot-status-pill ${slot.status.toLowerCase()}`}>
                            {slot.status === 'BOOKED' ? '🔒 Booked' : '✓ Open'}
                          </span>
                        </div>
                        <div className="dd-slot-item-time">
                          ⏰ {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                        </div>
                        <div className="dd-slot-item-bottom">
                          {slot.status === 'AVAILABLE' ? (
                            <button
                              type="button"
                              className="dd-slot-del-btn"
                              disabled={deletingSlotId === slot.id}
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              {deletingSlotId === slot.id ? 'Removing...' : '🗑️ Remove Slot'}
                            </button>
                          ) : (
                            <span className="dd-slot-booked-note">Reserved by Patient</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dd-empty-view">
                    <p>You have not published any consultation slots yet. Use the form above to add your first slot.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            VIEW 4: DOCTOR PROFILE EDITOR
            ==================================================== */}
        {activeSection === 'profile' && (
          <div className="dd-section-container">
            <div className="dd-card">
              <div className="dd-card-header">
                <div>
                  <h3 className="dd-card-title">Practitioner Profile &amp; Clinical Information</h3>
                  <p className="dd-card-desc">Keep your medical qualifications, clinic fee, and contact information up-to-date</p>
                </div>
              </div>
              <div className="dd-card-content">
                <form className="dd-profile-form" onSubmit={handleSaveProfile}>
                  <div className="dd-form-grid-2">
                    <div className="dd-form-field">
                      <label htmlFor="p-fullname">Full Name (with Dr. prefix)</label>
                      <input
                        id="p-fullname"
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="dd-form-field">
                      <label htmlFor="p-phone">Contact Phone Number</label>
                      <input
                        id="p-phone"
                        type="text"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="dd-form-field">
                      <label htmlFor="p-spec">Medical Specialization</label>
                      <input
                        id="p-spec"
                        type="text"
                        placeholder="e.g. Cardiology, Dermatology, General Medicine"
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, specialization: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="dd-form-field">
                      <label htmlFor="p-qual">Clinical Qualifications</label>
                      <input
                        id="p-qual"
                        type="text"
                        placeholder="e.g. MBBS, MD, DM"
                        value={profileForm.qualifications}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, qualifications: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="dd-form-field">
                      <label htmlFor="p-exp">Years of Experience</label>
                      <input
                        id="p-exp"
                        type="number"
                        min="0"
                        value={profileForm.experience}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, experience: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="dd-form-field">
                      <label htmlFor="p-fee">Consultation Fee (₹ INR)</label>
                      <input
                        id="p-fee"
                        type="number"
                        min="0"
                        value={profileForm.consultationFee}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, consultationFee: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="dd-form-field" style={{ marginTop: '16px' }}>
                    <label htmlFor="p-bio">Professional Biography</label>
                    <textarea
                      id="p-bio"
                      rows="4"
                      placeholder="Brief overview of clinical expertise and patient care focus..."
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    ></textarea>
                  </div>

                  <div className="dd-profile-form-actions">
                    <button
                      type="submit"
                      className="dd-btn-primary"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? 'Saving Changes...' : 'Save Doctor Profile'}
                    </button>
                    <button
                      type="button"
                      className="dd-btn-outline"
                      onClick={() => setActiveSection('overview')}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorDashboard;
