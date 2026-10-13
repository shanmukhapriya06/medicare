package com.medicare.backend.controller;

import com.medicare.backend.dto.DoctorApplicationResponse;
import com.medicare.backend.service.DoctorApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * "Apply as Doctor" endpoints available to any authenticated user.
 * A user registers and logs in normally, then submits a professional
 * application that only an administrator can approve or reject.
 */
@RestController
@RequestMapping("/api/doctor-application")
public class DoctorApplicationController {

    private final DoctorApplicationService doctorApplicationService;

    public DoctorApplicationController(DoctorApplicationService doctorApplicationService) {
        this.doctorApplicationService = doctorApplicationService;
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * POST /api/doctor-application (multipart/form-data)
     * Submits a new application together with the medical credentials document.
     */
    @PostMapping
    public ResponseEntity<DoctorApplicationResponse> submitApplication(
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("specialization") String specialization,
            @RequestParam("experience") String experience,
            @RequestParam("consultationFee") String consultationFee,
            @RequestParam("clinicAddress") String clinicAddress,
            @RequestParam("availabilityStart") String availabilityStart,
            @RequestParam("availabilityEnd") String availabilityEnd,
            @RequestParam("credentials") MultipartFile credentials
    ) {
        DoctorApplicationResponse response = doctorApplicationService.submitApplication(
                currentEmail(),
                fullName,
                email,
                phoneNumber,
                specialization,
                experience,
                consultationFee,
                clinicAddress,
                availabilityStart,
                availabilityEnd,
                credentials
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/doctor-application/my
     * Returns {"application": ...} where application is null when the user
     * has never applied before.
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyApplication() {
        Map<String, Object> body = new HashMap<>();
        doctorApplicationService.getMyApplication(currentEmail())
                .ifPresentOrElse(
                        app -> body.put("application", app),
                        () -> body.put("application", null)
                );
        return ResponseEntity.ok(body);
    }
}
