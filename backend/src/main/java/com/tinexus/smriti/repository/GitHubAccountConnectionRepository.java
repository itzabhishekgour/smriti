package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.GitHubAccountConnection;
import com.tinexus.smriti.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GitHubAccountConnectionRepository extends JpaRepository<GitHubAccountConnection, UUID> {
    Optional<GitHubAccountConnection> findByUser(User user);
    Optional<GitHubAccountConnection> findByUserId(UUID userId);
    
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByUser(User user);
}
