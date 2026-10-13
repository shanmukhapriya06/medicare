package com.medicare.backend.service;

import com.medicare.backend.dto.AdminProfileResponse;
import com.medicare.backend.dto.AdminProfileUpdateRequest;
import com.medicare.backend.dto.DoctorAnalyticsResponse;
import com.medicare.backend.dto.DoctorCardResponse;
import com.medicare.backend.dto.UserSummaryResponse;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.AppointmentStatus;
import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminService(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentRepository = appointmentRepository;
    }

    /** Doctor treatment analytics including how many patients were treated today. */
    public List<DoctorAnalyticsResponse> getDoctorAnalytics() {
        LocalDate today = LocalDate.now();
        return doctorProfileRepository.findAll().stream()
                .map(profile -> {
                    User u = profile.getUser();
                    List<Appointment> list = appointmentRepository
                            .findByDoctorProfileIdOrderByAppointmentDateDescAppointmentTimeDesc(profile.getId());

                    long treatedToday = list.stream()
                            .filter(a -> a.getAppointmentDate().equals(today) &&
                                    (a.getStatus() == AppointmentStatus.COMPLETED || a.getStatus() == AppointmentStatus.APPROVED))
                            .count();

                    long todayScheduled = list.stream()
                            .filter(a -> a.getAppointmentDate().equals(today) &&
                                    a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.REJECTED)
                            .count();

                    long totalCompleted = list.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                            .count();

                    long totalAllTime = list.stream()
                            .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.REJECTED)
                            .count();

                    return new DoctorAnalyticsResponse(
                            profile.getId(),
                            u.getFullName(),
                            profile.getSpecialization(),
                            profile.getConsultationFee() != null ? profile.getConsultationFee() : 0.0,
                            treatedToday,
                            todayScheduled,
                            totalCompleted,
                            totalAllTime
                    );
                })
                .collect(Collectors.toList());
    }

    /** Every doctor profile including pending ones, so an admin can review them. */
    public List<DoctorCardResponse> getAllDoctors() {
        return doctorProfileRepository.findAll().stream()
                .map(profile -> {
                    User u = profile.getUser();
                    return doctorProfileToCard(profile, u);
                })
                .collect(Collectors.toList());
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole(),
                        u.getPhoneNumber()
                ))
                .collect(Collectors.toList());
    }

    public UserSummaryResponse updateUserRole(Long userId, String newRole) {
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role cannot be empty");
        }

        String normalizedRole = newRole.trim().toUpperCase();
        if (!"PATIENT".equals(normalizedRole) && !"DOCTOR".equals(normalizedRole) && !"ADMIN".equals(normalizedRole)) {
            throw new IllegalArgumentException("Invalid role. Role must be PATIENT, DOCTOR, or ADMIN.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        user.setRole(normalizedRole);
        User savedUser = userRepository.save(user);

        // If promoted to DOCTOR, ensure a DoctorProfile row exists
        if ("DOCTOR".equals(normalizedRole) && !doctorProfileRepository.existsByUserId(savedUser.getId())) {
            DoctorProfile doctorProfile = new DoctorProfile(savedUser);
            doctorProfile.setSpecialization("Specialist");
            doctorProfile.setQualifications("");
            doctorProfile.setExperience(0);
            doctorProfile.setConsultationFee(0.0);
            doctorProfile.setBio("");
            doctorProfileRepository.save(doctorProfile);
        }

        return new UserSummaryResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getPhoneNumber()
        );
    }

    /**
     * Approves or rejects a doctor profile. Only APPROVED doctors appear in the
     * public Find Doctors directory.
     */
    public DoctorCardResponse updateDoctorApproval(Long doctorId, String approvalStatus) {
        if (approvalStatus == null || approvalStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Approval status cannot be empty");
        }

        String normalized = approvalStatus.trim().toUpperCase();
        DoctorApprovalStatus newStatus;
        try {
            newStatus = DoctorApprovalStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status. Use PENDING, APPROVED or REJECTED.");
        }

        DoctorProfile profile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with id: " + doctorId));

        profile.setApprovalStatus(newStatus);
        DoctorProfile saved = doctorProfileRepository.save(profile);

        User doctorUser = saved.getUser();
        return doctorProfileToCard(saved, doctorUser);
    }

    private DoctorCardResponse doctorProfileToCard(DoctorProfile profile, User doctorUser) {
        DoctorCardResponse card = new DoctorCardResponse(
                profile.getId(),
                doctorUser.getFullName(),
                doctorUser.getPhoneNumber(),
                profile.getSpecialization(),
                profile.getQualifications(),
                profile.getExperience(),
                profile.getConsultationFee(),
                profile.getBio(),
                profile.getApprovalStatus() != null
                        ? profile.getApprovalStatus().name()
                        : DoctorApprovalStatus.PENDING.name(),
                profile.getAvailable()
        );
        card.setClinicAddress(profile.getClinicAddress());
        return card;
    }

    public AdminProfileResponse getAdminProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found with email: " + email));
        return new AdminProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getRole()
        );
    }

    public AdminProfileResponse updateAdminProfile(String email, AdminProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found with email: " + email));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        User saved = userRepository.save(user);
        return new AdminProfileResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getPhoneNumber(),
                saved.getAddress(),
                saved.getRole()
        );
    }
}
