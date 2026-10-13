import { useState, useEffect } from 'react';
import {
  getAdminUsers,
  getAdminDoctors,
  updateDoctorApproval,
  getDoctorAnalytics,
  getAdminProfile,
  updateAdminProfile,
  getAdminDoctorApplications,
  reviewDoctorApplication,
  doctorApplicationCredentialsUrl,
  getStoredUser,
  setStoredUser,
  logout,
} from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './AdminDashboard.css';

export function AdminDashboard({ onNavigate, onLogout }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Active navigation tab: 'overview' | 'doctors' | 'applications' | 'users' | 'analytics' | 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Doctor tab filter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [doctorFilter, setDoctorFilter] = useState('PENDING');
  const [actionDoctorId, setActionDoctorId] = useState(null);

  // Doctor-application review state
  const [applicationFilter, setApplicationFilter] = useState('PENDING');
  const [reviewingAppId, setReviewingAppId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  // User tab search & filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, doctorsData, analyticsData, profileData, applicationsData] = await Promise.all([
        getAdminUsers().catch(() => []),
        getAdminDoctors().catch(() => []),
        getDoctorAnalytics().catch(() => []),
        getAdminProfile().catch(() => null),
        getAdminDoctorApplications().catch(() => []),
      ]);

      const safeUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(safeUsers);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setAnalytics(Array.isArray(analyticsData) ? analyticsData : []);

      if (profileData) {
        setAdminProfile(profileData);
        setProfileForm({
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || '',
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.message || 'Unable to load records.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      if (onNavigate) onNavigate('home');
    }
  };

  // Doctor Approval / Rejection Action
  const handleDoctorStatus = async (doctorId, newStatus) => {
    setActionDoctorId(doctorId);
    try {
      const updated = await updateDoctorApproval(doctorId, newStatus);
      setDoctors((prev) =>
        prev.map((doc) => (doc.id === doctorId ? { ...doc, approvalStatus: updated.approvalStatus } : doc))
      );
      setNotice({
        type: 'success',
        message: `Doctor "${updated.fullName}" updated to ${newStatus}. ${
          newStatus === 'APPROVED' ? 'Now visible in Find Doctors.' : ''
        }`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.message || `Failed to update status to ${newStatus}.`,
      });
    } finally {
      setActionDoctorId(null);
    }
  };

  // Doctor Application Review Action
  const handleApplicationReview = async (applicationId, approvalStatus) => {
    setReviewingAppId(applicationId);
    try {
      const updated = await reviewDoctorApplication(
        applicationId,
        approvalStatus,
        (reviewNotes[applicationId] || '').trim()
      );
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, ...updated } : app))
      );
      setReviewNotes((prev) => ({ ...prev, [applicationId]: '' }));
      setNotice({
        type: 'success',
        message: `Application from "${updated.fullName}" ${approvalStatus}.`,
      });
      if (approvalStatus === 'APPROVED') {
        loadData();
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.message || `Failed to ${approvalStatus} the application.`,
      });
    } finally {
      setReviewingAppId(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await updateAdminProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        address: profileForm.address.trim(),
      });
      setAdminProfile(updated);
      setCurrentUser((prev) => ({ ...prev, fullName: updated.fullName }));
      const stored = getStoredUser();
      if (stored) {
        stored.fullName = updated.fullName;
        setStoredUser(stored);
      }
      setNotice({
        type: 'success',
        message: 'Admin profile updated successfully.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to update admin profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pendingDoctors = doctors.filter((d) => d.approvalStatus === 'PENDING');
  const approvedDoctors = doctors.filter((d) => d.approvalStatus === 'APPROVED');
  const rejectedDoctors = doctors.filter((d) => d.approvalStatus === 'REJECTED');

  const pendingApplications = applications.filter((a) => a.status === 'PENDING');
  const approvedApplications = applications.filter((a) => a.status === 'APPROVED');
  const rejectedApplications = applications.filter((a) => a.status === 'REJECTED');

  const filteredApplications = applications.filter((a) => {
    if (applicationFilter === 'ALL') return true;
    return a.status === applicationFilter;
  });

  const filteredDoctors = doctors.filter((d) => {
    if (doctorFilter === 'ALL') return true;
    return d.approvalStatus === doctorFilter;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const patientCount = users.filter((u) => u.role === 'PATIENT').length;
  const doctorUserCount = users.filter((u) => u.role === 'DOCTOR').length;

  // Analytics totals
  const totalTreatedToday = analytics.reduce((sum, item) => sum + (Number(item.patientsTreatedToday) || 0), 0);
  const totalScheduledToday = analytics.reduce((sum, item) => sum + (Number(item.todayScheduled) || 0), 0);
  const totalCompletedAllTime = analytics.reduce((sum, item) => sum + (Number(item.totalCompleted) || 0), 0);

  if (isLoading) {
    return (
      <div className="ad-dashboard-wrapper">
        <div className="ad-loading-full">
          <div className="ad-spinner"></div>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-dashboard-wrapper">
      {/* Mobile Header Bar */}
      <header className="ad-mobile-header">
        <div className="ad-logo-brand" onClick={() => setActiveTab('overview')}>
          <img src={logoMark} alt="MediCare logo" className="ad-logo-mark" />
          <span className="ad-logo-text">MediCare</span>
        </div>
        <button
          type="button"
          className="ad-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ========================================================
          A. LEFT SIDEBAR (Dark Navy Background #0b1329)
          ======================================================== */}
      <aside className={`ad-sidebar ${mobileMenuOpen ? 'ad-sidebar--open' : ''}`}>
        {/* Brand Logo at top */}
        <div className="ad-sidebar-top">
          <div
            className="ad-sidebar-logo"
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <img src={logoMark} alt="MediCare logo" className="ad-logo-mark" />
            <div className="ad-logo-title-group">
              <span className="ad-logo-text">MediCare</span>
              <span className="ad-logo-tagline">Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="ad-sidebar-nav">
          <ul className="ad-nav-list">
            {/* 1. Overview */}
            <li className="ad-nav-item">
              <button
                type="button"
                className={`ad-nav-link ${activeTab === 'overview' ? 'ad-nav-link--active' : ''}`}
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
              >
                <span className="ad-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span className="ad-nav-label">Dashboard</span>
              </button>
            </li>

            {/* 2. Doctor Approvals */}
            <li className="ad-nav-item">
              <button
                type="button"
                className={`ad-nav-link ${activeTab === 'doctors' ? 'ad-nav-link--active' : ''}`}
                onClick={() => {
                  setActiveTab('doctors');
                  setMobileMenuOpen(false);
                }}
              >
                <span className="ad-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <span className="ad-nav-label">Doctor Approvals</span>
                {pendingDoctors.length > 0 && (
                  <span className="ad-nav-pill-badge">{pendingDoctors.length}</span>
                )}
              </button>
            </li>

            {/* 3. Doctor Applications */}
            <li className="ad-nav-item">
              <button
                type="button"
                className={`ad-nav-link ${activeTab === 'applications' ? 'ad-nav-link--active' : ''}`}
                onClick={() => {
                  setActiveTab('applications');
                  setMobileMenuOpen(false);
                }}
              >
                <span className="ad-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <span className="ad-nav-label">Applications</span>
                {pendingApplications.length > 0 && (
                  <span className="ad-nav-pill-badge">{pendingApplications.length}</span>
                )}
              </button>
            </li>

            {/* 4. User Directory & Roles */}
            <li className="ad-nav-item">
              <button
                type="button"
                className={`ad-nav-link ${activeTab === 'users' ? 'ad-nav-link--active' : ''}`}
                onClick={() => {
                  setActiveTab('users');
                  setMobileMenuOpen(false);
                }}
              >
                <span className="ad-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="ad-nav-label">Users</span>
              </button>
            </li>

            {/* 5. Doctor Analytics (replaces Security & Health) */}
            <li className="ad-nav-item">
              <button
                type="button"
                className={`ad-nav-link ${activeTab === 'analytics' ? 'ad-nav-link--active' : ''}`}
                onClick={() => {
                  setActiveTab('analytics');
                  setMobileMenuOpen(false);
                }}
              >
                <span className="ad-nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </span>
                <span className="ad-nav-label">Doctor Analytics</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer with Admin Profile & Logout */}
        <div className="ad-sidebar-footer">
          <div
            className={`ad-user-profile-widget ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            title="Click to edit admin profile"
          >
            <div className="ad-user-avatar">
              {(adminProfile?.fullName || currentUser?.fullName || 'SA')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0].toUpperCase())
                .join('') || 'SA'}
            </div>
            <div className="ad-user-meta">
              <span className="ad-user-name">
                {adminProfile?.fullName || currentUser?.fullName || 'System Admin'}
              </span>
              <span className="ad-user-spec">Administrator &bull; Edit Profile ✎</span>
            </div>
          </div>
          <button
            type="button"
            className="ad-logout-button"
            onClick={handleSignOut}
            title="Sign out of MediCare Admin Portal"
          >
            <span>⎋</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          B. MAIN CONTENT WORKSPACE
          ======================================================== */}
      <main className="ad-main-content">
        {/* Notice Alert Banner */}
        {notice && (
          <div className={`ad-notice ${notice.type}`} role="alert">
            <span>{notice.message}</span>
            <button
              type="button"
              className="ad-notice-close"
              onClick={() => setNotice(null)}
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        {/* ======================================================
            TAB 1: OVERVIEW DASHBOARD
            ====================================================== */}
        {activeTab === 'overview' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Admin Dashboard</h1>
                <p className="ad-page-subtitle">
                  Platform overview, doctor approvals, and patient consultation metrics.
                </p>
              </div>
              <div className="ad-header-badges">
                <span className="ad-badge ad-badge-purple">Administrator</span>
              </div>
            </header>

            {/* KPI Stat Cards */}
            <div className="ad-stats-grid">
              <div className="ad-stat-card blue" onClick={() => setActiveTab('users')}>
                <div className="ad-stat-icon">👥</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{users.length}</span>
                  <span className="ad-stat-label">Total Users</span>
                  <span className="ad-stat-hint">{patientCount} patients, {doctorUserCount} doctors</span>
                </div>
              </div>

              <div className="ad-stat-card amber" onClick={() => { setActiveTab('doctors'); setDoctorFilter('PENDING'); }}>
                <div className="ad-stat-icon">📋</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{pendingDoctors.length}</span>
                  <span className="ad-stat-label">Pending Approvals</span>
                  <span className="ad-stat-hint">Doctors awaiting review</span>
                </div>
              </div>

              <div className="ad-stat-card purple" onClick={() => { setActiveTab('doctors'); setDoctorFilter('APPROVED'); }}>
                <div className="ad-stat-icon">🩺</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{approvedDoctors.length}</span>
                  <span className="ad-stat-label">Active Doctors</span>
                  <span className="ad-stat-hint">Approved specialists</span>
                </div>
              </div>

              <div className="ad-stat-card green" onClick={() => setActiveTab('analytics')}>
                <div className="ad-stat-icon">📊</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{totalTreatedToday}</span>
                  <span className="ad-stat-label">Treated Today</span>
                  <span className="ad-stat-hint">{totalScheduledToday} scheduled visits today</span>
                </div>
              </div>
            </div>

            {/* Section: Pending Doctor Verifications Quick Review */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <h3 className="ad-card-title">Pending Doctor Approvals</h3>
                  <p className="ad-card-desc">Review doctor profiles before they appear in public search</p>
                </div>
                <button
                  type="button"
                  className="ad-text-btn"
                  onClick={() => { setActiveTab('doctors'); setDoctorFilter('ALL'); }}
                >
                  View All Doctors ({doctors.length}) →
                </button>
              </div>
              <div className="ad-card-content">
                {pendingDoctors.length > 0 ? (
                  <div className="ad-doc-list">
                    {pendingDoctors.map((doc) => (
                      <div key={doc.id} className="ad-doc-row">
                        <div className="ad-doc-info">
                          <div className="ad-doc-header">
                            <h4 className="ad-doc-name">{doc.fullName}</h4>
                            <span className="ad-status-pill pending">Pending</span>
                          </div>
                          <div className="ad-doc-spec">🩺 {doc.specialization} &bull; {doc.experience} Years Exp.</div>
                          <div className="ad-doc-details-grid">
                            <div>📞 <strong>Phone:</strong> {doc.phoneNumber || 'Not provided'}</div>
                            <div>🎓 <strong>Qualifications:</strong> {doc.qualifications || 'MBBS'}</div>
                            <div>💳 <strong>Fee:</strong> ₹{doc.consultationFee || 500}</div>
                          </div>
                          {doc.bio && <p className="ad-doc-bio">{doc.bio}</p>}
                        </div>
                        <div className="ad-doc-actions">
                          <button
                            type="button"
                            className="ad-btn-approve"
                            disabled={actionDoctorId === doc.id}
                            onClick={() => handleDoctorStatus(doc.id, 'APPROVED')}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            className="ad-btn-reject"
                            disabled={actionDoctorId === doc.id}
                            onClick={() => handleDoctorStatus(doc.id, 'REJECTED')}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-view">
                    <p>No pending doctor approvals at this time.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Treatment Activity Quick Overview */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <h3 className="ad-card-title">Today's Doctor Activity</h3>
                  <p className="ad-card-desc">Patient consultations handled by doctors today</p>
                </div>
                <button
                  type="button"
                  className="ad-text-btn"
                  onClick={() => setActiveTab('analytics')}
                >
                  Full Analytics →
                </button>
              </div>
              <div className="ad-card-content">
                {analytics.length > 0 ? (
                  <div className="ad-table-wrapper">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Treated Today</th>
                          <th>Scheduled Today</th>
                          <th>Completed (Total)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.slice(0, 4).map((item) => (
                          <tr key={item.doctorId}>
                            <td>
                              <strong>{item.doctorName}</strong>
                            </td>
                            <td>{item.specialization}</td>
                            <td>
                              <span className={`ad-treated-badge ${item.patientsTreatedToday > 0 ? '' : 'zero'}`}>
                                {item.patientsTreatedToday} patients
                              </span>
                            </td>
                            <td>
                              <span className={`ad-scheduled-badge ${item.todayScheduled > 0 ? '' : 'zero'}`}>
                                {item.todayScheduled} visits
                              </span>
                            </td>
                            <td>{item.totalCompleted} visits</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="ad-empty-view">
                    <p>No activity recorded yet for today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 2: DOCTOR APPROVALS
            ====================================================== */}
        {activeTab === 'doctors' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Doctor Approvals</h1>
                <p className="ad-page-subtitle">
                  Review doctors. Approved doctors immediately appear in the Find Doctors page.
                </p>
              </div>
            </header>

            <div className="ad-filter-bar">
              <button
                type="button"
                className={`ad-filter-btn ${doctorFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setDoctorFilter('ALL')}
              >
                All Doctors ({doctors.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${doctorFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setDoctorFilter('PENDING')}
              >
                Pending ({pendingDoctors.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${doctorFilter === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setDoctorFilter('APPROVED')}
              >
                Approved ({approvedDoctors.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${doctorFilter === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setDoctorFilter('REJECTED')}
              >
                Rejected ({rejectedDoctors.length})
              </button>
            </div>

            <div className="ad-card">
              <div className="ad-card-content">
                {filteredDoctors.length > 0 ? (
                  <div className="ad-doc-list">
                    {filteredDoctors.map((doc) => (
                      <div key={doc.id} className="ad-doc-row">
                        <div className="ad-doc-info">
                          <div className="ad-doc-header">
                            <h4 className="ad-doc-name">{doc.fullName}</h4>
                            <span
                              className={`ad-status-pill ${
                                doc.approvalStatus === 'APPROVED'
                                  ? 'approved'
                                  : doc.approvalStatus === 'REJECTED'
                                  ? 'rejected'
                                  : 'pending'
                              }`}
                            >
                              {doc.approvalStatus || 'PENDING'}
                            </span>
                          </div>
                          <div className="ad-doc-spec">🩺 {doc.specialization} &bull; {doc.experience} Years Exp.</div>
                          <div className="ad-doc-details-grid">
                            <div>📞 <strong>Phone:</strong> {doc.phoneNumber || 'Not provided'}</div>
                            <div>🎓 <strong>Qualifications:</strong> {doc.qualifications || 'MBBS'}</div>
                            <div>💳 <strong>Fee:</strong> ₹{doc.consultationFee || 500}</div>
                            <div>🟢 <strong>Status:</strong> {doc.available ? 'Available' : 'Unavailable'}</div>
                          </div>
                          {doc.bio && <p className="ad-doc-bio">{doc.bio}</p>}
                        </div>
                        <div className="ad-doc-actions">
                          {doc.approvalStatus !== 'APPROVED' && (
                            <button
                              type="button"
                              className="ad-btn-approve"
                              disabled={actionDoctorId === doc.id}
                              onClick={() => handleDoctorStatus(doc.id, 'APPROVED')}
                            >
                              {actionDoctorId === doc.id ? 'Updating...' : '✓ Approve'}
                            </button>
                          )}
                          {doc.approvalStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              className="ad-btn-reject"
                              disabled={actionDoctorId === doc.id}
                              onClick={() => handleDoctorStatus(doc.id, 'REJECTED')}
                            >
                              {actionDoctorId === doc.id ? 'Updating...' : '✕ Reject'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-view">
                    <p>No doctors found matching "{doctorFilter}".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 3: DOCTOR APPLICATIONS (Apply as Doctor requests)
            ====================================================== */}
        {activeTab === 'applications' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Doctor Applications</h1>
                <p className="ad-page-subtitle">
                  Review "Apply as Doctor" submissions. Approvals create a new doctor profile and promote the applicant to the Doctor role.
                </p>
              </div>
            </header>

            <div className="ad-filter-bar">
              <button
                type="button"
                className={`ad-filter-btn ${applicationFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setApplicationFilter('ALL')}
              >
                All ({applications.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${applicationFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setApplicationFilter('PENDING')}
              >
                Pending ({pendingApplications.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${applicationFilter === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setApplicationFilter('APPROVED')}
              >
                Approved ({approvedApplications.length})
              </button>
              <button
                type="button"
                className={`ad-filter-btn ${applicationFilter === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setApplicationFilter('REJECTED')}
              >
                Rejected ({rejectedApplications.length})
              </button>
            </div>

            <div className="ad-card">
              <div className="ad-card-content">
                {filteredApplications.length > 0 ? (
                  <div className="ad-doc-list">
                    {filteredApplications.map((app) => (
                      <div key={app.id} className="ad-doc-row">
                        <div className="ad-doc-info">
                          <div className="ad-doc-header">
                            <h4 className="ad-doc-name">{app.fullName}</h4>
                            <span
                              className={`ad-status-pill ${
                                app.status === 'APPROVED'
                                  ? 'approved'
                                  : app.status === 'REJECTED'
                                  ? 'rejected'
                                  : 'pending'
                              }`}
                            >
                              {app.status || 'PENDING'}
                            </span>
                          </div>
                          <div className="ad-doc-spec">
                            🩺 {app.specialization || 'General Practice'}
                            {app.experience ? ` • ${app.experience} Years Exp.` : ''}
                          </div>
                          <div className="ad-doc-details-grid">
                            <div>📧 <strong>Email:</strong> {app.email || 'Not provided'}</div>
                            <div>📞 <strong>Phone:</strong> {app.phoneNumber || 'Not provided'}</div>
                            <div>💳 <strong>Fee:</strong> ₹{app.consultationFee || 500}</div>
                            <div>🕒 <strong>Hours:</strong> {app.availabilityStart || '09:00'} – {app.availabilityEnd || '17:00'}</div>
                          </div>
                          {app.clinicAddress && (
                            <p className="ad-doc-bio">📍 <strong>Clinic:</strong> {app.clinicAddress}</p>
                          )}
                          <p className="ad-app-submitted">
                            Submitted on {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                            {app.reviewNotes && ` • Review note: ${app.reviewNotes}`}
                          </p>
                          {app.credentialsFileName && (
                            <p className="ad-app-credentials">
                              📎 Attached: {app.credentialsFileName}
                              {' '}
                              <a
                                href={doctorApplicationCredentialsUrl(app.id)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Download credentials
                              </a>
                            </p>
                          )}
                          {app.status === 'PENDING' && (
                            <div className="ad-app-review-box">
                              <input
                                type="text"
                                className="ad-app-review-input"
                                placeholder="Review notes (optional, shown to applicant)"
                                value={reviewNotes[app.id] || ''}
                                onChange={(e) =>
                                  setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                                }
                              />
                            </div>
                          )}
                        </div>
                        {app.status === 'PENDING' && (
                          <div className="ad-doc-actions">
                            <button
                              type="button"
                              className="ad-btn-approve"
                              disabled={reviewingAppId === app.id}
                              onClick={() => handleApplicationReview(app.id, 'APPROVED')}
                            >
                              {reviewingAppId === app.id ? 'Updating...' : '✓ Approve'}
                            </button>
                            <button
                              type="button"
                              className="ad-btn-reject"
                              disabled={reviewingAppId === app.id}
                              onClick={() => handleApplicationReview(app.id, 'REJECTED')}
                            >
                              {reviewingAppId === app.id ? 'Updating...' : '✕ Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-view">
                    <p>No doctor applications found matching "{applicationFilter}".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 3: USER DIRECTORY
            ====================================================== */}
        {activeTab === 'users' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Users</h1>
                <p className="ad-page-subtitle">
                  Directory of registered patients, doctors, and administrators.
                </p>
              </div>
            </header>

            <div className="ad-card">
              <div className="ad-card-content">
                <div className="ad-users-toolbar">
                  <input
                    type="text"
                    className="ad-search-input"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div className="ad-filter-bar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className={`ad-filter-btn ${userRoleFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('ALL')}
                    >
                      All Roles
                    </button>
                    <button
                      type="button"
                      className={`ad-filter-btn ${userRoleFilter === 'PATIENT' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('PATIENT')}
                    >
                      Patients
                    </button>
                    <button
                      type="button"
                      className={`ad-filter-btn ${userRoleFilter === 'DOCTOR' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('DOCTOR')}
                    >
                      Doctors
                    </button>
                    <button
                      type="button"
                      className={`ad-filter-btn ${userRoleFilter === 'ADMIN' ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter('ADMIN')}
                    >
                      Admins
                    </button>
                  </div>
                </div>

                <div className="ad-table-wrapper">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Phone</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="ad-user-name-cell">
                                <div className="ad-user-avatar-sm">
                                  {(u.fullName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <strong>{u.fullName}</strong>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>{u.phoneNumber || '—'}</td>
                            <td>
                              <span
                                className={`ad-status-pill ${
                                  u.role === 'ADMIN'
                                    ? 'rejected'
                                    : u.role === 'DOCTOR'
                                    ? 'approved'
                                    : 'pending'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '32px' }}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 4: DOCTOR ANALYTICS (Replaces Security & Health)
            ====================================================== */}
        {activeTab === 'analytics' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Doctor Consultation Analytics</h1>
                <p className="ad-page-subtitle">
                  See how many patients each doctor treated today, upcoming visits, and total consultations.
                </p>
              </div>
              <span className="ad-badge ad-badge-blue">Daily Activity</span>
            </header>

            {/* Daily KPI Metrics */}
            <div className="ad-stats-grid">
              <div className="ad-stat-card green">
                <div className="ad-stat-icon">🩺</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{totalTreatedToday}</span>
                  <span className="ad-stat-label">Patients Treated Today</span>
                  <span className="ad-stat-hint">Completed consultations</span>
                </div>
              </div>

              <div className="ad-stat-card blue">
                <div className="ad-stat-icon">📅</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{totalScheduledToday}</span>
                  <span className="ad-stat-label">Today's Consultations</span>
                  <span className="ad-stat-hint">Scheduled bookings</span>
                </div>
              </div>

              <div className="ad-stat-card purple">
                <div className="ad-stat-icon">✓</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{totalCompletedAllTime}</span>
                  <span className="ad-stat-label">Total Completed</span>
                  <span className="ad-stat-hint">All-time treatments</span>
                </div>
              </div>

              <div className="ad-stat-card amber">
                <div className="ad-stat-icon">👥</div>
                <div className="ad-stat-body">
                  <span className="ad-stat-val">{analytics.length}</span>
                  <span className="ad-stat-label">Active Doctors</span>
                  <span className="ad-stat-hint">Medical practitioners</span>
                </div>
              </div>
            </div>

            {/* Doctor Breakdown Table */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <h3 className="ad-card-title">Doctor Treatment Breakdown</h3>
                  <p className="ad-card-desc">Individual doctor consultation metrics for today and all-time</p>
                </div>
              </div>
              <div className="ad-card-content">
                {analytics.length > 0 ? (
                  <div className="ad-table-wrapper">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Patients Treated Today</th>
                          <th>Scheduled Today</th>
                          <th>Total Completed</th>
                          <th>All Consultations</th>
                          <th>Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((doc) => (
                          <tr key={doc.doctorId}>
                            <td>
                              <div className="ad-user-name-cell">
                                <div className="ad-user-avatar-sm">
                                  {(doc.doctorName || 'D').replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                                </div>
                                <strong>{doc.doctorName}</strong>
                              </div>
                            </td>
                            <td>{doc.specialization}</td>
                            <td>
                              <span className={`ad-treated-badge ${doc.patientsTreatedToday > 0 ? '' : 'zero'}`}>
                                {doc.patientsTreatedToday} treated
                              </span>
                            </td>
                            <td>
                              <span className={`ad-scheduled-badge ${doc.todayScheduled > 0 ? '' : 'zero'}`}>
                                {doc.todayScheduled} scheduled
                              </span>
                            </td>
                            <td>
                              <strong>{doc.totalCompleted}</strong> visits
                            </td>
                            <td>{doc.totalConsultations} total</td>
                            <td>₹{doc.consultationFee || 500}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="ad-empty-view">
                    <p>No doctor analytics recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 5: ADMIN PROFILE EDIT
            ====================================================== */}
        {activeTab === 'profile' && (
          <div className="ad-tab-content">
            <header className="ad-content-header">
              <div>
                <h1 className="ad-page-title">Admin Profile</h1>
                <p className="ad-page-subtitle">
                  Manage your administrator account information and contact details.
                </p>
              </div>
            </header>

            <div className="ad-card" style={{ maxWidth: '640px' }}>
              <div className="ad-card-content">
                <form onSubmit={handleSaveProfile} className="ad-profile-form">
                  <div className="ad-form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="ad-form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={adminProfile?.email || currentUser?.email || 'admin@medicare.com'}
                      className="ad-input-disabled"
                    />
                    <span className="ad-field-hint">Email address cannot be changed</span>
                  </div>

                  <div className="ad-form-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Phone Number"
                    />
                  </div>

                  <div className="ad-form-field">
                    <label>Office Address / Location</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Office Address"
                    />
                  </div>

                  <div className="ad-form-field">
                    <label>System Role</label>
                    <input
                      type="text"
                      disabled
                      value="ADMIN (Platform Administrator)"
                      className="ad-input-disabled"
                    />
                  </div>

                  <div className="ad-profile-actions">
                    <button
                      type="submit"
                      className="ad-btn-save-profile"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                    <button
                      type="button"
                      className="ad-btn-cancel-profile"
                      onClick={() => setActiveTab('overview')}
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

export default AdminDashboard;
