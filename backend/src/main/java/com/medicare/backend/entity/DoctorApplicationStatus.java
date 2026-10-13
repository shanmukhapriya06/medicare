package com.medicare.backend.entity;

/**
 * Lifecycle of a "Apply as Doctor" submission. Applications start as PENDING
 * and only an administrator can move them to APPROVED or REJECTED.
 */
public enum DoctorApplicationStatus {
    PENDING,
    APPROVED,
    REJECTED
}
