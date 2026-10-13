import { useState, useEffect } from 'react';
import { getDoctorDetail, getDoctorSlots, bookAppointment, getStoredUser } from '../api/api';
import { ConfirmationModal } from '../components';
import { downloadAppointmentPdf } from '../utils/appointmentPdf';
import './DoctorDetails.css';

function formatFee(fee) {
  if (fee === null || fee === undefined || fee === '') return 'Not specified';
  return `₹${Number(fee).toLocaleString()}`;
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function DoctorDetails({ doctorId, onNavigate }) {
  const [currentUser] = useState(getStoredUser());
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDoctorAndSlots() {
      setIsLoading(true);
      setLoadError('');
      setSelectedSlot(null);
      setBookingError('');
      setBookingSuccess(null);
      try {
        const [docData, slotsData] = await Promise.all([
          getDoctorDetail(doctorId),
          getDoctorSlots(doctorId).catch(() => []),
        ]);
        if (isMounted) {
          setDoctor(docData);
          setSlots(Array.isArray(slotsData) ? slotsData : []);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load this doctor profile.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (doctorId) {
      loadDoctorAndSlots();
    }
    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setBookingError('');
    setBookingSuccess(null);
  };

  const handleOpenBookingConfirm = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!currentUser) {
      onNavigate('login');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setBookingError('');
    setBookingSuccess(null);
    try {
      const response = await bookAppointment({
        slotId: selectedSlot.id,
        reason: reason.trim() || 'General Consultation',
      });
      setBookingSuccess(response);
      // Remove the booked slot from the available list
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setSelectedSlot(null);
      setReason('');
      setShowConfirmModal(false);
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="doctor-details-page">
        <div className="doctor-details-card">
          <div className="loading-container">Loading verified practitioner profile...</div>
        </div>
      </div>
    );
  }

  if (loadError || !doctor) {
    return (
      <div className="doctor-details-page">
        <div className="doctor-details-card">
          <div className="alert-banner error" role="alert">
            {loadError || 'Doctor profile could not be found.'}
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate('doctors')}
          >
            ← Back to Find Doctors
          </button>
        </div>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const key = slot.slotDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="doctor-details-page">
      {/* Doctor Profile Card */}
      <section className="doctor-details-card">
        <button
          type="button"
          className="back-link"
          onClick={() => onNavigate('doctors')}
        >
          ← Back to all doctors
        </button>

        <div className="details-hero">
          <div className="details-avatar" aria-hidden="true">
            {initials(doctor.fullName)}
          </div>
          <div className="details-hero-text">
            <h2>{doctor.fullName}</h2>
            <span className="specialization-pill">
              {doctor.specialization || 'General'}
            </span>
            {doctor.qualifications && (
              <p className="details-qualifications">{doctor.qualifications}</p>
            )}
          </div>
        </div>

        <dl className="details-facts">
          <div className="details-fact">
            <dt>Experience</dt>
            <dd>
              {doctor.experience !== null && doctor.experience !== undefined
                ? `${doctor.experience}+ years clinical experience`
                : 'Not specified'}
            </dd>
          </div>
          <div className="details-fact">
            <dt>Consultation Fee</dt>
            <dd>{formatFee(doctor.consultationFee)}</dd>
          </div>
          <div className="details-fact">
            <dt>Contact Phone</dt>
            <dd>{doctor.phoneNumber || 'Not specified'}</dd>
          </div>
          <div className="details-fact">
            <dt>Practice Status</dt>
            <dd>
              <span className={doctor.available ? 'availability-badge open' : 'availability-badge closed'}>
                {doctor.available ? '✓ Verified Practitioner' : 'Currently unavailable'}
              </span>
            </dd>
          </div>
        </dl>

        {doctor.bio && (
          <div className="details-bio">
            <h3>About the doctor</h3>
            <p>{doctor.bio}</p>
          </div>
        )}
      </section>

      {/* Booking & Availability Section */}
      <section className="booking-section">
        <h3>Available Consultation Slots</h3>
        <p className="section-subtitle">
          Select an open time slot from {doctor.fullName}&apos;s verified schedule to book your consultation.
        </p>

        {bookingSuccess && (
          <div className="alert-banner success" role="alert">
            <p><strong>Appointment Confirmed!</strong> Your visit with {doctor.fullName} has been scheduled.</p>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="save-button"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => downloadAppointmentPdf(bookingSuccess)}
              >
                ⬇ Download PDF Confirmation
              </button>
              <button
                type="button"
                className="save-button"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => onNavigate('appointments')}
              >
                View in My Appointments →
              </button>
            </div>
          </div>
        )}

        {bookingError && (
          <div className="alert-banner error" role="alert">
            {bookingError}
          </div>
        )}

        {slots.length > 0 ? (
          <div>
            {Object.keys(slotsByDate).map((dateKey) => (
              <div key={dateKey} className="slot-day-group">
                <div className="slot-day-label">🗓️ {formatDate(dateKey)}</div>
                <div className="slot-list">
                  {slotsByDate[dateKey].map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`slot-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {selectedSlot && (
              <form className="booking-form" onSubmit={handleOpenBookingConfirm}>
                <div className="review-card">
                  <div className="review-row">
                    <span className="review-label">Selected Doctor:</span>
                    <span className="review-value">{doctor.fullName}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Date:</span>
                    <span className="review-value">{formatDate(selectedSlot.slotDate)}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Time:</span>
                    <span className="review-value">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Consultation Fee:</span>
                    <span className="review-value">{formatFee(doctor.consultationFee)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="booking-reason">Reason for Visit / Symptoms (Optional)</label>
                  <textarea
                    id="booking-reason"
                    rows={2}
                    className="input-field"
                    placeholder="e.g. Routine checkup, ongoing headache, skin rash"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isBooking}
                  />
                </div>

                {!currentUser ? (
                  <div className="login-prompt-card">
                    <h3>Sign In Required</h3>
                    <p>Please log in or register an account to reserve this appointment slot.</p>
                    <button
                      type="button"
                      className="save-button"
                      onClick={() => onNavigate('login')}
                    >
                      Log in to Book Consultation →
                    </button>
                  </div>
                ) : (
                  <div className="booking-actions">
                    <button
                      type="submit"
                      className="save-button"
                      disabled={isBooking}
                    >
                      {isBooking ? 'Securing Slot...' : 'Confirm Appointment Booking'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setSelectedSlot(null)}
                      disabled={isBooking}
                    >
                      Cancel Selection
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        ) : (
          /* Empty Slots Notice - authentic real-data state */
          <div className="login-prompt-card" style={{ maxWidth: '100%' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗓️</div>
            <h3>No Consultation Slots Currently Listed</h3>
            <p>
              {doctor.fullName} has not published any open appointment slots for online booking at this time.
              Please check back later or explore other verified specialists in our directory.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate('doctors')}
            >
              Browse Other Doctors
            </button>
          </div>
        )}
      </section>

      {/* Booking Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Appointment Booking"
        message="Please review your appointment details below before confirming. Once confirmed, this time slot will be reserved for your consultation."
        confirmText="Confirm & Book Slot"
        cancelText="Back / Modify"
        confirmVariant="primary"
        isLoading={isBooking}
        onConfirm={executeBooking}
        onCancel={() => setShowConfirmModal(false)}
        details={[
          { label: 'Doctor', value: doctor?.fullName || 'Specialist' },
          { label: 'Specialization', value: doctor?.specialization || 'General' },
          { label: 'Date', value: formatDate(selectedSlot?.slotDate) },
          {
            label: 'Time Slot',
            value: selectedSlot
              ? `${selectedSlot.startTime?.substring(0, 5)} - ${selectedSlot.endTime?.substring(0, 5)}`
              : '',
          },
          { label: 'Consultation Fee', value: formatFee(doctor?.consultationFee) },
          { label: 'Reason for Visit', value: reason.trim() || 'General Consultation' },
        ]}
      />
    </div>
  );
}

export default DoctorDetails;
