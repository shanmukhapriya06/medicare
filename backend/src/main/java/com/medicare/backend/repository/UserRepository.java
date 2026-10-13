package com.medicare.backend.repository;

import com.medicare.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find a user by their unique email
    Optional<User> findByEmail(String email);

    // Check if a user with the given email already exists
    boolean existsByEmail(String email);
}
