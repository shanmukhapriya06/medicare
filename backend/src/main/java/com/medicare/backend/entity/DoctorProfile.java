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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column
    private String specialization;

    @Column
    private String qualifications;

    @Column
    private Integer experience;

    @Column
    private Double consultationFee;

    @Column(length = 1000)
    private String bio;

    @Column(length = 500)
    private String clinicAddress;

    @Column(name = "availability_start")
    private String availabilityStart;

    @Column(name = "availability_end")
    private String availabilityEnd;

    // Doctors start as PENDING and only become visible after an admin approves them
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    private DoctorApprovalStatus approvalStatus = DoctorApprovalStatus.PENDING;

    // A doctor can be approved but temporarily unavailable (e.g. on leave)
    @Column(nullable = false)
    private Boolean available = Boolean.TRUE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public DoctorProfile() {
    }

    public DoctorProfile(User user) {
        this.user = user;
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.approvalStatus == null) {
            this.approvalStatus = DoctorApprovalStatus.PENDING;
        }
        if (this.available == null) {
            this.available = Boolean.TRUE;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public DoctorApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(DoctorApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public DoctorProfile(User user, String specialization, String qualifications, Integer experience, Double consultationFee, String bio) {
        this.user = user;
        this.specialization = specialization;
        this.qualifications = qualifications;
        this.experience = experience;
        this.consultationFee = consultationFee;
        this.bio = bio;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getQualifications() {
        return qualifications;
    }

    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
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

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
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
}
