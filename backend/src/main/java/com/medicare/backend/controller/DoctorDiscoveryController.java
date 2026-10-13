package com.medicare.backend.controller;

import com.medicare.backend.dto.DoctorCardResponse;
import com.medicare.backend.dto.DoctorSlotResponse;
import com.medicare.backend.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public doctor directory. Requires no login so that anyone can browse
 * approved doctors before registering or signing in.
 */
@RestController
@RequestMapping("/api/doctors")
public class DoctorDiscoveryController {

    private final DoctorService doctorService;

    public DoctorDiscoveryController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    /** GET /api/doctors?name=smith&specialization=cardio */
    @GetMapping
    public ResponseEntity<List<DoctorCardResponse>> listDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization
    ) {
        return ResponseEntity.ok(doctorService.searchDoctors(name, specialization));
    }

    @GetMapping("/specializations")
    public ResponseEntity<List<String>> listSpecializations() {
        return ResponseEntity.ok(doctorService.getSpecializations());
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorCardResponse> getDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorDetail(doctorId));
    }

    @GetMapping("/{doctorId}/slots")
    public ResponseEntity<List<DoctorSlotResponse>> getDoctorSlots(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getAvailableSlots(doctorId));
    }
}
