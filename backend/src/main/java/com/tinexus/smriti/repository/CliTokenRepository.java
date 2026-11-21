package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.CliToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CliTokenRepository extends JpaRepository<CliToken, UUID> {

    Optional<CliToken> findByTokenHash(String tokenHash);

    List<CliToken> findByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM CliToken t WHERE t.id = :id AND t.user.id = :userId")
    int deleteByIdAndUserId(UUID id, UUID userId);
}
