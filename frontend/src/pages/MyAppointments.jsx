import { useState, useEffect } from 'react';
import { getMyAppointments, cancelAppointment } from '../api/api';
import {
  PageHeading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  EmptyState,
  AlertBanner,
  LoadingSpinner,
  Tabs,
  ConfirmationModal,
} from '../components';
import { downloadAppointmentPdf, isDownloadableAppointment } from '../utils/appointmentPdf';
import './MyAppointments.css';

export function MyAppointments({ onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelAppt, setConfirmCancelAppt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAppointments() {
      setIsLoading(true);
      try {
        const data = await getMyAppointments('all').catch(() => []);
        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setAlert({ type: 'warning', message: err.message || 'Unable to retrieve appointments.' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();
    return () => {
      isMounted = false;
    };
  }, []);

  const executeCancel = async (apptId) => {
    setCancellingId(apptId);
    try {
      await cancelAppointment(apptId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a))
      );
      setAlert({ type: 'success', message: 'Appointment was successfully cancelled and the slot has been released.' });
      setConfirmCancelAppt(null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to cancel appointment.' });
      setConfirmCancelAppt(null);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadPdf = (appt) => {
    const triggered = downloadAppointmentPdf(appt);
    if (triggered) {
      setAlert({ type: 'success', message: `Appointment #${appt.id} confirmation PDF is being downloaded.` });
    } else {
      setAlert({ type: 'warning', message: 'This appointment is missing details needed to generate a PDF confirmation.' });
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'upcoming') return a.status === 'CONFIRMED' || a.status === 'PENDING' || a.status === 'APPROVED';
    if (activeTab === 'past') return a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED';
    return true;
  });

  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING' || a.status === 'APPROVED').length;
  const pastCount = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED').length;

  const tabs = [
    { id: 'all', label: 'All Appointments', count: appointments.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'past', label: 'Past & Completed', count: pastCount },
  ];

  return (
    <div className="my-appointments-page">
      <PageHeading
        title="My Appointments"
        subtitle="Review, manage, and check the status of your consultations."
        onBack={() => onNavigate('dashboard')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('doctors')}
          >
            + Book New Appointment
          </Button>
        }
      />

      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="appointments-tabs-bar">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner message="Fetching your appointments..." />
      ) : filteredAppointments.length > 0 ? (
        <div className="appointments-cards-grid">
          {filteredAppointments.map((appt) => (
            <Card key={appt.id} className="appointment-card-item">
              <CardHeader className="appointment-card-header">
                <div>
                  <span className="appointment-date-badge">
                    🗓️ {appt.appointmentDate || 'Scheduled Date'} {appt.appointmentTime ? `• ⏰ ${appt.appointmentTime.substring(0, 5)}` : ''}
                  </span>
                  <CardTitle className="appt-doctor-name">
                    {appt.doctorName || 'Medical Specialist'}
                  </CardTitle>
                  <p className="appt-specialization">
                    {appt.doctorSpecialization || appt.specialization || 'Clinical Consultation'}
                  </p>
                </div>
                <StatusBadge status={appt.status || 'PENDING'} size="md" />
              </CardHeader>

              <CardContent className="appointment-card-body">
                {appt.reason && (
                  <div className="appt-info-row">
                    <span className="appt-info-label">Reason:</span>
                    <span className="appt-info-val">{appt.reason}</span>
                  </div>
                )}
                {appt.consultationFee && (
                  <div className="appt-info-row">
                    <span className="appt-info-label">Consultation Fee:</span>
                    <span className="appt-info-val">₹{appt.consultationFee}</span>
                  </div>
                )}
                <div className="appt-info-row">
                  <span className="appt-info-label">Appointment ID:</span>
                  <span className="appt-info-val">#{appt.id}</span>
                </div>
              </CardContent>

              {(appt.status === 'CONFIRMED' || appt.status === 'PENDING' || appt.status === 'APPROVED') && (
                <div className="appointment-card-footer">
                  {isDownloadableAppointment(appt) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadPdf(appt)}
                    >
                      ⬇ Download PDF
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="danger-outline-btn"
                    isLoading={cancellingId === appt.id}
                    onClick={() => setConfirmCancelAppt(appt)}
                  >
                    Cancel Appointment
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📅"
          title={`No ${activeTab !== 'all' ? activeTab : ''} appointments found`}
          description="You do not have any appointments in this view category."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('doctors')}
            >
              Find Doctors &amp; Book
            </Button>
          }
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationModal
        isOpen={Boolean(confirmCancelAppt)}
        title="Cancel Appointment Confirmation"
        message="Are you sure you want to cancel this scheduled appointment? This action will immediately release your time slot back to the doctor's calendar."
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        isLoading={cancellingId === confirmCancelAppt?.id}
        onConfirm={() => executeCancel(confirmCancelAppt.id)}
        onCancel={() => setConfirmCancelAppt(null)}
        details={[
          { label: 'Doctor', value: confirmCancelAppt?.doctorName || 'Specialist' },
          { label: 'Specialization', value: confirmCancelAppt?.doctorSpecialization || confirmCancelAppt?.specialization || 'Clinical' },
          { label: 'Scheduled Date', value: confirmCancelAppt?.appointmentDate },
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

export default MyAppointments;
