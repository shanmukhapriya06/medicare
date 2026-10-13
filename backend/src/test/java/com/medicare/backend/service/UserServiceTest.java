package com.medicare.backend.service;

import com.medicare.backend.dto.LoginRequest;
import com.medicare.backend.dto.LoginResponse;
import com.medicare.backend.dto.RegisterRequest;
import com.medicare.backend.dto.RegisterResponse;
import com.medicare.backend.entity.User;
import com.medicare.backend.exception.EmailAlreadyExistsException;
import com.medicare.backend.exception.InvalidCredentialsException;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtils jwtUtils;

    private UserService userService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, jwtUtils);
    }

    @Test
    void testRegisterUserSuccess() {
        RegisterRequest request = new RegisterRequest("Priya Sharma", "priya@example.com", "plainPassword123");

        when(userRepository.existsByEmail("priya@example.com")).thenReturn(false);

        User savedUser = new User("Priya Sharma", "priya@example.com", "hashed_pwd", "PATIENT");
        savedUser.setId(10L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        RegisterResponse response = userService.registerUser(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Priya Sharma", response.getFullName());
        assertEquals("priya@example.com", response.getEmail());
        assertEquals("PATIENT", response.getRole());
        assertEquals("User registered successfully", response.getMessage());

        // Verify password was hashed before saving and role is PATIENT
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();

        assertEquals("PATIENT", capturedUser.getRole());
        assertNotEquals("plainPassword123", capturedUser.getPassword());
        assertTrue(passwordEncoder.matches("plainPassword123", capturedUser.getPassword()));
    }

    @Test
    void testRegisterUserDuplicateEmailThrowsException() {
        RegisterRequest request = new RegisterRequest("Priya Sharma", "existing@example.com", "password123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> userService.registerUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegisterUserMissingFields() {
        RegisterRequest emptyName = new RegisterRequest("", "test@example.com", "password123");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(emptyName));

        RegisterRequest emptyEmail = new RegisterRequest("Name", "", "password123");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(emptyEmail));

        RegisterRequest shortPassword = new RegisterRequest("Name", "test@example.com", "123");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(shortPassword));
    }

    @Test
    void testLoginUserSuccess() {
        String rawPassword = "correctPassword123";
        String hashedPassword = passwordEncoder.encode(rawPassword);

        User storedUser = new User("Priya Sharma", "priya@example.com", hashedPassword, "PATIENT");
        storedUser.setId(5L);

        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(storedUser));
        when(jwtUtils.generateToken("priya@example.com", 5L, "PATIENT")).thenReturn("mocked.jwt.token");

        LoginRequest request = new LoginRequest("priya@example.com", rawPassword);
        LoginResponse response = userService.loginUser(request);

        assertNotNull(response);
        assertEquals(5L, response.getId());
        assertEquals("Priya Sharma", response.getFullName());
        assertEquals("priya@example.com", response.getEmail());
        assertEquals("PATIENT", response.getRole());
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("Login successful", response.getMessage());
    }

    @Test
    void testLoginUserWrongPasswordThrowsException() {
        String hashedPassword = passwordEncoder.encode("realPassword123");
        User storedUser = new User("Priya Sharma", "priya@example.com", hashedPassword, "PATIENT");

        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(storedUser));

        LoginRequest request = new LoginRequest("priya@example.com", "wrongPassword");

        InvalidCredentialsException ex = assertThrows(
                InvalidCredentialsException.class,
                () -> userService.loginUser(request)
        );
        assertEquals("Invalid email or password", ex.getMessage());
        verify(jwtUtils, never()).generateToken(any(), any(), any());
    }

    @Test
    void testLoginUserNotFoundThrowsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("unknown@example.com", "anyPassword");

        InvalidCredentialsException ex = assertThrows(
                InvalidCredentialsException.class,
                () -> userService.loginUser(request)
        );
        assertEquals("Invalid email or password", ex.getMessage());
        verify(jwtUtils, never()).generateToken(any(), any(), any());
    }

    @Test
    void testLoginUserEmptyFieldsThrowsException() {
        LoginRequest emptyEmail = new LoginRequest("", "password");
        assertThrows(InvalidCredentialsException.class, () -> userService.loginUser(emptyEmail));

        LoginRequest emptyPassword = new LoginRequest("test@example.com", "");
        assertThrows(InvalidCredentialsException.class, () -> userService.loginUser(emptyPassword));
    }
}
