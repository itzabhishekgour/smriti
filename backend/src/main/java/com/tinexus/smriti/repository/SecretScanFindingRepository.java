package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.SecretScanFinding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecretScanFindingRepository extends JpaRepository<SecretScanFinding, String> {
    List<SecretScanFinding> findByProjectOrderByDetectedAtDesc(Project project);
    List<SecretScanFinding> findByProjectAndResolvedFalseOrderByDetectedAtDesc(Project project);
}
