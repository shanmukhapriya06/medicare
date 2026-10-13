package com.medicare.backend.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Everything the patient dashboard needs in a single response.
 */
public class PatientDashboardResponse {

    private String fullName;
    private String email;
    private String phoneNumber;
    private String bloodGroup;
    private String address;
    private long upcomingAppointmentCount;
    private long totalActiveAppointmentCount;
    private AppointmentResponse nextAppointment;
    private List<AppointmentResponse> recentAppointments = new ArrayList<>();

    public PatientDashboardResponse() {
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

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public long getUpcomingAppointmentCount() {
        return upcomingAppointmentCount;
    }

    public void setUpcomingAppointmentCount(long upcomingAppointmentCount) {
        this.upcomingAppointmentCount = upcomingAppointmentCount;
    }

    public long getTotalActiveAppointmentCount() {
        return totalActiveAppointmentCount;
    }

    public void setTotalActiveAppointmentCount(long totalActiveAppointmentCount) {
        this.totalActiveAppointmentCount = totalActiveAppointmentCount;
    }

    public AppointmentResponse getNextAppointment() {
        return nextAppointment;
    }

    public void setNextAppointment(AppointmentResponse nextAppointment) {
        this.nextAppointment = nextAppointment;
    }

    public List<AppointmentResponse> getRecentAppointments() {
        return recentAppointments;
    }

    public void setRecentAppointments(List<AppointmentResponse> recentAppointments) {
        this.recentAppointments = recentAppointments;
    }
}
