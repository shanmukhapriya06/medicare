package com.medicare.backend.repository;

import com.medicare.backend.entity.DoctorApprovalStatus;
import com.medicare.backend.entity.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {

    Optional<DoctorProfile> findByUserId(Long userId);

    Optional<DoctorProfile> findByUserEmail(String email);

    boolean existsByUserId(Long userId);

    List<DoctorProfile> findByApprovalStatusAndAvailableTrueOrderByUserFullNameAsc(DoctorApprovalStatus approvalStatus);

    /**
     * Public directory search: only APPROVED and available doctors are returned.
     * An empty search string or specialization returns every matching doctor.
     */
    @Query("""
            SELECT d FROM DoctorProfile d
            WHERE d.approvalStatus = :approvalStatus
              AND d.available = TRUE
              AND (:name = '' OR LOWER(d.user.fullName) LIKE LOWER(CONCAT('%', :name, '%')))
              AND (:specialization = '' OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%')))
            ORDER BY d.user.fullName ASC
            """)
    List<DoctorProfile> searchApprovedDoctors(
            @Param("approvalStatus") DoctorApprovalStatus approvalStatus,
            @Param("name") String name,
            @Param("specialization") String specialization
    );

    @Query("SELECT DISTINCT d.specialization FROM DoctorProfile d WHERE d.approvalStatus = :approvalStatus AND d.available = TRUE AND d.specialization IS NOT NULL ORDER BY d.specialization ASC")
    List<String> findDistinctSpecializations(@Param("approvalStatus") DoctorApprovalStatus approvalStatus);
}
