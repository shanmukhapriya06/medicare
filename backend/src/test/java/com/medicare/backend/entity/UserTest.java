package com.medicare.backend.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void testUserCreationAndGetters() {
        User user = new User("John Doe", "john@example.com", "secret123", "PATIENT");

        assertEquals("John Doe", user.getFullName());
        assertEquals("john@example.com", user.getEmail());
        assertEquals("secret123", user.getPassword());
        assertEquals("PATIENT", user.getRole());
    }

    @Test
    void testToStringDoesNotExposePassword() {
        User user = new User("Jane Doe", "jane@example.com", "sensitivePass!@#", "DOCTOR");
        String userString = user.toString();

        assertFalse(userString.contains("sensitivePass!@#"), "Password must not be exposed in toString()");
        assertTrue(userString.contains("jane@example.com"));
        assertTrue(userString.contains("Jane Doe"));
        assertTrue(userString.contains("DOCTOR"));
    }
}
