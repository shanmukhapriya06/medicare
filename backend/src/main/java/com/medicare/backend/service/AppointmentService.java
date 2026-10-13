package com.medicare.backend.service;

import com.medicare.backend.dto.AppointmentCreateRequest;
import com.medicare.backend.dto.AppointmentResponse;
import com.medicare.backend.entity.*;
import com.medicare.backend.exception.ResourceNotFoundException;
import com.medicare.backend.exception.SlotUnavailableException;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.DoctorSlotRepository;
import com.medicare.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorSlotRepository doctorSlotRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            DoctorSlotRepository doctorSlotRepository,
            DoctorProfileRepository doctorProfileRepository,
            UserRepository userRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.doctorSlotRepository = doctorSlotRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.userRepository = userRepository;
    }

    /**
     * Books a single consultation slot for a patient.
     * Uses pessimistic write lock on the slot to prevent race conditions / double bookings.
     */
    @Transactional
    public AppointmentResponse bookAppointment(String patientEmail, AppointmentCreateRequest request) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Patient account not found: " + patientEmail));

        // Lock the slot record to prevent concurrent double-booking
        DoctorSlot slot = doctorSlotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Consultation slot not found with id: " + request.getSlotId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new SlotUnavailableException("This consultation slot is already booked. Please choose another time.");
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (slot.getSlotDate().isBefore(today) || (slot.getSlotDate().isEqual(today) && slot.getStartTime().isBefore(now))) {
            throw new SlotUnavailableException("This consultation slot is in the past and cannot be booked.");
        }

        boolean alreadyBooked = appointmentRepository.existsBySlotIdAndStatusIn(
                slot.getId(),
                Arrays.asList(AppointmentStatus.PENDING, AppointmentStatus.APPROVED)
        );
        if (alreadyBooked) {
            throw new SlotUnavailableException("This consultation slot has already been reserved.");
        }

        DoctorProfile doctorProfile = slot.getDoctorProfile();
        if (doctorProfile.getApprovalStatus() != DoctorApprovalStatus.APPROVED || !Boolean.TRUE.equals(doctorProfile.getAvailable())) {
            throw new SlotUnavailableException("This doctor is currently not accepting appointments.");
        }

        // Mark slot as BOOKED
        slot.setStatus(SlotStatus.BOOKED);
        doctorSlotRepository.save(slot);

        // Create the appointment entity
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctorProfile(doctorProfile);
        appointment.setSlot(slot);
        appointment.setAppointmentDate(slot.getSlotDate());
        appointment.setAppointmentTime(slot.getStartTime());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setReason(request.getReason() != null ? request.getReason().trim() : "");
        appointment.setConsultationFee(doctorProfile.getConsultationFee());

        Appointment saved = appointmentRepository.save(appointment);
        return mapToResponse(saved);
    }

    /**
     * Returns all appointments booked by the patient ordered by newest date first.
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(String patientEmail) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Patient account not found: " + patientEmail));

        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(patient.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cancels an existing appointment and frees the slot back to AVAILABLE if it is in the future.
     */
    @Transactional
    public AppointmentResponse cancelAppointment(String patientEmail, Long appointmentId) {
        String cleanEmail = patientEmail != null ? patientEmail.trim() : "";
        User patient = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Patient account not found: " + cleanEmail));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        if (!appointment.getPatient().getId().equals(patient.getId()) && !"ADMIN".equals(patient.getRole())) {
            throw new IllegalArgumentException("You can only cancel your own appointments.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalArgumentException("This appointment is already cancelled.");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed consultations cannot be cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        // Free the associated slot if it is today or in the future
        DoctorSlot slot = appointment.getSlot();
        if (slot != null) {
            LocalDate today = LocalDate.now();
            if (!slot.getSlotDate().isBefore(today)) {
                slot.setStatus(SlotStatus.AVAILABLE);
                doctorSlotRepository.save(slot);
            }
        }

        Appointment updated = appointmentRepository.save(appointment);
        return mapToResponse(updated);
    }

    /**
     * Retrieves all incoming consultations for a doctor.
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(String doctorEmail) {
        DoctorProfile profile = requireDoctorProfile(doctorEmail);

        return appointmentRepository.findByDoctorProfileIdOrderByAppointmentDateDescAppointmentTimeDesc(profile.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates the status of an appointment (e.g. APPROVED, REJECTED, COMPLETED).
     * If approved, automatically cancels any other pending/active appointments
     * for the same patient to prevent multi-slot conflicts, freeing up those slots.
     * If rejected or cancelled, frees the slot back to AVAILABLE.
     */
    @Transactional
    public AppointmentResponse updateAppointmentStatus(String doctorEmail, Long appointmentId, String statusStr) {
        DoctorProfile profile = requireDoctorProfile(doctorEmail);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        if (!appointment.getDoctorProfile().getId().equals(profile.getId())) {
            throw new IllegalArgumentException("You can only manage your own patient appointments.");
        }

        AppointmentStatus targetStatus;
        try {
            targetStatus = AppointmentStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid appointment status: " + statusStr);
        }

        appointment.setStatus(targetStatus);

        // If the appointment is confirmed (APPROVED) by the doctor, automatically remove/cancel
        // any other appointments of different time slots from the same patient, freeing their slots.
        if (targetStatus == AppointmentStatus.APPROVED) {
            Long patientId = appointment.getPatient().getId();
            List<Appointment> allPatientAppointments = appointmentRepository
                    .findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(patientId);
            LocalDate today = LocalDate.now();

            for (Appointment other : allPatientAppointments) {
                if (!other.getId().equals(appointment.getId()) &&
                        (other.getStatus() == AppointmentStatus.PENDING || other.getStatus() == AppointmentStatus.APPROVED)) {
                    other.setStatus(AppointmentStatus.CANCELLED);
                    DoctorSlot otherSlot = other.getSlot();
                    if (otherSlot != null && !otherSlot.getSlotDate().isBefore(today)) {
                        otherSlot.setStatus(SlotStatus.AVAILABLE);
                        doctorSlotRepository.save(otherSlot);
                    }
                    appointmentRepository.save(other);
                }
            }
        }

        // If the appointment is rejected or cancelled, free the slot back to AVAILABLE
        if (targetStatus == AppointmentStatus.REJECTED || targetStatus == AppointmentStatus.CANCELLED) {
            DoctorSlot slot = appointment.getSlot();
            if (slot != null) {
                LocalDate today = LocalDate.now();
                if (!slot.getSlotDate().isBefore(today)) {
                    slot.setStatus(SlotStatus.AVAILABLE);
                    doctorSlotRepository.save(slot);
                }
            }
        }

        Appointment updated = appointmentRepository.save(appointment);
        return mapToResponse(updated);
    }

    /**
     * Returns overview metrics and summary stats for doctor dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDoctorDashboard(String doctorEmail) {
        DoctorProfile profile = requireDoctorProfile(doctorEmail);
        List<AppointmentResponse> appointments = getDoctorAppointments(doctorEmail);

        LocalDate today = LocalDate.now();
        long pendingCount = appointments.stream()
                .filter(a -> "PENDING".equalsIgnoreCase(a.getStatus()))
                .count();

        long confirmedCount = appointments.stream()
                .filter(a -> "APPROVED".equalsIgnoreCase(a.getStatus()))
                .count();

        long todayCount = appointments.stream()
                .filter(a -> today.equals(a.getAppointmentDate()) && ("PENDING".equalsIgnoreCase(a.getStatus()) || "APPROVED".equalsIgnoreCase(a.getStatus())))
                .count();

        List<DoctorSlot> slots = doctorSlotRepository.findByDoctorProfileIdOrderBySlotDateAscStartTimeAsc(profile.getId());
        long availableSlotsCount = slots.stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE && !s.getSlotDate().isBefore(today))
                .count();

        Map<String, Object> data = new HashMap<>();
        data.put("doctorId", profile.getId());
        data.put("doctorName", profile.getUser().getFullName());
        data.put("specialization", profile.getSpecialization());
        data.put("approvalStatus", profile.getApprovalStatus().name());
        data.put("isAvailable", profile.getAvailable());
        data.put("totalAppointments", appointments.size());
        data.put("pendingRequestsCount", pendingCount);
        data.put("confirmedAppointmentsCount", confirmedCount);
        data.put("todayAppointmentsCount", todayCount);
        data.put("totalSlotsCount", slots.size());
        data.put("availableSlotsCount", availableSlotsCount);

        return data;
    }

    private DoctorProfile requireDoctorProfile(String doctorEmail) {
        User user = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor user not found: " + doctorEmail));

        return doctorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile is not set up yet."));
    }

    private AppointmentResponse mapToResponse(Appointment app) {
        AppointmentResponse res = new AppointmentResponse();
        res.setId(app.getId());
        res.setSlotId(app.getSlot() != null ? app.getSlot().getId() : null);

        // Doctor details
        DoctorProfile doc = app.getDoctorProfile();
        if (doc != null) {
            res.setDoctorId(doc.getId());
            res.setDoctorSpecialization(doc.getSpecialization());
            res.setDoctorQualifications(doc.getQualifications());
            res.setClinicAddress(doc.getClinicAddress());
            if (doc.getUser() != null) {
                res.setDoctorName(doc.getUser().getFullName());
            }
        }

        // Patient details
        User patient = app.getPatient();
        if (patient != null) {
            res.setPatientId(patient.getId());
            res.setPatientName(patient.getFullName());
            res.setPatientEmail(patient.getEmail());
            res.setPatientPhone(patient.getPhoneNumber());
        }

        res.setConsultationFee(app.getConsultationFee());
        res.setAppointmentDate(app.getAppointmentDate());
        res.setAppointmentTime(app.getAppointmentTime());
        res.setStatus(app.getStatus() != null ? app.getStatus().name() : AppointmentStatus.PENDING.name());
        res.setReason(app.getReason());
        res.setCreatedAt(app.getCreatedAt());

        return res;
    }
}
