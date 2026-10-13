package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body a doctor uses to open one new appointment slot.
 */
public class DoctorSlotCreateRequest {

    @NotBlank(message = "Slot date is required (yyyy-MM-dd)")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Slot date must be in yyyy-MM-dd format")
    private String slotDate;

    @NotBlank(message = "Start time is required (HH:mm)")
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "Start time must be in HH:mm format")
    private String startTime;

    @NotBlank(message = "End time is required (HH:mm)")
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "End time must be in HH:mm format")
    private String endTime;

    public DoctorSlotCreateRequest() {
    }

    public DoctorSlotCreateRequest(String slotDate, String startTime, String endTime) {
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(String slotDate) {
        this.slotDate = slotDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
}
