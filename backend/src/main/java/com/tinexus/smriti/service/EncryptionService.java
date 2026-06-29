package com.tinexus.smriti.service;

import com.tinexus.smriti.security.AesEncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EncryptionService {

    private final AesEncryptionUtil aesUtil;

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new IllegalArgumentException("Secret value cannot be empty");
        }
        return aesUtil.encrypt(plaintext);
    }

    public String decrypt(String encryptedValue) {
        return aesUtil.decrypt(encryptedValue);
    }
}
