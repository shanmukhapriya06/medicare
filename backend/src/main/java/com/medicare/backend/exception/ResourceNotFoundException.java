package com.medicare.backend.exception;

/**
 * Thrown when a requested doctor, slot or appointment does not exist.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
