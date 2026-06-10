package com.nuzlocketracker.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendVerificationEmail(String toEmail, String rawToken) {
        String link = frontendUrl + "/verify-email?token=" + rawToken;
        sendEmail(toEmail,
                "Verifica tu cuenta — Nuzlocke Tracker",
                "Haz clic en el siguiente enlace para verificar tu cuenta:\n\n" + link
                        + "\n\nEste enlace expira en 24 horas.");
    }

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String link = frontendUrl + "/reset-password?token=" + rawToken;
        sendEmail(toEmail,
                "Restablecer contraseña — Nuzlocke Tracker",
                "Haz clic en el siguiente enlace para restablecer tu contraseña:\n\n" + link
                        + "\n\nEste enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.");
    }

    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
