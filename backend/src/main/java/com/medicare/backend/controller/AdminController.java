package com.medicare.backend.controller;

import com.medicare.backend.dto.AdminProfileResponse;
import com.medicare.backend.dto.AdminProfileUpdateRequest;
import com.medicare.backend.dto.DoctorAnalyticsResponse;
import com.medicare.backend.dto.DoctorApplicationResponse;
import com.medicare.backend.dto.DoctorApplicationReviewRequest;
import com.medicare.backend.dto.DoctorApprovalRequest;
import com.medicare.backend.dto.DoctorCardResponse;
import com.medicare.backend.dto.RoleUpdateRequest;
import com.medicare.backend.dto.UserSummaryResponse;
import com.medicare.backend.entity.DoctorApplication;
import com.medicare.backend.service.AdminService;
import com.medicare.backend.service.DoctorApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final DoctorApplicationService doctorApplicationService;

    public AdminController(AdminService adminService, DoctorApplicationService doctorApplicationService) {
        this.adminService = adminService;
        this.doctorApplicationService = doctorApplicationService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserSummaryResponse> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUserRole(userId, request.getRole()));
    }

    /** Lists every doctor profile so pending doctors can be reviewed. */
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorCardResponse>> getAllDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    /** PUT /api/admin/doctors/{doctorId}/approval with body {"approvalStatus":"APPROVED"} */
    @PutMapping("/doctors/{doctorId}/approval")
    public ResponseEntity<DoctorCardResponse> updateDoctorApproval(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorApprovalRequest request
    ) {
        return ResponseEntity.ok(adminService.updateDoctorApproval(doctorId, request.getApprovalStatus()));
    }

    /** GET /api/admin/analytics/doctors returns treatment and consultation metrics per doctor. */
    @GetMapping("/analytics/doctors")
    public ResponseEntity<List<DoctorAnalyticsResponse>> getDoctorAnalytics() {
        return ResponseEntity.ok(adminService.getDoctorAnalytics());
    }

    /** GET /api/admin/profile retrieves current authenticated administrator's profile. */
    @GetMapping("/profile")
    public ResponseEntity<AdminProfileResponse> getAdminProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminService.getAdminProfile(email));
    }

    /** PUT /api/admin/profile updates administrator details (full name, phone, address). */
    @PutMapping("/profile")
    public ResponseEntity<AdminProfileResponse> updateAdminProfile(
            @Valid @RequestBody AdminProfileUpdateRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminService.updateAdminProfile(email, request));
    }

    // ============================================================
    // "Apply as Doctor" application review (ADMIN only)
    // ============================================================

    /** GET /api/admin/doctor-applications lists every submitted application. */
    @GetMapping("/doctor-applications")
    public ResponseEntity<List<DoctorApplicationResponse>> getDoctorApplications() {
        return ResponseEntity.ok(doctorApplicationService.getAllApplications());
    }

    /** GET /api/admin/doctor-applications?status=PENDING filters by review status. */
    @GetMapping(path = "/doctor-applications", params = "status")
    public ResponseEntity<List<DoctorApplicationResponse>> getDoctorApplicationsByStatus(
            @RequestParam String status
    ) {
        return ResponseEntity.ok(doctorApplicationService.getApplicationsByStatus(status));
    }

    /** PUT /api/admin/doctor-applications/{id}/approval with {"approvalStatus":"APPROVED"}. */
    @PutMapping("/doctor-applications/{applicationId}/approval")
    public ResponseEntity<DoctorApplicationResponse> reviewDoctorApplication(
            @PathVariable Long applicationId,
            @Valid @RequestBody DoctorApplicationReviewRequest request
    ) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(doctorApplicationService.reviewApplication(
                applicationId,
                request.getApprovalStatus(),
                request.getReviewNotes(),
                adminEmail
        ));
    }

    /** GET /api/admin/doctor-applications/{id}/credentials downloads the uploaded document. */
    @GetMapping("/doctor-applications/{applicationId}/credentials")
    public ResponseEntity<byte[]> downloadApplicationCredentials(@PathVariable Long applicationId) {
        DoctorApplication application = doctorApplicationService.getApplicationEntity(applicationId);
        byte[] data = application.getCredentialsData();
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = application.getCredentialsContentType() != null
                ? application.getCredentialsContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        String safeName = application.getCredentialsFileName() != null
                ? application.getCredentialsFileName().replaceAll("[\\r\\n\"]", "_")
                : "credentials-" + applicationId;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeName + "\"")
                .contentLength(data.length)
                .body(data);
    }
}
