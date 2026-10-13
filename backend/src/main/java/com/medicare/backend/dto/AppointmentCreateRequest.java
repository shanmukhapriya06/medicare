package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body a patient sends to book one doctor slot.
 * The patient's own identity always comes from the JWT token, never from here.
 */
public class AppointmentCreateRequest {

    @NotNull(message = "Slot id is required")
    private Long slotId;

    @NotBlank(message = "Reason for visit is required")
    @Size(max = 500, message = "Reason for visit must be at most 500 characters")
    private String reason;

    public AppointmentCreateRequest() {
    }

    public AppointmentCreateRequest(Long slotId, String reason) {
        this.slotId = slotId;
        this.reason = reason;
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
