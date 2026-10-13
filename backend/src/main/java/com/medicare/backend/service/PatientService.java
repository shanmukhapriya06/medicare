package com.medicare.backend.service;

import com.medicare.backend.dto.PatientProfileResponse;
import com.medicare.backend.dto.PatientProfileUpdateRequest;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class PatientService {

    private final UserRepository userRepository;

    public PatientService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PatientProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        return new PatientProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getBloodGroup()
        );
    }

    public PatientProfileResponse updateProfile(String email, PatientProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        // Update only permitted fields — never touch password, role, or email
        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setBloodGroup(request.getBloodGroup());

        User savedUser = userRepository.save(user);

        return new PatientProfileResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getPhoneNumber(),
                savedUser.getAddress(),
                savedUser.getDateOfBirth(),
                savedUser.getBloodGroup()
        );
    }
}
