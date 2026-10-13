import { useState, useEffect } from 'react';
import { getStoredUser, logout } from './api/api';
import Register from './pages/Register';
import Login from './pages/Login';
import PatientProfile from './pages/PatientProfile';
import DoctorProfile from './pages/DoctorProfile';
import RoleManagement from './pages/RoleManagement';
import FindDoctors from './pages/FindDoctors';
import DoctorDetails from './pages/DoctorDetails';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyAppointments from './pages/MyAppointments';
import ApplyAsDoctor from './pages/ApplyAsDoctor';
import healthcareHeroImg from './assets/healthcare_hero.jpg';
import logoMark from './assets/medicare-logo.svg';
import './App.css';

/**
 * Zero-dependency hash router.
 * Supports parameterised routes such as "#/doctor/5" by splitting the hash
 * into a view name and an optional parameter.
 */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [view, ...rest] = raw.split('/');
  return {
    view: view || 'home',
    param: rest.length > 0 ? rest.join('/') : null,
  };
}

function getInitialRoute() {
  const { view, param } = parseHash();
  const validViews = [
    'register',
    'login',
    'profile',
    'roles',
    'doctors',
    'doctor',
    'dashboard',
    'doctor-dashboard',
    'admin-dashboard',
    'appointments',
    'apply-doctor',
  ];
  return {
    view: validViews.includes(view) ? view : 'home',
    param,
  };
}

function App() {
  const [currentView, setCurrentView] = useState(() => getInitialRoute().view);
  const [currentParam, setCurrentParam] = useState(() => getInitialRoute().param);
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Sync route with URL hash for zero-dependency routing
  useEffect(() => {
    const handleHashChange = () => {
      const { view, param } = getInitialRoute();
      setCurrentView(view);
      setCurrentParam(param);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view) => {
    window.location.hash = `#/${view}`;
    const [name, ...rest] = String(view).split('/');
    setCurrentView(name);
    setCurrentParam(rest.length > 0 ? rest.join('/') : null);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigateTo('home');
  };

  const isDedicatedPortal =
    currentView === 'dashboard' ||
    currentView === 'doctor-dashboard' ||
    currentView === 'admin-dashboard' ||
    (currentUser?.role === 'DOCTOR' && currentView === 'profile') ||
    (currentUser?.role === 'PATIENT' && currentView === 'profile');

  return (
    <div className="app">
      {/* Navbar - displayed only on public / informational pages */}
      {!isDedicatedPortal && (
        <nav className="navbar">
          <div className="logo" onClick={() => navigateTo('home')}>
            <img src={logoMark} alt="MediCare logo" className="logo-mark" /> MediCare
          </div>
          <ul className="nav-links">
            {/* Conditional links based on authentication status & role */}
            {!currentUser ? (
              <>
                <li
                  className={currentView === 'register' ? 'active-link' : ''}
                  onClick={() => navigateTo('register')}
                >
                  Register
                </li>
                <li
                  className={currentView === 'login' ? 'active-link' : ''}
                  onClick={() => navigateTo('login')}
                >
                  Login
                </li>
              </>
            ) : (
              <>
                {currentUser.role === 'ADMIN' ? (
                  <>
                    <li
                      className={currentView === 'admin-dashboard' ? 'active-link' : ''}
                      onClick={() => navigateTo('admin-dashboard')}
                    >
                      Admin Dashboard
                    </li>
                    <li
                      className={currentView === 'roles' ? 'active-link' : ''}
                      onClick={() => navigateTo('roles')}
                    >
                      Manage Roles
                    </li>
                  </>
                ) : currentUser.role === 'DOCTOR' ? (
                  <>
                    <li
                      className={currentView === 'doctor-dashboard' ? 'active-link' : ''}
                      onClick={() => navigateTo('doctor-dashboard')}
                    >
                      Doctor Dashboard
                    </li>
                    <li
                      className={currentView === 'profile' ? 'active-link' : ''}
                      onClick={() => navigateTo('profile')}
                    >
                      Doctor Profile
                    </li>
                  </>
                ) : (
                  <>
                    <li
                      className={currentView === 'dashboard' ? 'active-link' : ''}
                      onClick={() => navigateTo('dashboard')}
                    >
                      Dashboard
                    </li>
                    <li
                      className={currentView === 'appointments' ? 'active-link' : ''}
                      onClick={() => navigateTo('appointments')}
                    >
                      My Appointments
                    </li>
                    <li
                      className={currentView === 'profile' ? 'active-link' : ''}
                      onClick={() => navigateTo('profile')}
                    >
                      My Profile
                    </li>
                    <li
                      className={currentView === 'apply-doctor' ? 'active-link' : ''}
                      onClick={() => navigateTo('apply-doctor')}
                    >
                      Apply as Doctor
                    </li>
                  </>
                )}
                <li
                  className="logout-nav-item"
                  onClick={handleLogout}
                  title="Sign out of MediCare"
                >
                  Logout ({currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'User'})
                </li>
              </>
            )}
          </ul>
        </nav>
      )}

      {/* Main Page View Switching */}
      {currentView === 'register' && (
        <Register onNavigate={navigateTo} />
      )}

      {currentView === 'login' && (
        <Login
          onNavigate={navigateTo}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            const targetView =
              user?.role === 'DOCTOR'
                ? 'doctor-dashboard'
                : user?.role === 'ADMIN'
                ? 'admin-dashboard'
                : 'dashboard';
            navigateTo(targetView);
          }}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'dashboard' && (
        currentUser?.role === 'DOCTOR' ? (
          <DoctorDashboard onNavigate={navigateTo} onLogout={handleLogout} />
        ) : currentUser?.role === 'ADMIN' ? (
          <AdminDashboard onNavigate={navigateTo} />
        ) : (
          <PatientDashboard onNavigate={navigateTo} onLogout={handleLogout} />
        )
      )}

      {currentView === 'doctor-dashboard' && (
        <DoctorDashboard onNavigate={navigateTo} onLogout={handleLogout} />
      )}

      {currentView === 'admin-dashboard' && (
        <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} />
      )}

      {currentView === 'appointments' && (
        <MyAppointments onNavigate={navigateTo} />
      )}

      {currentView === 'profile' && (
        currentUser?.role === 'DOCTOR' ? (
          <DoctorProfile
            onNavigate={navigateTo}
            onProfileUpdated={(doc) => {
              setCurrentUser((prev) => ({ ...prev, fullName: doc.fullName }));
            }}
          />
        ) : (
          <PatientProfile
            onNavigate={navigateTo}
            onProfileUpdated={(pat) => {
              setCurrentUser((prev) => ({ ...prev, fullName: pat.fullName }));
            }}
          />
        )
      )}

      {currentView === 'roles' && (
        <RoleManagement onNavigate={navigateTo} />
      )}

      {currentView === 'doctors' && (
        <FindDoctors onNavigate={navigateTo} />
      )}

      {currentView === 'doctor' && (
        <DoctorDetails doctorId={currentParam} onNavigate={navigateTo} />
      )}

      {currentView === 'apply-doctor' && (
        <ApplyAsDoctor onNavigate={navigateTo} />
      )}

      {currentView === 'home' && (
        <div className="home-container">
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-grid-layout">
              <div className="hero-content">
                <div className="hero-pill-badge">
                  <span className="pulse-indicator" />
                  Smart Healthcare Appointment &amp; User Support System
                </div>
                <h1 className="hero-title">Book a Doctor</h1>
                <p className="hero-subtitle">
                  MediCare helps users discover certified medical specialists, book appointments in real time,
                  and securely manage health information in one unified platform.
                </p>
                <div className="hero-cta-group">
                  <button
                    className="cta-button primary"
                    onClick={() => {
                      if (currentUser) {
                        if (currentUser.role === 'DOCTOR') navigateTo('doctor-dashboard');
                        else if (currentUser.role === 'ADMIN') navigateTo('admin-dashboard');
                        else navigateTo('doctors');
                      } else {
                        navigateTo('doctors');
                      }
                    }}
                  >
                    🩺 Book Appointment
                  </button>
                  <button
                    className="cta-button secondary"
                    onClick={() => {
                      if (currentUser) {
                        const targetView =
                          currentUser.role === 'DOCTOR'
                            ? 'doctor-dashboard'
                            : currentUser.role === 'ADMIN'
                            ? 'admin-dashboard'
                            : 'dashboard';
                        navigateTo(targetView);
                      } else {
                        navigateTo('register');
                      }
                    }}
                  >
                    {currentUser ? 'Go to My Dashboard →' : 'Create Account'}
                  </button>
                </div>

                {/* Trust Metrics Bar */}
                <div className="trust-metrics-bar">
                  <div className="trust-metric-item">
                    <span className="metric-icon">🩺</span>
                    <span className="metric-text">Certified Specialists</span>
                  </div>
                  <div className="trust-metric-item">
                    <span className="metric-icon">⚡</span>
                    <span className="metric-text">Instant Confirmations</span>
                  </div>
                  <div className="trust-metric-item">
                    <span className="metric-icon">🛡️</span>
                    <span className="metric-text">Protected Health Records</span>
                  </div>
                  <div className="trust-metric-item">
                    <span className="metric-icon">🕒</span>
                    <span className="metric-text">24/7 User Support</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual Image Card */}
              <div className="hero-visual-image-wrapper">
                <img
                  src={healthcareHeroImg}
                  alt="MediCare Digital Health Consultation"
                  className="hero-doctor-image"
                />
                <div className="hero-image-floating-badge">
                  <span className="badge-pulse" />
                  <span>Online Consultation &amp; Care</span>
                </div>
              </div>
            </div>
          </section>

          {/* Feature cards */}
          <section className="features-section">
            <div className="section-header">
              <span className="section-tag">SERVICES</span>
              <h2>Comprehensive Healthcare Services</h2>
              <p>Designed for users, medical practitioners, and administrative staff.</p>
            </div>

            <div className="features">
              <div className="card feature-card">
                <div className="feature-icon-box">📅</div>
                <h3>Appointment Booking</h3>
                <p>Browse available specialist slots and schedule appointments with real-time confirmation.</p>
              </div>
              <div className="card feature-card">
                <div className="feature-icon-box">👨‍⚕️</div>
                <h3>Doctor Information</h3>
                <p>Access complete practitioner profiles, specializations, qualifications, and patient feedback.</p>
              </div>
              <div className="card feature-card">
                <div className="feature-icon-box">📂</div>
                <h3>User Support</h3>
                <p>Track your upcoming visits, historic consultations, contact details, and emergency blood group info.</p>
              </div>
              <div className="card feature-card">
                <div className="feature-icon-box">🛡️</div>
                <h3>Role Security</h3>
                <p>Protected patient, doctor, and admin portals secured with BCrypt encryption and JWT tokens.</p>
              </div>
            </div>
          </section>

          {/* Workflow Steps Section */}
          <section className="workflow-section">
            <div className="section-header">
              <span className="section-tag">HOW IT WORKS</span>
              <h2>Healthcare Made Effortless in 3 Steps</h2>
            </div>
            <div className="workflow-grid">
              <div className="workflow-card">
                <div className="step-number">01</div>
                <h4>Search Specialist</h4>
                <p>Find trusted doctors by name or medical department matching your healthcare needs.</p>
              </div>
              <div className="workflow-card">
                <div className="step-number">02</div>
                <h4>Select Slot</h4>
                <p>Pick a date and convenient time slot directly from the doctor’s live calendar.</p>
              </div>
              <div className="workflow-card">
                <div className="step-number">03</div>
                <h4>Get Consultation</h4>
                <p>Attend your appointment and track clinical notes and records in your patient portal.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      {!isDedicatedPortal && (
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo"><img src={logoMark} alt="MediCare logo" className="logo-mark logo-mark--footer" /> MediCare</span>
              <p>Smart Healthcare Appointment & User Support System</p>
            </div>
            <div className="footer-links">
              <span onClick={() => navigateTo('home')}>Home</span>
              <span onClick={() => navigateTo('doctors')}>Doctors</span>
              {!currentUser && <span onClick={() => navigateTo('register')}>Register</span>}
              {!currentUser && <span onClick={() => navigateTo('login')}>Login</span>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 MediCare System. Built with React + Spring Boot + MySQL.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
