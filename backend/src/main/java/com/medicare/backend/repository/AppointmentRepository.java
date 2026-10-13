package com.medicare.backend.repository;

import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAscAppointmentTimeAsc(
            Long patientId, LocalDate fromDate);

    List<Appointment> findByPatientIdAndAppointmentDateLessThanOrderByAppointmentDateDescAppointmentTimeDesc(
            Long patientId, LocalDate fromDate);

    List<Appointment> findByPatientIdAndStatusInOrderByAppointmentDateDescAppointmentTimeDesc(
            Long patientId, Collection<AppointmentStatus> statuses);

    Optional<Appointment> findByIdAndPatientId(Long id, Long patientId);

    boolean existsBySlotIdAndStatusIn(Long slotId, Collection<AppointmentStatus> statuses);

    long countByPatientIdAndAppointmentDateGreaterThanEqualAndStatusIn(
            Long patientId, LocalDate fromDate, Collection<AppointmentStatus> statuses);

    List<Appointment> findTop5ByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(Long patientId);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(Long patientId);

    List<Appointment> findByDoctorProfileIdOrderByAppointmentDateDescAppointmentTimeDesc(Long doctorProfileId);

    long countByPatientId(Long patientId);

    long countByDoctorProfileId(Long doctorProfileId);
}
