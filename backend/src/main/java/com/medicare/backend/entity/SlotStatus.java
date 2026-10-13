package com.medicare.backend.entity;

/**
 * Availability state of a single time slot on a doctor's schedule.
 * A slot moves AVAILABLE -> BOOKED when an appointment is created and
 * back to AVAILABLE when that appointment is cancelled.
 */
public enum SlotStatus {
    AVAILABLE,
    BOOKED
}
