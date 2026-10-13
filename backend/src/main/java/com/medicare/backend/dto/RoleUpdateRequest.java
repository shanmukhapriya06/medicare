package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RoleUpdateRequest {

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(PATIENT|DOCTOR|ADMIN)$", message = "Role must be PATIENT, DOCTOR, or ADMIN")
    private String role;

    public RoleUpdateRequest() {
    }

    public RoleUpdateRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
