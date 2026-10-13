package com.medicare.backend.repository;

import com.medicare.backend.entity.DoctorSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorSlotRepository extends JpaRepository<DoctorSlot, Long> {

    List<DoctorSlot> findByDoctorProfileIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            Long doctorProfileId, LocalDate fromDate);

    List<DoctorSlot> findByDoctorProfileIdAndSlotDateOrderByStartTimeAsc(
            Long doctorProfileId, LocalDate slotDate);

    List<DoctorSlot> findByDoctorProfileIdOrderBySlotDateAscStartTimeAsc(Long doctorProfileId);

    boolean existsByDoctorProfileIdAndSlotDateAndStartTime(Long doctorProfileId, LocalDate slotDate, java.time.LocalTime startTime);

    /**
     * Loads a slot while taking a database row lock (SELECT ... FOR UPDATE).
     * Two patients booking the same slot at the same time are forced to wait
     * here, so only one of them can flip the slot to BOOKED.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DoctorSlot s WHERE s.id = :id")
    Optional<DoctorSlot> findByIdForUpdate(@Param("id") Long id);
}
