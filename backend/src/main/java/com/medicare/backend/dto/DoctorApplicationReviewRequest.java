package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Administrator decision on a doctor application.
 */
public class DoctorApplicationReviewRequest {

    @NotBlank(message = "Approval status is required (APPROVED or REJECTED)")
    private String approvalStatus;

    private String reviewNotes;

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }
}
