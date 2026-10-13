package com.medicare.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(
                jwtUtils,
                "jwtSecret",
                "medicare_secret_key_for_jwt_token_must_be_at_least_256_bits_long_healthcare_system"
        );
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    void testGenerateAndValidateToken() {
        String token = jwtUtils.generateToken("priya@example.com", 1L, "PATIENT");

        assertNotNull(token);
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("priya@example.com", jwtUtils.extractEmail(token));
        assertEquals("PATIENT", jwtUtils.extractRole(token));
        assertEquals(1L, jwtUtils.extractUserId(token));
    }

    @Test
    void testInvalidOrTamperedToken() {
        assertFalse(jwtUtils.validateToken("invalid.jwt.token"));
        assertFalse(jwtUtils.validateToken(""));
        assertFalse(jwtUtils.validateToken(null));
    }
}
