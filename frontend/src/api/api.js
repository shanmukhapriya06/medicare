// Backend API base URL (configurable via VITE_API_BASE_URL environment variable)
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '');

const TOKEN_KEY = 'medicare_auth_token';
const USER_KEY = 'medicare_user';

/**
 * Storage helpers for authentication token and user data
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      // Security rule: Never store passwords in storage
      const { password: _password, ...safeUser } = user;
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function logout() {
  clearAuthToken();
  clearStoredUser();
}

/**
 * Reusable helper function to send HTTP requests to the backend using native fetch.
 * Automatically attaches JWT Authorization header if a token is present.
 * @param {string} endpoint - The relative API path (e.g. '/api/health')
 * @param {RequestInit} [options] - Fetch configuration options
 * @returns {Promise<any>} Response body (parsed JSON or text)
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.details && typeof errorJson.details === 'object') {
        errorMessage = Object.values(errorJson.details).join(', ');
      }
    } catch {
      const errorText = await response.text().catch(() => '');
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  // Handle both JSON and plain-text responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

/**
 * Calls GET /api/health to verify connection with Spring Boot.
 * @returns {Promise<string>}
 */
export async function getBackendHealth() {
  return await apiRequest('/api/health');
}

/**
 * Registers a new user (role can be PATIENT or DOCTOR, defaulting to PATIENT).
 * @param {Object} userData - { fullName, email, password, role? }
 * @returns {Promise<{ message: string, id: number, fullName: string, email: string, role: string }>}
 */
export async function registerUser(userData) {
  return await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Authenticates user credentials and stores the JWT session token safely.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ message: string, token: string, id: number, fullName: string, email: string, role: string, type: string }>}
 */
export async function loginUser(credentials) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (data.token) {
    setAuthToken(data.token);
    setStoredUser({
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    });
  }

  return data;
}

/**
 * Fetches the currently authenticated patient's profile.
 * @returns {Promise<Object>}
 */
export async function getPatientProfile() {
  return await apiRequest('/api/patient/profile');
}

/**
 * Updates the currently authenticated patient's profile.
 * @param {Object} profileData - { fullName, phoneNumber, address, dateOfBirth, bloodGroup }
 * @returns {Promise<Object>}
 */
export async function updatePatientProfile(profileData) {
  return await apiRequest('/api/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/**
 * Fetches the currently authenticated doctor's profile.
 * @returns {Promise<Object>}
 */
export async function getDoctorProfile() {
  return await apiRequest('/api/doctor/profile');
}

/**
 * Updates the currently authenticated doctor's profile.
 * @param {Object} profileData - { fullName, phoneNumber, specialization, qualifications, experience, consultationFee, bio }
 * @returns {Promise<Object>}
 */
export async function updateDoctorProfile(profileData) {
  return await apiRequest('/api/doctor/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/**
 * Retrieves all doctor profiles (for public directory or appointments).
 * @returns {Promise<Array>}
 */
export async function getAllDoctors() {
  return await apiRequest('/api/doctor/all');
}

/**
 * Retrieves all registered users for administration.
 * @returns {Promise<Array>}
 */
export async function getAdminUsers() {
  return await apiRequest('/api/admin/users');
}

/**
 * Updates a user's role (ADMIN only).
 * @param {number} userId
 * @param {string} role - 'PATIENT' | 'DOCTOR' | 'ADMIN'
 * @returns {Promise<Object>}
 */
export async function updateUserRole(userId, role) {
  return await apiRequest(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

/**
 * Retrieves all doctor profiles (including pending/unapproved) for admin review.
 * @returns {Promise<Array>}
 */
export async function getAdminDoctors() {
  return await apiRequest('/api/admin/doctors');
}

/**
 * Updates a doctor's approval status (ADMIN only).
 * @param {number} doctorId
 * @param {string} approvalStatus - 'APPROVED' | 'REJECTED' | 'PENDING'
 * @returns {Promise<Object>}
 */
export async function updateDoctorApproval(doctorId, approvalStatus) {
  return await apiRequest(`/api/admin/doctors/${doctorId}/approval`, {
    method: 'PUT',
    body: JSON.stringify({ approvalStatus }),
  });
}

/**
 * Retrieves doctor consultation activity and daily patient treatment analytics.
 * @returns {Promise<Array>}
 */
export async function getDoctorAnalytics() {
  return await apiRequest('/api/admin/analytics/doctors');
}

/**
 * Fetches the currently authenticated administrator's profile.
 * @returns {Promise<Object>}
 */
export async function getAdminProfile() {
  return await apiRequest('/api/admin/profile');
}

/**
 * Updates the currently authenticated administrator's profile.
 * @param {Object} profileData - { fullName, phoneNumber, address }
 * @returns {Promise<Object>}
 */
export async function updateAdminProfile(profileData) {
  return await apiRequest('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/* ============================================================
   Doctor discovery, availability and appointments
   ============================================================ */

/**
 * Lists approved, available doctors. All parameters are optional.
 * @param {Object} [params] - { name?, specialization? }
 * @returns {Promise<Array>}
 */
export async function getDoctors(params = {}) {
  const query = new URLSearchParams();
  if (params.name && params.name.trim()) query.set('name', params.name.trim());
  if (params.specialization && params.specialization.trim()) {
    query.set('specialization', params.specialization.trim());
  }
  const qs = query.toString();
  return await apiRequest(`/api/doctors${qs ? `?${qs}` : ''}`);
}

/**
 * Distinct specializations of approved doctors (for the filter dropdown).
 * @returns {Promise<Array<string>>}
 */
export async function getDoctorSpecializations() {
  return await apiRequest('/api/doctors/specializations');
}

/**
 * Public detail view of one doctor.
 * @param {number} doctorId
 * @returns {Promise<Object>}
 */
export async function getDoctorDetail(doctorId) {
  return await apiRequest(`/api/doctors/${doctorId}`);
}

/**
 * Available (future, unbooked) slots for one doctor.
 * @param {number} doctorId
 * @returns {Promise<Array>}
 */
export async function getDoctorSlots(doctorId) {
  return await apiRequest(`/api/doctors/${doctorId}/slots`);
}

/**
 * Books one slot for the authenticated patient.
 * @param {Object} booking - { slotId: number, reason: string }
 * @returns {Promise<Object>} The saved appointment
 */
export async function bookAppointment(booking) {
  return await apiRequest('/api/patient/appointments', {
    method: 'POST',
    body: JSON.stringify(booking),
  });
}

/**
 * Lists the authenticated patient's own appointments.
 * @param {string} [filter] - 'upcoming' | 'past' | 'all' (default 'all')
 * @returns {Promise<Array>}
 */
export async function getMyAppointments(filter = 'all') {
  const valid = ['upcoming', 'past', 'all'].includes(filter) ? filter : 'all';
  return await apiRequest(`/api/patient/appointments?filter=${valid}`);
}

/**
 * Cancels one of the authenticated patient's appointments.
 * @param {number} appointmentId
 * @returns {Promise<Object>} The updated appointment
 */
export async function cancelAppointment(appointmentId) {
  return await apiRequest(`/api/patient/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
  });
}

/**
 * Dashboard summary for the authenticated patient.
 * @returns {Promise<Object>}
 */
export async function getPatientDashboard() {
  return await apiRequest('/api/patient/dashboard');
}

/* ============================================================
   Doctor dashboard & appointment management
   ============================================================ */

/**
 * Lists all incoming appointments for the authenticated doctor.
 * @returns {Promise<Array>}
 */
export async function getDoctorAppointments() {
  return await apiRequest('/api/doctor/appointments');
}

/**
 * Updates an appointment's status (e.g. APPROVED, REJECTED, COMPLETED).
 * @param {number} appointmentId
 * @param {string} status - 'APPROVED' | 'REJECTED' | 'COMPLETED'
 * @returns {Promise<Object>}
 */
export async function updateDoctorAppointmentStatus(appointmentId, status) {
  return await apiRequest(`/api/doctor/appointments/${appointmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

/**
 * Retrieves dashboard summary and statistics for the authenticated doctor.
 * @returns {Promise<Object>}
 */
export async function getDoctorDashboard() {
  return await apiRequest('/api/doctor/dashboard');
}

/**
 * Lists all slots scheduled by the authenticated doctor.
 * @returns {Promise<Array>}
 */
export async function getMyDoctorSlots() {
  return await apiRequest('/api/doctor/slots');
}

/**
 * Creates a new consultation slot for the authenticated doctor.
 * @param {Object} slotData - { slotDate: 'YYYY-MM-DD', startTime: 'HH:mm', endTime: 'HH:mm' }
 * @returns {Promise<Object>}
 */
export async function createDoctorSlot(slotData) {
  return await apiRequest('/api/doctor/slots', {
    method: 'POST',
    body: JSON.stringify(slotData),
  });
}

/**
 * Deletes an unbooked slot.
 * @param {number} slotId
 * @returns {Promise<void>}
 */
export async function deleteDoctorSlot(slotId) {
  return await apiRequest(`/api/doctor/slots/${slotId}`, {
    method: 'DELETE',
  });
}

/* ============================================================
   Apply as Doctor (application workflow)
   ============================================================ */

const DOCTOR_APPLICATION_ENDPOINT = '/api/doctor-application';

/**
 * Submits a "Apply as Doctor" application together with the medical
 * credentials document (multipart/form-data).
 * @param {FormData} formData - includes fullName, email, phoneNumber,
 *   specialization, experience, consultationFee, clinicAddress,
 *   availabilityStart, availabilityEnd and the "credentials" file
 * @returns {Promise<Object>} The stored application
 */
export async function submitDoctorApplication(formData) {
  const url = `${API_BASE_URL}${DOCTOR_APPLICATION_ENDPOINT}`;
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.details && typeof errorJson.details === 'object') {
        errorMessage = Object.values(errorJson.details).join(', ');
      }
    } catch {
      const errorText = await response.text().catch(() => '');
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Fetches the authenticated user's most recent doctor application.
 * @returns {Promise<{application: Object|null}>}
 */
export async function getMyDoctorApplication() {
  return await apiRequest(`${DOCTOR_APPLICATION_ENDPOINT}/my`);
}

/**
 * Lists every doctor application (ADMIN only).
 * @param {string} [status] - 'PENDING' | 'APPROVED' | 'REJECTED'
 * @returns {Promise<Array>}
 */
export async function getAdminDoctorApplications(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return await apiRequest(`/api/admin/doctor-applications${qs}`);
}

/**
 * Approves or rejects a doctor application (ADMIN only).
 * @param {number} applicationId
 * @param {string} approvalStatus - 'APPROVED' | 'REJECTED'
 * @param {string} [reviewNotes]
 * @returns {Promise<Object>} The updated application
 */
export async function reviewDoctorApplication(applicationId, approvalStatus, reviewNotes = '') {
  return await apiRequest(`/api/admin/doctor-applications/${applicationId}/approval`, {
    method: 'PUT',
    body: JSON.stringify({ approvalStatus, reviewNotes }),
  });
}

/**
 * URL of the stored credentials document for an application (ADMIN only).
 * @param {number} applicationId
 * @returns {string}
 */
export function doctorApplicationCredentialsUrl(applicationId) {
  return `${API_BASE_URL}/api/admin/doctor-applications/${applicationId}/credentials`;
}

