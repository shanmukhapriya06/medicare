package com.medicare.backend.service;

import com.medicare.backend.dto.DoctorCardResponse;
import com.medicare.backend.dto.DoctorProfileResponse;
import com.medicare.backend.dto.DoctorProfileUpdateRequest;
import com.medicare.backend.dto.DoctorSlotCreateRequest;
import com.medicare.backend.dto.DoctorSlotResponse;
import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.DoctorSlot;
import com.medicare.backend.entity.SlotStatus;
import com.medicare.backend.entity.User;
import com.medicare.backend.exception.ResourceNotFoundException;
import com.medicare.backend.exception.SlotUnavailableException;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.DoctorSlotRepository;
import com.medicare.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorSlotRepository doctorSlotRepository;
    private final UserRepository userRepository;

    public DoctorService(
            DoctorProfileRepository doctorProfileRepository,
            DoctorSlotRepository doctorSlotRepository,
            UserRepository userRepository
    ) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.doctorSlotRepository = doctorSlotRepository;
        this.userRepository = userRepository;
    }

    // ============================================================
    // Doctor's own profile (existing behaviour, unchanged)
    // ============================================================

    public DoctorProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Doctor user not found with email: " + email));

        DoctorProfile profile = doctorProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    // Create if not yet present
                    DoctorProfile newProfile = new DoctorProfile(user);
                    return doctorProfileRepository.save(newProfile);
                });

        return mapToResponse(profile);
    }

    public DoctorProfileResponse updateProfile(String email, DoctorProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Doctor user not found with email: " + email));

        // Update user's full name and phone number
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        userRepository.save(user);

        // Update doctor-specific details in DoctorProfile
        DoctorProfile profile = doctorProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> new DoctorProfile(user));

        profile.setSpecialization(request.getSpecialization());
        profile.setQualifications(request.getQualifications());
        profile.setExperience(request.getExperience());
        profile.setConsultationFee(request.getConsultationFee());
        profile.setBio(request.getBio());

        DoctorProfile savedProfile = doctorProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    public List<DoctorProfileResponse> getAllDoctors() {
        return doctorProfileRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Public doctor discovery (Stage 2)
    // ============================================================

    /**
     * Lists only APPROVED doctors that are currently available.
     * An optional name and/or specialization narrows the result set.
     */
    public List<DoctorCardResponse> searchDoctors(String name, String specialization) {
        String safeName = name == null ? "" : name.trim();
        String safeSpecialization = specialization == null ? "" : specialization.trim();
        return doctorProfileRepository
                .searchApprovedDoctors(DoctorApprovalStatus.APPROVED, safeName, safeSpecialization)
                .stream()
                .map(this::mapToCardResponse)
                .collect(Collectors.toList());
    }

    /** Distinct specializations for the filter dropdown (approved doctors only). */
    public List<String> getSpecializations() {
        return doctorProfileRepository.findDistinctSpecializations(DoctorApprovalStatus.APPROVED);
    }

    /** Full public detail view of a single approved doctor. */
    public DoctorCardResponse getDoctorDetail(Long doctorId) {
        DoctorProfile profile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (profile.getApprovalStatus() != DoctorApprovalStatus.APPROVED
                || !Boolean.TRUE.equals(profile.getAvailable())) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        return mapToCardResponse(profile);
    }

    /**
     * Publicly visible availability for a doctor: every future slot that is
     * still AVAILABLE. Booked and past slots are excluded so the UI can never
     * show a slot that cannot be taken.
     */
    @Transactional(readOnly = true)
    public List<DoctorSlotResponse> getAvailableSlots(Long doctorId) {
        DoctorProfile profile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (profile.getApprovalStatus() != DoctorApprovalStatus.APPROVED
                || !Boolean.TRUE.equals(profile.getAvailable())) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        return doctorSlotRepository
                .findByDoctorProfileIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                        profile.getId(), LocalDate.now())
                .stream()
                .filter(slot -> slot.getStatus() == SlotStatus.AVAILABLE)
                .map(this::mapToSlotResponse)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Doctor's own slot management (Stage 3)
    // ============================================================

    /** Every slot the logged-in doctor has opened, including already booked ones. */
    public List<DoctorSlotResponse> getMySlots(String email) {
        DoctorProfile profile = requireOwnProfile(email);
        return doctorSlotRepository.findByDoctorProfileIdOrderBySlotDateAscStartTimeAsc(profile.getId())
                .stream()
                .map(this::mapToSlotResponse)
                .collect(Collectors.toList());
    }

    /** Opens one new slot on the logged-in doctor's schedule. */
    @Transactional
    public DoctorSlotResponse createSlot(String email, DoctorSlotCreateRequest request) {
        DoctorProfile profile = requireOwnProfile(email);

        LocalDate date = parseDate(request.getSlotDate(), "Slot date");
        LocalTime start = parseTime(request.getStartTime(), "Start time");
        LocalTime end = parseTime(request.getEndTime(), "End time");

        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Slot date cannot be in the past");
        }
        if (doctorSlotRepository.existsByDoctorProfileIdAndSlotDateAndStartTime(profile.getId(), date, start)) {
            throw new SlotUnavailableException(
                    "You already opened a slot on " + date + " at " + start);
        }

        DoctorSlot slot = new DoctorSlot(profile, date, start, end);
        DoctorSlot saved = doctorSlotRepository.save(slot);
        return mapToSlotResponse(saved);
    }

    /** Removes an empty (not yet booked) slot from the schedule. */
    @Transactional
    public void deleteSlot(String email, Long slotId) {
        DoctorProfile profile = requireOwnProfile(email);

        DoctorSlot slot = doctorSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with id: " + slotId));

        if (!slot.getDoctorProfile().getId().equals(profile.getId())) {
            throw new IllegalArgumentException("You can only manage your own slots");
        }
        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new SlotUnavailableException("This slot is already booked and cannot be removed");
        }

        doctorSlotRepository.delete(slot);
    }

    private DoctorProfile requireOwnProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Doctor user not found with email: " + email));
        return doctorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile is not set up yet"));
    }

    // ============================================================
    // Shared helpers
    // ============================================================

    static LocalDate parseDate(String value, String fieldLabel) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(fieldLabel + " is not a valid date (expected yyyy-MM-dd)");
        }
    }

    static LocalTime parseTime(String value, String fieldLabel) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(fieldLabel + " is not a valid time (expected HH:mm)");
        }
    }

    private DoctorProfileResponse mapToResponse(DoctorProfile profile) {
        User user = profile.getUser();
        return new DoctorProfileResponse(
                profile.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getPhoneNumber(),
                profile.getSpecialization(),
                profile.getQualifications(),
                profile.getExperience(),
                profile.getConsultationFee(),
                profile.getBio()
        );
    }

    private DoctorCardResponse mapToCardResponse(DoctorProfile profile) {
        User user = profile.getUser();
        DoctorCardResponse card = new DoctorCardResponse(
                profile.getId(),
                user.getFullName(),
                user.getPhoneNumber(),
                profile.getSpecialization(),
                profile.getQualifications(),
                profile.getExperience(),
                profile.getConsultationFee(),
                profile.getBio(),
                profile.getApprovalStatus() != null ? profile.getApprovalStatus().name() : DoctorApprovalStatus.PENDING.name(),
                profile.getAvailable()
        );
        card.setClinicAddress(profile.getClinicAddress());
        return card;
    }

    private DoctorSlotResponse mapToSlotResponse(DoctorSlot slot) {
        DoctorProfile profile = slot.getDoctorProfile();
        return new DoctorSlotResponse(
                slot.getId(),
                profile.getId(),
                profile.getUser() != null ? profile.getUser().getFullName() : null,
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus() != null ? slot.getStatus().name() : SlotStatus.AVAILABLE.name()
        );
    }
}
