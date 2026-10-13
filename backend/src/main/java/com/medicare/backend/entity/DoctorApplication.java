package com.medicare.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A submitted "Apply as Doctor" request from a registered platform user.
 * The uploaded medical credentials document is stored with the record so an
 * administrator can review it before approving or rejecting the application.
 */
@Entity
@Table(name = "doctor_applications")
public class DoctorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "applicant_user_id", nullable = false)
    private User applicant;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column
    private String specialization;

    @Column
    private Integer experience;

    @Column(name = "consultation_fee")
    private Double consultationFee;

    @Column(name = "clinic_address", length = 500)
    private String clinicAddress;

    @Column(name = "availability_start")
    private String availabilityStart;

    @Column(name = "availability_end")
    private String availabilityEnd;

    @Column(name = "credentials_file_name")
    private String credentialsFileName;

    @Column(name = "credentials_content_type")
    private String credentialsContentType;

    @Column(name = "credentials_file_size")
    private Long credentialsFileSize;

    @Lob
    @Column(name = "credentials_data")
    private byte[] credentialsData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DoctorApplicationStatus status = DoctorApplicationStatus.PENDING;

    @Column(name = "review_notes", length = 1000)
    private String reviewNotes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @PrePersist
    void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = DoctorApplicationStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        // submittedAt is intentionally left untouched on updates
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getApplicant() {
        return applicant;
    }

    public void setApplicant(User applicant) {
        this.applicant = applicant;
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

    public byte[] getCredentialsData() {
        return credentialsData;
    }

    public void setCredentialsData(byte[] credentialsData) {
        this.credentialsData = credentialsData;
    }

    public DoctorApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(DoctorApplicationStatus status) {
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

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
}
