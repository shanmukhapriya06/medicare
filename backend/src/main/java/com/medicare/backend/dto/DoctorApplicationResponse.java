package com.medicare.backend.dto;

import com.medicare.backend.entity.DoctorApplication;
import com.medicare.backend.entity.DoctorApplicationStatus;

import java.time.LocalDateTime;

/**
 * Safe view of a doctor application (never exposes the uploaded document bytes).
 */
public class DoctorApplicationResponse {

    private Long id;
    private Long applicantUserId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String specialization;
    private Integer experience;
    private Double consultationFee;
    private String clinicAddress;
    private String availabilityStart;
    private String availabilityEnd;
    private String credentialsFileName;
    private String credentialsContentType;
    private Long credentialsFileSize;
    private String status;
    private String reviewNotes;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    public DoctorApplicationResponse() {
    }

    public static DoctorApplicationResponse from(DoctorApplication app) {
        DoctorApplicationResponse res = new DoctorApplicationResponse();
        res.setId(app.getId());
        if (app.getApplicant() != null) {
            res.setApplicantUserId(app.getApplicant().getId());
        }
        res.setFullName(app.getFullName());
        res.setEmail(app.getEmail());
        res.setPhoneNumber(app.getPhoneNumber());
        res.setSpecialization(app.getSpecialization());
        res.setExperience(app.getExperience());
        res.setConsultationFee(app.getConsultationFee());
        res.setClinicAddress(app.getClinicAddress());
        res.setAvailabilityStart(app.getAvailabilityStart());
        res.setAvailabilityEnd(app.getAvailabilityEnd());
        res.setCredentialsFileName(app.getCredentialsFileName());
        res.setCredentialsContentType(app.getCredentialsContentType());
        res.setCredentialsFileSize(app.getCredentialsFileSize());
        res.setStatus(app.getStatus() != null ? app.getStatus().name() : DoctorApplicationStatus.PENDING.name());
        res.setReviewNotes(app.getReviewNotes());
        res.setSubmittedAt(app.getSubmittedAt());
        res.setReviewedAt(app.getReviewedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApplicantUserId() {
        return applicantUserId;
    }

    public void setApplicantUserId(Long applicantUserId) {
        this.applicantUserId = applicantUserId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Integer getExperience() {
        return experience;
    }

    public void setExperience(Integer experience) {
        this.experience = experience;
    }

    public Double getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(Double consultationFee) {
        this.consultationFee = consultationFee;
    }

    public String getClinicAddress() {
        return clinicAddress;
    }

    public void setClinicAddress(String clinicAddress) {
        this.clinicAddress = clinicAddress;
    }

    public String getAvailabilityStart() {
        return availabilityStart;
    }

    public void setAvailabilityStart(String availabilityStart) {
        this.availabilityStart = availabilityStart;
    }

    public String getAvailabilityEnd() {
        return availabilityEnd;
    }

    public void setAvailabilityEnd(String availabilityEnd) {
        this.availabilityEnd = availabilityEnd;
    }

    public String getCredentialsFileName() {
        return credentialsFileName;
    }

    public void setCredentialsFileName(String credentialsFileName) {
        this.credentialsFileName = credentialsFileName;
    }

    public String getCredentialsContentType() {
        return credentialsContentType;
    }

    public void setCredentialsContentType(String credentialsContentType) {
        this.credentialsContentType = credentialsContentType;
    }

    public Long getCredentialsFileSize() {
        return credentialsFileSize;
    }

    public void setCredentialsFileSize(Long credentialsFileSize) {
        this.credentialsFileSize = credentialsFileSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
