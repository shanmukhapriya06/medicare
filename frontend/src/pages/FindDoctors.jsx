import { useState, useEffect } from 'react';
import { getDoctors, getDoctorSpecializations } from '../api/api';
import './FindDoctors.css';

function formatFee(fee) {
  if (fee === null || fee === undefined || fee === '') return 'Not specified';
  return Number(fee).toLocaleString();
}

function initials(name) {
  if (!name) return '?';
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function FindDoctors({ onNavigate }) {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [nameQuery, setNameQuery] = useState('');
  const [specializationQuery, setSpecializationQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load the specialization filter options once
  useEffect(() => {
    let isMounted = true;
    async function loadSpecializations() {
      try {
        const data = await getDoctorSpecializations();
        if (isMounted && Array.isArray(data)) {
          setSpecializations(data);
        }
      } catch {
        // Filter dropdown is optional, so a failure here is not fatal
      }
    }
    loadSpecializations();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load the doctor list whenever the filters change
  useEffect(() => {
    let isMounted = true;
    async function loadDoctors() {
      setIsLoading(true);
      setLoadError('');
      try {
        const data = await getDoctors({
          name: nameQuery,
          specialization: specializationQuery,
        });
        if (isMounted) {
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load doctors right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDoctors();
    return () => {
      isMounted = false;
    };
  }, [nameQuery, specializationQuery]);

  const clearFilters = () => {
    setNameQuery('');
    setSpecializationQuery('');
  };

  return (
    <div className="find-doctors-page">
      <section className="find-header">
        <h2>Find Your Doctor</h2>
        <p>Browse our approved specialists and book a visit at a time that suits you.</p>
      </section>

      {/* Search & filter bar */}
      <section className="filter-bar" aria-label="Search doctors">
        <div className="filter-field filter-grow">
          <label htmlFor="doctor-search">Search by name</label>
          <input
            id="doctor-search"
            type="text"
            className="filter-input"
            placeholder="e.g. Dr. Rajesh Kumar"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="specialization-filter">Specialization</label>
          <select
            id="specialization-filter"
            className="filter-input"
            value={specializationQuery}
            onChange={(e) => setSpecializationQuery(e.target.value)}
          >
            <option value="">All specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="clear-filter-button" onClick={clearFilters}>
          Clear
        </button>
      </section>

      {/* Alert Messages */}
      {loadError && (
        <div className="alert-banner error" role="alert">
          {loadError}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="loading-container">Loading available doctors...</div>
      ) : doctors.length === 0 ? (
        /* Empty state - never invent demo doctors */
        <div className="empty-state-card">
          <div className="empty-state-icon">🩺</div>
          <h3>No doctors found</h3>
          <p>
            {nameQuery || specializationQuery
              ? 'No approved doctor matches your search. Try a different name or clear the specialization filter.'
              : 'There are no approved doctors available in the system yet. Please check back soon.'}
          </p>
          {(nameQuery || specializationQuery) && (
            <button type="button" className="secondary-button" onClick={clearFilters}>
              Clear search filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="result-count">
            {doctors.length} doctor{doctors.length === 1 ? '' : 's'} available
          </p>

          <section className="doctor-grid">
            {doctors.map((doctor) => (
              <article className="doctor-card" key={doctor.id}>
                <div className="doctor-card-top">
                  <div className="doctor-avatar" aria-hidden="true">
                    {initials(doctor.fullName)}
                  </div>
                  <div className="doctor-card-title">
                    <h3>{doctor.fullName}</h3>
                    <span className="specialization-pill">
                      {doctor.specialization || 'General'}
                    </span>
                  </div>
                </div>

                <dl className="doctor-facts">
                  <div className="doctor-fact">
                    <dt>Qualifications</dt>
                    <dd>{doctor.qualifications || 'Not specified'}</dd>
                  </div>
                  <div className="doctor-fact">
                    <dt>Experience</dt>
                    <dd>
                      {doctor.experience !== null && doctor.experience !== undefined
                        ? `${doctor.experience}+ years`
                        : 'Not specified'}
                    </dd>
                  </div>
                  <div className="doctor-fact">
                    <dt>Consultation Fee</dt>
                    <dd>{formatFee(doctor.consultationFee)}</dd>
                  </div>
                </dl>

                {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}

                <button
                  type="button"
                  className="view-profile-button"
                  onClick={() => onNavigate(`doctor/${doctor.id}`)}
                >
                  View Profile &amp; Book
                </button>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default FindDoctors;
