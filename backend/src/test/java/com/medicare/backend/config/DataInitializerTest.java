package com.medicare.backend.config;

import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    private static final String RAJESH = "dr.rajesh.kumar@medicare.com";
    private static final String PRIYA = "dr.priya.sharma@medicare.com";
    private static final String ARJUN = "dr.arjun.reddy@medicare.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private DoctorProfileRepository doctorProfileRepository;

    @Mock
    private com.medicare.backend.repository.DoctorSlotRepository doctorSlotRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer(userRepository, doctorProfileRepository, doctorSlotRepository, passwordEncoder, true);
    }

    private static User doctorUser(String email, Long id) {
        User user = new User("Demo Doctor", email, "hashed", "DOCTOR");
        user.setId(id);
        return user;
    }

    @Test
    void testSeedsThreeApprovedAvailableDemoDoctorsWhenAbsent() {
        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId((long) (user.getEmail().hashCode() % 1000));
            return user;
        });
        when(doctorProfileRepository.save(any(DoctorProfile.class))).thenAnswer(inv -> {
            DoctorProfile profile = inv.getArgument(0);
            profile.setId(profile.getUser().getId());
            return profile;
        });

        dataInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(3)).save(userCaptor.capture());
        List<User> savedUsers = userCaptor.getAllValues();
        for (User savedUser : savedUsers) {
            assertEquals("DOCTOR", savedUser.getRole());
            assertNotEquals(DataInitializer.DEMO_DOCTOR_PASSWORD, savedUser.getPassword());
            assertTrue(passwordEncoder.matches(DataInitializer.DEMO_DOCTOR_PASSWORD, savedUser.getPassword()));
            assertNotNull(savedUser.getPhoneNumber());
        }
        List<String> emails = savedUsers.stream().map(User::getEmail).sorted().toList();
        assertEquals(List.of(ARJUN, PRIYA, RAJESH), emails);

        ArgumentCaptor<DoctorProfile> profileCaptor = ArgumentCaptor.forClass(DoctorProfile.class);
        verify(doctorProfileRepository, times(3)).save(profileCaptor.capture());
        List<DoctorProfile> savedProfiles = profileCaptor.getAllValues();
        for (DoctorProfile profile : savedProfiles) {
            assertEquals(DoctorApprovalStatus.APPROVED, profile.getApprovalStatus());
            assertEquals(Boolean.TRUE, profile.getAvailable());
            assertNotNull(profile.getSpecialization());
            assertFalse(profile.getSpecialization().isBlank());
        }
        List<String> specializations = savedProfiles.stream().map(DoctorProfile::getSpecialization).sorted().toList();
        assertEquals(List.of("Cardiology", "Dermatology", "General Medicine"), specializations);
    }

    @Test
    void testForceApprovesAndReactivatesExistingDemoDoctorProfile() {
        User priya = doctorUser(PRIYA, 1L);
        User rajesh = doctorUser(RAJESH, 2L);
        User arjun = doctorUser(ARJUN, 3L);

        DoctorProfile pendingPriya = new DoctorProfile(priya, "Dermatology", "MBBS", 7, 650.0, "bio");
        pendingPriya.setId(11L);
        pendingPriya.setApprovalStatus(DoctorApprovalStatus.PENDING);
        pendingPriya.setAvailable(Boolean.FALSE);

        DoctorProfile activeRajesh = new DoctorProfile(rajesh, "Cardiology", "MBBS", 10, 800.0, "bio");
        activeRajesh.setId(12L);
        activeRajesh.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        activeRajesh.setAvailable(Boolean.TRUE);

        DoctorProfile activeArjun = new DoctorProfile(arjun, "General Medicine", "MBBS", 8, 500.0, "bio");
        activeArjun.setId(13L);
        activeArjun.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        activeArjun.setAvailable(Boolean.TRUE);

        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);
        when(userRepository.findByEmail(PRIYA)).thenReturn(Optional.of(priya));
        when(userRepository.findByEmail(RAJESH)).thenReturn(Optional.of(rajesh));
        when(userRepository.findByEmail(ARJUN)).thenReturn(Optional.of(arjun));
        when(doctorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(pendingPriya));
        when(doctorProfileRepository.findByUserId(2L)).thenReturn(Optional.of(activeRajesh));
        when(doctorProfileRepository.findByUserId(3L)).thenReturn(Optional.of(activeArjun));
        when(doctorProfileRepository.save(any(DoctorProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        dataInitializer.run();

        // The inactive demo doctor is re-approved; active ones are left alone
        verify(doctorProfileRepository, times(1)).save(any(DoctorProfile.class));
        assertEquals(DoctorApprovalStatus.APPROVED, pendingPriya.getApprovalStatus());
        assertEquals(Boolean.TRUE, pendingPriya.getAvailable());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testSkipsDemoDoctorsAlreadyApprovedAndAvailable() {
        User priya = doctorUser(PRIYA, 1L);
        User rajesh = doctorUser(RAJESH, 2L);
        User arjun = doctorUser(ARJUN, 3L);

        DoctorProfile priyaProfile = new DoctorProfile(priya, "Dermatology", "MBBS", 7, 650.0, "bio");
        priyaProfile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        priyaProfile.setAvailable(Boolean.TRUE);
        DoctorProfile rajeshProfile = new DoctorProfile(rajesh, "Cardiology", "MBBS", 10, 800.0, "bio");
        rajeshProfile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        rajeshProfile.setAvailable(Boolean.TRUE);
        DoctorProfile arjunProfile = new DoctorProfile(arjun, "General Medicine", "MBBS", 8, 500.0, "bio");
        arjunProfile.setApprovalStatus(DoctorApprovalStatus.APPROVED);
        arjunProfile.setAvailable(Boolean.TRUE);

        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);
        when(userRepository.findByEmail(PRIYA)).thenReturn(Optional.of(priya));
        when(userRepository.findByEmail(RAJESH)).thenReturn(Optional.of(rajesh));
        when(userRepository.findByEmail(ARJUN)).thenReturn(Optional.of(arjun));
        when(doctorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(priyaProfile));
        when(doctorProfileRepository.findByUserId(2L)).thenReturn(Optional.of(rajeshProfile));
        when(doctorProfileRepository.findByUserId(3L)).thenReturn(Optional.of(arjunProfile));

        dataInitializer.run();

        verify(userRepository, never()).save(any(User.class));
        verify(doctorProfileRepository, never()).save(any(DoctorProfile.class));
    }

    @Test
    void testCompletesMissingProfileForExistingDemoDoctorUser() {
        User priya = doctorUser(PRIYA, 1L);
        User rajesh = doctorUser(RAJESH, 2L);
        User arjun = doctorUser(ARJUN, 3L);

        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);
        when(userRepository.findByEmail(PRIYA)).thenReturn(Optional.of(priya));
        when(userRepository.findByEmail(RAJESH)).thenReturn(Optional.of(rajesh));
        when(userRepository.findByEmail(ARJUN)).thenReturn(Optional.of(arjun));
        when(doctorProfileRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(doctorProfileRepository.save(any(DoctorProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        dataInitializer.run();

        verify(userRepository, never()).save(any(User.class));
        ArgumentCaptor<DoctorProfile> profileCaptor = ArgumentCaptor.forClass(DoctorProfile.class);
        verify(doctorProfileRepository, times(3)).save(profileCaptor.capture());
        for (DoctorProfile profile : profileCaptor.getAllValues()) {
            assertEquals(DoctorApprovalStatus.APPROVED, profile.getApprovalStatus());
            assertEquals(Boolean.TRUE, profile.getAvailable());
        }
    }

    @Test
    void testNeverTouchesAccountsWhenDemoEmailHeldByNonDoctor() {
        User patientA = new User("Someone", PRIYA, "hashed", "PATIENT");
        patientA.setId(1L);
        User patientB = new User("Someone", RAJESH, "hashed", "PATIENT");
        patientB.setId(2L);
        User patientC = new User("Someone", ARJUN, "hashed", "PATIENT");
        patientC.setId(3L);

        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);
        when(userRepository.findByEmail(PRIYA)).thenReturn(Optional.of(patientA));
        when(userRepository.findByEmail(RAJESH)).thenReturn(Optional.of(patientB));
        when(userRepository.findByEmail(ARJUN)).thenReturn(Optional.of(patientC));

        dataInitializer.run();

        verify(userRepository, never()).save(any(User.class));
        verify(doctorProfileRepository, never()).save(any(DoctorProfile.class));
    }

    @Test
    void testDemoDoctorSeedingCanBeDisabled() {
        DataInitializer disabled = new DataInitializer(userRepository, doctorProfileRepository, doctorSlotRepository, passwordEncoder, false);

        when(userRepository.existsByEmail("admin@medicare.com")).thenReturn(true);

        disabled.run();

        verify(userRepository, never()).findByEmail(any());
        verify(userRepository, never()).save(any(User.class));
        verify(doctorProfileRepository, never()).save(any(DoctorProfile.class));
    }
}
