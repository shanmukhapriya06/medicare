package com.medicare.backend.dto;

public class DoctorAnalyticsResponse {

    private Long doctorId;
    private String doctorName;
    private String specialization;
    private Double consultationFee;
    private long patientsTreatedToday;
    private long todayScheduled;
    private long totalCompleted;
    private long totalConsultations;

    public DoctorAnalyticsResponse() {
    }

    public DoctorAnalyticsResponse(
            Long doctorId,
            String doctorName,
            String specialization,
            Double consultationFee,
            long patientsTreatedToday,
            long todayScheduled,
            long totalCompleted,
            long totalConsultations
    ) {
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.specialization = specialization;
        this.consultationFee = consultationFee;
        this.patientsTreatedToday = patientsTreatedToday;
        this.todayScheduled = todayScheduled;
        this.totalCompleted = totalCompleted;
        this.totalConsultations = totalConsultations;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Double getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(Double consultationFee) {
        this.consultationFee = consultationFee;
    }

    public long getPatientsTreatedToday() {
        return patientsTreatedToday;
    }

    public void setPatientsTreatedToday(long patientsTreatedToday) {
        this.patientsTreatedToday = patientsTreatedToday;
    }

    public long getTodayScheduled() {
        return todayScheduled;
    }

    public void setTodayScheduled(long todayScheduled) {
        this.todayScheduled = todayScheduled;
    }

    public long getTotalCompleted() {
        return totalCompleted;
    }

    public void setTotalCompleted(long totalCompleted) {
        this.totalCompleted = totalCompleted;
    }

    public long getTotalConsultations() {
        return totalConsultations;
    }

    public void setTotalConsultations(long totalConsultations) {
        this.totalConsultations = totalConsultations;
    }
}
