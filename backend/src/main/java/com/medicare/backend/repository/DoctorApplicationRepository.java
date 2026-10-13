package com.medicare.backend.repository;

import com.medicare.backend.entity.DoctorApplication;
import com.medicare.backend.entity.DoctorApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorApplicationRepository extends JpaRepository<DoctorApplication, Long> {

    Optional<DoctorApplication> findTopByApplicantIdOrderBySubmittedAtDesc(Long applicantUserId);

    List<DoctorApplication> findByApplicantIdOrderBySubmittedAtDesc(Long applicantUserId);

    List<DoctorApplication> findAllByOrderBySubmittedAtDesc();

    List<DoctorApplication> findByStatusOrderBySubmittedAtDesc(DoctorApplicationStatus status);

    boolean existsByApplicantIdAndStatusIn(Long applicantUserId, List<DoctorApplicationStatus> statuses);
}
