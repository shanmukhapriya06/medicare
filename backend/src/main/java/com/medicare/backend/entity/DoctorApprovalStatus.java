package com.medicare.backend.entity;

/**
 * Approval workflow for a doctor profile. Only APPROVED doctors are
 * shown in the public doctor directory.
 */
public enum DoctorApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
