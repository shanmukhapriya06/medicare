package com.medicare.backend.config;

import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.DoctorSlot;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.DoctorSlotRepository;
import com.medicare.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    /** Shared demo password for the seeded doctor accounts (development only). */
    static final String DEMO_DOCTOR_PASSWORD = "Doctor@123";

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorSlotRepository doctorSlotRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedDemoDoctors;

    public DataInitializer(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            DoctorSlotRepository doctorSlotRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-demo-doctors:true}") boolean seedDemoDoctors
    ) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.doctorSlotRepository = doctorSlotRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedDemoDoctors = seedDemoDoctors;
    }

    @Override
    public void run(String... args) {
        // Ensure an initial administrator exists for secure role management
        String adminEmail = "admin@medicare.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User(
                    "System Administrator",
                    adminEmail,
                    passwordEncoder.encode("Admin@123"),
                    "ADMIN"
            );
            admin.setPhoneNumber("9876543210");
            admin.setAddress("MediCare Headquarters");
            userRepository.save(admin);
            System.out.println(">>> Initialized default administrator: " + adminEmail);
        }

        // Seed APPROVED demo doctors so the public Find Doctors directory has data.
        // Safe to run repeatedly: existing accounts are never overwritten.
        if (seedDemoDoctors) {
            seedDemoDoctor(
                    "Dr. Rajesh Kumar",
                    "dr.rajesh.kumar@medicare.com",
                    "9123456780",
                    "Cardiology",
                    "MBBS, MD (Cardiology), DM (Cardiology)",
                    10,
                    800.0,
                    "Senior consultant cardiologist with 10 years of clinical experience in interventional cardiology, heart failure treatment, and comprehensive cardiovascular care."
            );
            seedDemoDoctor(
                    "Dr. Priya Sharma",
                    "dr.priya.sharma@medicare.com",
                    "9876501234",
                    "Dermatology",
                    "MBBS, MD (Dermatology, Venereology & Leprosy)",
                    7,
                    650.0,
                    "Specialist dermatologist with 7 years of clinical practice focusing on medical dermatology, aesthetic skin therapies, and pediatric dermatology."
            );
            seedDemoDoctor(
                    "Dr. Arjun Reddy",
                    "dr.arjun.reddy@medicare.com",
                    "9876505678",
                    "General Medicine",
                    "MBBS, MD (General Medicine)",
                    8,
                    500.0,
                    "Consultant physician with 8 years of experience in internal medicine, chronic disease management, preventive diagnostics, and primary care."
            );
        }
    }

    /**
     * Creates one demo doctor (User with role DOCTOR + an APPROVED, available
     * DoctorProfile) if it does not exist yet. If the account already exists it
     * is left completely untouched, so re-running the application never
     * overwrites real or previously seeded data.
     */
    private void seedDemoDoctor(
            String fullName,
            String email,
            String phoneNumber,
            String specialization,
            String qualifications,
            int experience,
            double consultationFee,
            String bio
    ) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (!"DOCTOR".equals(user.getRole())) {
                System.out.println(">>> Demo doctor email is already used by a non-doctor account, skipping: " + email);
                return;
            }
            Optional<DoctorProfile> profileOpt = doctorProfileRepository.findByUserId(user.getId());
            if (profileOpt.isPresent()) {
                DoctorProfile existingProfile = profileOpt.get();
                boolean changed = false;
                if (existingProfile.getApprovalStatus() != DoctorApprovalStatus.APPROVED) {
                    existingProfile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
                    changed = true;
                }
                if (!Boolean.TRUE.equals(existingProfile.getAvailable())) {
                    existingProfile.setAvailable(Boolean.TRUE);
                    changed = true;
                }
                if (changed) {
                    existingProfile = doctorProfileRepository.save(existingProfile);
                    System.out.println(">>> Verified approved and available status for demo doctor: " + email);
                }
                seedDemoSlotsIfEmpty(existingProfile);
                return;
            }
            // Partial state (doctor user without profile): complete the profile only
            DoctorProfile newProfile = doctorProfileRepository.save(
                    createApprovedProfile(user, specialization, qualifications, experience, consultationFee, bio));
            seedDemoSlotsIfEmpty(newProfile);
            System.out.println(">>> Completed missing profile for demo doctor: " + email);
            return;
        }

        User doctorUser = new User(fullName, email, passwordEncoder.encode(DEMO_DOCTOR_PASSWORD), "DOCTOR");
        doctorUser.setPhoneNumber(phoneNumber);
        User savedUser = userRepository.save(doctorUser);

        DoctorProfile newProfile = doctorProfileRepository.save(
                createApprovedProfile(savedUser, specialization, qualifications, experience, consultationFee, bio));
        seedDemoSlotsIfEmpty(newProfile);
        System.out.println(">>> Initialized demo doctor: " + email + " (demo password: " + DEMO_DOCTOR_PASSWORD + ")");
    }

    private void seedDemoSlotsIfEmpty(DoctorProfile profile) {
        if (profile == null || profile.getId() == null) return;
        if (doctorSlotRepository.findByDoctorProfileIdOrderBySlotDateAscStartTimeAsc(profile.getId()).isEmpty()) {
            LocalDate today = LocalDate.now();
            LocalDate tomorrow = today.plusDays(1);
            LocalDate dayAfter = today.plusDays(2);

            doctorSlotRepository.save(new DoctorSlot(profile, tomorrow, LocalTime.of(9, 0), LocalTime.of(9, 30)));
            doctorSlotRepository.save(new DoctorSlot(profile, tomorrow, LocalTime.of(10, 0), LocalTime.of(10, 30)));
            doctorSlotRepository.save(new DoctorSlot(profile, tomorrow, LocalTime.of(11, 30), LocalTime.of(12, 0)));
            doctorSlotRepository.save(new DoctorSlot(profile, tomorrow, LocalTime.of(14, 0), LocalTime.of(14, 30)));
            doctorSlotRepository.save(new DoctorSlot(profile, tomorrow, LocalTime.of(15, 30), LocalTime.of(16, 0)));

            doctorSlotRepository.save(new DoctorSlot(profile, dayAfter, LocalTime.of(9, 30), LocalTime.of(10, 0)));
            doctorSlotRepository.save(new DoctorSlot(profile, dayAfter, LocalTime.of(11, 0), LocalTime.of(11, 30)));
            doctorSlotRepository.save(new DoctorSlot(profile, dayAfter, LocalTime.of(14, 30), LocalTime.of(15, 0)));
            doctorSlotRepository.save(new DoctorSlot(profile, dayAfter, LocalTime.of(16, 0), LocalTime.of(16, 30)));

            System.out.println(">>> Seeded consultation slots for doctor profile id: " + profile.getId());
        }
    }

    private DoctorProfile createApprovedProfile(
            User user,
            String specialization,
            String qualifications,
            int experience,
            double consultationFee,
            String bio
    ) {
        DoctorProfile profile = new DoctorProfile(user, specialization, qualifications, experience, consultationFee, bio);
        // Visibility in GET /api/doctors requires APPROVED + available = TRUE
        profile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        profile.setAvailable(Boolean.TRUE);
        return profile;
    }
}
