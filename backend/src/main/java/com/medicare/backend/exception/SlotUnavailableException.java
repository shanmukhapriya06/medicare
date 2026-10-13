package com.medicare.backend.exception;

/**
 * Thrown when a time slot is no longer free (already booked) or the booking
 * rules are broken. Mapped to HTTP 409 Conflict.
 */
public class SlotUnavailableException extends RuntimeException {

    public SlotUnavailableException(String message) {
        super(message);
    }
}
