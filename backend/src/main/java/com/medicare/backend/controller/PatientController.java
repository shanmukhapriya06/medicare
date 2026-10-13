package com.medicare.backend.controller;

import com.medicare.backend.dto.AppointmentCreateRequest;
import com.medicare.backend.dto.AppointmentResponse;
import com.medicare.backend.dto.PatientProfileResponse;
import com.medicare.backend.dto.PatientProfileUpdateRequest;
import com.medicare.backend.service.AppointmentService;
import com.medicare.backend.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;

    public PatientController(PatientService patientService, AppointmentService appointmentService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/profile")
    public ResponseEntity<PatientProfileResponse> getPatientProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(patientService.getProfile(email));
    }

    @PutMapping("/profile")
    public ResponseEntity<PatientProfileResponse> updatePatientProfile(@Valid @RequestBody PatientProfileUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(patientService.updateProfile(email, request));
    }

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentCreateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.bookAppointment(email, request));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false, defaultValue = "all") String filter
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<AppointmentResponse> list = appointmentService.getPatientAppointments(authentication.getName());
        java.time.LocalDate today = java.time.LocalDate.now();
        if ("upcoming".equalsIgnoreCase(filter)) {
            list = list.stream()
                    .filter(a -> !a.getAppointmentDate().isBefore(today)
                            && ("PENDING".equalsIgnoreCase(a.getStatus()) || "APPROVED".equalsIgnoreCase(a.getStatus())))
                    .toList();
        } else if ("past".equalsIgnoreCase(filter)) {
            list = list.stream()
                    .filter(a -> a.getAppointmentDate().isBefore(today)
                            || "COMPLETED".equalsIgnoreCase(a.getStatus())
                            || "CANCELLED".equalsIgnoreCase(a.getStatus())
                            || "REJECTED".equalsIgnoreCase(a.getStatus()))
                    .toList();
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(appointmentService.cancelAppointment(email, id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getPatientDashboard() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null ? authentication.getName() : "Unknown";

        List<AppointmentResponse> appointments = appointmentService.getPatientAppointments(email);
        long upcomingCount = appointments.stream()
                .filter(a -> "PENDING".equalsIgnoreCase(a.getStatus()) || "APPROVED".equalsIgnoreCase(a.getStatus()))
                .count();

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Welcome to your MediCare Patient Portal");
        data.put("email", email);
        data.put("status", "ACTIVE");
        data.put("appointmentsCount", appointments.size());
        data.put("upcomingAppointmentsCount", upcomingCount);
        data.put("medicalRecordsCount", 0);

        return ResponseEntity.ok(data);
    }
}
