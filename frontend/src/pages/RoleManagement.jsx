import { useState, useEffect } from 'react';
import { getAdminUsers, updateUserRole } from '../api/api';
import logoMark from '../assets/medicare-logo.svg';
import './RoleManagement.css';

function RoleManagement({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = async () => {
    setInitialLoading(true);
    setServerError('');
    try {
      const data = await getAdminUsers();
      setUsers(data);
      // Initialize selected roles dropdown values
      const initialMap = {};
      data.forEach((u) => {
        initialMap[u.id] = u.role;
      });
      setSelectedRoles(initialMap);
    } catch (err) {
      setServerError(err.message || 'Unable to fetch users. Administrator privileges required.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleSelect = (userId, newRole) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  const handleUpdateRole = async (userId, userFullName) => {
    const newRole = selectedRoles[userId];
    if (!newRole) return;

    setUpdatingUserId(userId);
    setServerError('');
    setSuccessMessage('');

    try {
      const result = await updateUserRole(userId, newRole);
      setSuccessMessage(`User "${userFullName}" successfully assigned role: ${result.role}`);
      // Refresh list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: result.role } : u))
      );
    } catch (err) {
      setServerError(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="role-mgmt-page">
        <div className="role-mgmt-card">
          <div className="loading-container">
            Loading users and access privileges...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-mgmt-page">
      <div className="role-mgmt-card">
        {/* Header */}
        <div className="role-mgmt-header">
          <div className="role-mgmt-brand" onClick={() => onNavigate('home')}>
            <img src={logoMark} alt="MediCare logo" className="brand-logo-mark brand-logo-mark--sm" /> MediCare
          </div>
          <h2>User Role & Access Management</h2>
          <p>Authorize and manage permissions for Patients, Doctors, and Administrators.</p>
        </div>

        {/* Security Notice */}
        <div className="security-notice-banner">
          <strong>Security Notice:</strong> Roles are strictly verified on the Spring Boot server using cryptographic JWT claims and database checks. Unauthorized client alterations are automatically rejected.
        </div>

        {/* Alerts */}
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

        {/* User Table */}
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Current Role</th>
                <th>Assign New Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUpdating = updatingUserId === user.id;
                const selectedRole = selectedRoles[user.id] || user.role;
                const isUnchanged = selectedRole === user.role;

                return (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td><strong>{user.fullName}</strong></td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge-role ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <select
                        className="role-select"
                        value={selectedRole}
                        onChange={(e) => handleRoleSelect(user.id, e.target.value)}
                        disabled={isCurrentUpdating}
                      >
                        <option value="PATIENT">PATIENT</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>

                      <button
                        type="button"
                        className="update-role-btn"
                        disabled={isCurrentUpdating || isUnchanged}
                        onClick={() => handleUpdateRole(user.id, user.fullName)}
                      >
                        {isCurrentUpdating ? 'Saving...' : 'Apply Role'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions Bottom */}
        <div className="table-actions-bottom">
          <button
            type="button"
            className="home-btn"
            onClick={loadUsers}
          >
            ↻ Refresh List
          </button>
          <button
            type="button"
            className="home-btn"
            onClick={() => onNavigate('home')}
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;
