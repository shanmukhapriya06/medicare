package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body an administrator sends to approve or reject a doctor.
 */
public class DoctorApprovalRequest {

    @NotBlank(message = "Approval status is required")
    @Pattern(regexp = "PENDING|APPROVED|REJECTED", message = "Approval status must be PENDING, APPROVED or REJECTED")
    private String approvalStatus;

    public DoctorApprovalRequest() {
    }

    public DoctorApprovalRequest(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }
}
