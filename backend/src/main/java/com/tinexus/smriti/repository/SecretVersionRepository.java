package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.SecretVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecretVersionRepository extends JpaRepository<SecretVersion, UUID> {
    List<SecretVersion> findBySecretIdOrderByCreatedAtDesc(UUID secretId);
}
