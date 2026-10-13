package com.medicare.backend.service;

import com.medicare.backend.dto.LoginRequest;
import com.medicare.backend.dto.LoginResponse;
import com.medicare.backend.dto.RegisterRequest;
import com.medicare.backend.dto.RegisterResponse;
import com.medicare.backend.entity.DoctorProfile;
import com.medicare.backend.entity.User;
import com.medicare.backend.exception.EmailAlreadyExistsException;
import com.medicare.backend.exception.InvalidCredentialsException;
import com.medicare.backend.repository.DoctorProfileRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Autowired
    public UserService(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils
    ) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils
    ) {
        this(userRepository, null, passwordEncoder, jwtUtils);
    }

    public RegisterResponse registerUser(RegisterRequest request) {
        // Defensive validation of required fields
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        // Validate and determine role
        String assignedRole = "PATIENT";
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String requestedRole = request.getRole().trim().toUpperCase();
            if ("ADMIN".equals(requestedRole)) {
                throw new IllegalArgumentException("Cannot self-register as ADMIN. Administrator privileges must be granted by an existing administrator.");
            }
            if (!"PATIENT".equals(requestedRole) && !"DOCTOR".equals(requestedRole)) {
                throw new IllegalArgumentException("Invalid role: " + requestedRole + ". Registration only allows PATIENT or DOCTOR.");
            }
            assignedRole = requestedRole;
        }

        // Normalize email to lowercase
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Check for duplicate email
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email is already registered: " + normalizedEmail);
        }

        // Securely hash the password using BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getFullName().trim(),
                normalizedEmail,
                hashedPassword,
                assignedRole
        );

        User savedUser = userRepository.save(user);

        // If registered as DOCTOR, initialize associated doctor profile
        if ("DOCTOR".equals(assignedRole)) {
            DoctorProfile doctorProfile = new DoctorProfile(savedUser);
            doctorProfile.setSpecialization("General Practitioner");
            doctorProfile.setQualifications("");
            doctorProfile.setExperience(0);
            doctorProfile.setConsultationFee(0.0);
            doctorProfile.setBio("");
            doctorProfileRepository.save(doctorProfile);
        }

        // Return response without the password or password hash
        return new RegisterResponse(
                "User registered successfully",
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    public LoginResponse loginUser(LoginRequest request) {
        // Defensive validation
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);

        // Check if user exists and password matches the stored BCrypt hash
        if (userOptional.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOptional.get().getPassword())) {
            // Generic error message without revealing whether email or password was wrong
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userOptional.get();

        // Generate signed JWT token containing email, id, and role
        String token = jwtUtils.generateToken(user.getEmail(), user.getId(), user.getRole());

        // Return safe user details and JWT token (never password or hash)
        return new LoginResponse(
                "Login successful",
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
