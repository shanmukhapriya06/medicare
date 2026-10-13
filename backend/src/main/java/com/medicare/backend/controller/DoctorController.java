package com.medicare.backend.controller;

import com.medicare.backend.dto.AppointmentResponse;
import com.medicare.backend.dto.DoctorProfileResponse;
import com.medicare.backend.dto.DoctorProfileUpdateRequest;
import com.medicare.backend.dto.DoctorSlotCreateRequest;
import com.medicare.backend.dto.DoctorSlotResponse;
import com.medicare.backend.service.AppointmentService;
import com.medicare.backend.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;

    public DoctorController(DoctorService doctorService, AppointmentService appointmentService) {
        this.doctorService = doctorService;
        this.appointmentService = appointmentService;
    }

    private String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    @GetMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> getDoctorProfile() {
        return ResponseEntity.ok(doctorService.getProfileByEmail(currentEmail()));
    }

    @PutMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> updateDoctorProfile(@Valid @RequestBody DoctorProfileUpdateRequest request) {
        return ResponseEntity.ok(doctorService.updateProfile(currentEmail(), request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DoctorProfileResponse>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // ============================================================
    // Slot management for the logged-in doctor
    // ============================================================

    @GetMapping("/slots")
    public ResponseEntity<List<DoctorSlotResponse>> getMySlots() {
        return ResponseEntity.ok(doctorService.getMySlots(currentEmail()));
    }

    @PostMapping("/slots")
    public ResponseEntity<DoctorSlotResponse> createSlot(@Valid @RequestBody DoctorSlotCreateRequest request) {
        return ResponseEntity.ok(doctorService.createSlot(currentEmail(), request));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long slotId) {
        doctorService.deleteSlot(currentEmail(), slotId);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // Appointment management & Dashboard for the logged-in doctor
    // ============================================================

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments() {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(currentEmail()));
    }

    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(currentEmail(), id, status.trim()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDoctorDashboard() {
        return ResponseEntity.ok(appointmentService.getDoctorDashboard(currentEmail()));
    }
}
