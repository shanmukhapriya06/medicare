package com.medicare.backend.entity;

/**
 * Lifecycle of an appointment as it moves through the clinic workflow.
 * A newly booked appointment always starts as PENDING and is never
 * auto-approved.
 */
public enum AppointmentStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED,
    COMPLETED
}
