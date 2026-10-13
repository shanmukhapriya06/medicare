package com.medicare.backend.service;

import com.medicare.backend.dto.DoctorApplicationResponse;
import com.medicare.backend.entity.DoctorApplication;
import com.medicare.backend.entity.DoctorApplicationStatus;
import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.User;
import com.medicare.backend.exception.ResourceNotFoundException;
import com.medicare.backend.repository.DoctorApplicationRepository;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Handles the "Apply as Doctor" workflow: a registered user submits a
 * professional application with medical credentials, and only an administrator
 * can approve or reject it. Approval promotes the user to the DOCTOR role and
 * creates/updates their DoctorProfile so they can appear in Find Doctors once
 * the profile satisfies the existing visibility rules (APPROVED + available).
 */
@Service
public class DoctorApplicationService {

    /** Maximum accepted credential document size: 5 MB. */
    public static final long MAX_CREDENTIALS_BYTES = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    private final DoctorApplicationRepository doctorApplicationRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    public DoctorApplicationService(
            DoctorApplicationRepository doctorApplicationRepository,
            DoctorProfileRepository doctorProfileRepository,
            UserRepository userRepository
    ) {
        this.doctorApplicationRepository = doctorApplicationRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.userRepository = userRepository;
    }

    // ============================================================
    // Applicant actions
    // ============================================================

    /**
     * Stores a new application for the logged-in user after validating every
     * field and the uploaded credentials document (PDF / JPG / PNG, max 5 MB).
     */
    @Transactional
    public DoctorApplicationResponse submitApplication(
            String applicantEmail,
            String fullName,
            String email,
            String phoneNumber,
            String specialization,
            String experience,
            String consultationFee,
            String clinicAddress,
            String availabilityStart,
            String availabilityEnd,
            MultipartFile credentials
    ) {
        User applicant = userRepository.findByEmail(applicantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + applicantEmail));

        if ("ADMIN".equals(applicant.getRole())) {
            throw new IllegalArgumentException("Administrator accounts cannot apply as doctors.");
        }

        if ("DOCTOR".equals(applicant.getRole())
                && doctorProfileRepository.findByUserId(applicant.getId())
                .map(p -> p.getApprovalStatus() == DoctorApprovalStatus.APPROVED)
                .orElse(false)) {
            throw new IllegalArgumentException("You are already an approved doctor on MediCare.");
        }

        boolean hasActiveApplication = doctorApplicationRepository.existsByApplicantIdAndStatusIn(
                applicant.getId(),
                Arrays.asList(DoctorApplicationStatus.PENDING, DoctorApplicationStatus.APPROVED)
        );
        if (hasActiveApplication) {
            throw new IllegalArgumentException(
                    "You already have a pending or approved doctor application. Please wait for an administrator to review it.");
        }

        // ---- Field validation -------------------------------------------------
        String cleanFullName = requireText(fullName, "Full name", 100);
        String cleanEmail = requireEmail(email);
        String cleanPhone = requireText(phoneNumber, "Phone number", 20);
        if (!cleanPhone.matches("^[0-9+()\\-.\\s]{7,20}$")) {
            throw new IllegalArgumentException("Phone number must contain only digits, spaces, +, -, ( or )");
        }
        String cleanSpecialization = requireText(specialization, "Specialization", 100);
        int cleanExperience = parseBoundedInt(experience, "Experience", 0, 60);
        double cleanFee = parseBoundedDouble(consultationFee, "Consultation fee", 1.0, 1_000_000.0);
        String cleanClinicAddress = requireText(clinicAddress, "Clinic address", 500);
        String cleanStart = parseTimeValue(availabilityStart, "Availability start time");
        String cleanEnd = parseTimeValue(availabilityEnd, "Availability end time");
        if (!LocalTime.parse(cleanEnd).isAfter(LocalTime.parse(cleanStart))) {
            throw new IllegalArgumentException("Availability end time must be after the start time");
        }

        // ---- Credentials document validation ----------------------------------
        if (credentials == null || credentials.isEmpty()) {
            throw new IllegalArgumentException("Medical credentials document is required (PDF, JPG or PNG)");
        }
        long fileSize = credentials.getSize();
        if (fileSize > MAX_CREDENTIALS_BYTES) {
            throw new IllegalArgumentException("Credential document is too large. Maximum allowed size is 5 MB.");
        }
        String contentType = credentials.getContentType() == null ? "" : credentials.getContentType().toLowerCase(Locale.ROOT);
        String fileName = credentials.getOriginalFilename() == null ? "credentials" : credentials.getOriginalFilename();
        String extension = extractExtension(fileName);
        boolean contentTypeAllowed = ALLOWED_CONTENT_TYPES.contains(contentType);
        boolean extensionAllowed = ALLOWED_EXTENSIONS.contains(extension);
        if (!contentTypeAllowed && !extensionAllowed) {
            throw new IllegalArgumentException("Unsupported file type. Please upload a PDF, JPG or PNG document.");
        }
        if (extensionAllowed && !contentTypeAllowed) {
            contentType = switch (extension) {
                case "pdf" -> "application/pdf";
                case "png" -> "image/png";
                default -> "image/jpeg";
            };
        }
        byte[] fileBytes;
        try {
            fileBytes = credentials.getBytes();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read the uploaded credentials document. Please try again.");
        }
        if (fileBytes.length == 0) {
            throw new IllegalArgumentException("The uploaded credentials document appears to be empty.");
        }

        DoctorApplication application = new DoctorApplication();
        application.setApplicant(applicant);
        application.setFullName(cleanFullName);
        application.setEmail(cleanEmail);
        application.setPhoneNumber(cleanPhone);
        application.setSpecialization(cleanSpecialization);
        application.setExperience(cleanExperience);
        application.setConsultationFee(cleanFee);
        application.setClinicAddress(cleanClinicAddress);
        application.setAvailabilityStart(cleanStart);
        application.setAvailabilityEnd(cleanEnd);
        application.setCredentialsFileName(fileName);
        application.setCredentialsContentType(contentType);
        application.setCredentialsFileSize(fileBytes.length);
        application.setCredentialsData(fileBytes);
        application.setStatus(DoctorApplicationStatus.PENDING);

        DoctorApplication saved = doctorApplicationRepository.save(application);
        return DoctorApplicationResponse.from(saved);
    }

    /** The logged-in user's most recent application, or empty when none exists. */
    @Transactional(readOnly = true)
    public Optional<DoctorApplicationResponse> getMyApplication(String applicantEmail) {
        User applicant = userRepository.findByEmail(applicantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + applicantEmail));
        return doctorApplicationRepository.findTopByApplicantIdOrderBySubmittedAtDesc(applicant.getId())
                .map(DoctorApplicationResponse::from);
    }

    // ============================================================
    // Administrator actions
    // ============================================================

    @Transactional(readOnly = true)
    public List<DoctorApplicationResponse> getAllApplications() {
        return doctorApplicationRepository.findAllByOrderBySubmittedAtDesc().stream()
                .map(DoctorApplicationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorApplicationResponse> getApplicationsByStatus(String status) {
        DoctorApplicationStatus parsed = parseStatus(status);
        return doctorApplicationRepository.findByStatusOrderBySubmittedAtDesc(parsed).stream()
                .map(DoctorApplicationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Approves or rejects an application. Only PENDING applications can be
     * reviewed. On approval the applicant is promoted to the DOCTOR role and
     * their DoctorProfile is created/updated with the application data.
     */
    @Transactional
    public DoctorApplicationResponse reviewApplication(
            Long applicationId,
            String approvalStatus,
            String reviewNotes,
            String adminEmail
    ) {
        DoctorApplication application = doctorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor application not found with id: " + applicationId));

        if (application.getStatus() != DoctorApplicationStatus.PENDING) {
            throw new IllegalArgumentException(
                    "This application has already been reviewed and marked as " + application.getStatus() + ".");
        }

        DoctorApplicationStatus newStatus = parseStatus(approvalStatus);
        if (newStatus == DoctorApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Invalid status. Use APPROVED or REJECTED.");
        }

        application.setStatus(newStatus);
        application.setReviewNotes(reviewNotes != null && !reviewNotes.trim().isEmpty()
                ? reviewNotes.trim().substring(0, Math.min(reviewNotes.trim().length(), 1000))
                : null);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setReviewedBy(adminEmail);

        if (newStatus == DoctorApplicationStatus.APPROVED) {
            promoteApplicantToDoctor(application);
        }

        DoctorApplication saved = doctorApplicationRepository.save(application);
        return DoctorApplicationResponse.from(saved);
    }

    /** Returns the stored credentials document for administrator verification. */
    @Transactional(readOnly = true)
    public DoctorApplication getApplicationEntity(Long applicationId) {
        return doctorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor application not found with id: " + applicationId));
    }

    // ============================================================
    // Internal helpers
    // ============================================================

    private void promoteApplicantToDoctor(DoctorApplication application) {
        User applicant = application.getApplicant();
        if (applicant == null) {
            return;
        }

        // Promote the account so /api/doctor/** endpoints become accessible
        applicant.setRole("DOCTOR");
        if (application.getPhoneNumber() != null && !application.getPhoneNumber().isBlank()) {
            applicant.setPhoneNumber(application.getPhoneNumber());
        }
        if (application.getFullName() != null && !application.getFullName().isBlank()) {
            applicant.setFullName(application.getFullName());
        }
        userRepository.save(applicant);

        DoctorProfile profile = doctorProfileRepository.findByUserId(applicant.getId())
                .orElseGet(() -> new DoctorProfile(applicant));

        profile.setSpecialization(application.getSpecialization());
        profile.setExperience(application.getExperience());
        profile.setConsultationFee(application.getConsultationFee());
        profile.setClinicAddress(application.getClinicAddress());
        profile.setAvailabilityStart(application.getAvailabilityStart());
        profile.setAvailabilityEnd(application.getAvailabilityEnd());
        if (profile.getQualifications() == null || profile.getQualifications().isBlank()) {
            profile.setQualifications(application.getCredentialsFileName() != null
                    ? "Credentials verified (" + application.getCredentialsFileName() + ")"
                    : "Credentials verified");
        }
        // An approved application makes the profile immediately reviewable and,
        // with available = TRUE, visible in Find Doctors like any other doctor.
        profile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        profile.setAvailable(Boolean.TRUE);
        doctorProfileRepository.save(profile);
    }

    private static DoctorApplicationStatus parseStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }
        try {
            return DoctorApplicationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status. Use PENDING, APPROVED or REJECTED.");
        }
    }

    private static String extractExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String requireText(String value, String fieldLabel, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        String cleaned = value.trim();
        if (cleaned.length() > maxLength) {
            throw new IllegalArgumentException(fieldLabel + " must be at most " + maxLength + " characters");
        }
        return cleaned;
    }

    private static String requireEmail(String email) {
        String cleaned = requireText(email, "Email", 150).toLowerCase(Locale.ROOT);
        if (!cleaned.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Please provide a valid email address");
        }
        return cleaned;
    }

    private static int parseBoundedInt(String value, String fieldLabel, int min, int max) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        try {
            int parsed = Integer.parseInt(value.trim());
            if (parsed < min || parsed > max) {
                throw new IllegalArgumentException(fieldLabel + " must be between " + min + " and " + max);
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(fieldLabel + " must be a whole number");
        }
    }

    private static double parseBoundedDouble(String value, String fieldLabel, double min, double max) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        try {
            double parsed = Double.parseDouble(value.trim());
            if (parsed < min || parsed > max) {
                throw new IllegalArgumentException(fieldLabel + " must be between " + min + " and " + max);
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid amount");
        }
    }

    private static String parseTimeValue(String value, String fieldLabel) {
        String cleaned = requireText(value, fieldLabel, 10);
        try {
            return LocalTime.parse(cleaned).toString();
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid time (HH:mm)");
        }
    }
}
