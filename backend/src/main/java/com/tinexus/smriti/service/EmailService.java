package com.tinexus.smriti.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String to, String otp, String projectName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Secure Access Code - " + projectName + " | Smriti");
            message.setText("You have been granted access to view the environment secrets (variables) for the project: " + projectName + "\n\n" +
                            "Your verification code is: " + otp + "\n\n" +
                            "This code will expire in 10 minutes.\n\n" +
                            "If you did not request this, please ignore this email.\n\n" +
                            "---\nPowered by Smriti (by Tinexus)");
            
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", maskEmail(to));
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", maskEmail(to), e);
            // We log the error but don't crash the application since it's async
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) return parts[0] + "***@" + parts[1];
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }
}
