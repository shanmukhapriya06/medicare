package com.medicare.backend.dto;

/**
 * Public view of a doctor shown in the Find Doctors directory.
 * Deliberately excludes the doctor's account email and password.
 */
public class DoctorCardResponse {

    private Long id;
    private String fullName;
    private String phoneNumber;
    private String specialization;
    private String qualifications;
    private Integer experience;
    private Double consultationFee;
    private String bio;
    private String approvalStatus;
    private Boolean available;
    private String clinicAddress;

    public DoctorCardResponse() {
    }

    public DoctorCardResponse(Long id, String fullName, String phoneNumber, String specialization,
                              String qualifications, Integer experience, Double consultationFee,
                              String bio, String approvalStatus, Boolean available) {
        this.id = id;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.specialization = specialization;
        this.qualifications = qualifications;
        this.experience = experience;
        this.consultationFee = consultationFee;
        this.bio = bio;
        this.approvalStatus = approvalStatus;
        this.available = available;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public String getClinicAddress() {
        return clinicAddress;
    }

    public void setClinicAddress(String clinicAddress) {
        this.clinicAddress = clinicAddress;
    }
}
