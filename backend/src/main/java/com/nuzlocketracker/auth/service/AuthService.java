package com.nuzlocketracker.auth.service;

import com.nuzlocketracker.auth.dto.LoginRequest;
import com.nuzlocketracker.auth.dto.RegisterRequest;
import com.nuzlocketracker.auth.dto.TokenResponse;
import com.nuzlocketracker.auth.entity.*;
import com.nuzlocketracker.auth.repository.*;
import com.nuzlocketracker.common.exception.AuthException;
import com.nuzlocketracker.common.exception.ConflictException;
import com.nuzlocketracker.common.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final OAuthConnectionRepository oAuthConnectionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw new ConflictException("Email already registered");
        }
        if (userRepository.existsByUsername(request.username().trim())) {
            throw new ConflictException("Username already taken");
        }

        User user = new User();
        user.setEmail(request.email().toLowerCase().trim());
        user.setUsername(request.username().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        UserSettings settings = new UserSettings();
        settings.setUser(user);
        userSettingsRepository.save(settings);

        String rawToken = UUID.randomUUID().toString();
        EmailVerificationToken evToken = new EmailVerificationToken();
        evToken.setUser(user);
        evToken.setTokenHash(hashToken(rawToken));
        evToken.setExpiresAt(OffsetDateTime.now().plusHours(24));
        emailVerificationTokenRepository.save(evToken);

        emailService.sendVerificationEmail(user.getEmail(), rawToken);
    }

    @Transactional(readOnly = true)
    public boolean isEmailTaken(String email) {
        return userRepository.existsByEmail(email.toLowerCase().trim());
    }

    @Transactional(readOnly = true)
    public boolean isUsernameTaken(String username) {
        return userRepository.existsByUsername(username.trim());
    }

    public TokenResponse verifyEmail(String rawToken) {
        String tokenHash = hashToken(rawToken);
        EmailVerificationToken evToken = emailVerificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AuthException("Invalid or expired verification token"));

        if (evToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            emailVerificationTokenRepository.delete(evToken);
            throw new AuthException("Verification token expired");
        }

        User user = evToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationTokenRepository.delete(evToken);

        return generateTokenPair(user);
    }

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (user.getPasswordHash() == null) {
            throw new AuthException("This account uses social login");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Invalid email or password");
        }
        if (!user.isEmailVerified()) {
            throw new AuthException("Email not verified. Check your inbox.");
        }
        if (user.getDeletedAt() != null) {
            throw new AuthException("Account is deactivated");
        }

        return generateTokenPair(user);
    }

    public TokenResponse refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new AuthException("Refresh token expired");
        }

        User user = stored.getUser();
        if (stored.getTokenVersion() != user.getTokenVersion()) {
            refreshTokenRepository.delete(stored);
            throw new AuthException("Token invalidated. Please log in again.");
        }

        refreshTokenRepository.delete(stored);
        return generateTokenPair(user);
    }

    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshTokenRepository::delete);
    }

    public void forgotPassword(String email) {
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String rawToken = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setTokenHash(hashToken(rawToken));
            resetToken.setExpiresAt(OffsetDateTime.now().plusHours(1));
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
        // Always succeed silently — don't leak whether the email exists
    }

    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AuthException("Invalid or expired reset token"));

        if (resetToken.getUsedAt() != null) {
            throw new AuthException("Reset token already used");
        }
        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new AuthException("Reset token expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.deleteByUser(user);
    }

    public TokenResponse handleOAuthLogin(String provider, String providerUserId,
                                          String email, String displayName, String profileJson) {
        Optional<OAuthConnection> existingConnection =
                oAuthConnectionRepository.findByProviderAndProviderUserId(provider, providerUserId);

        User user;
        if (existingConnection.isPresent()) {
            user = existingConnection.get().getUser();
        } else {
            user = userRepository.findByEmail(email.toLowerCase()).orElse(null);

            if (user == null) {
                user = new User();
                user.setEmail(email.toLowerCase());
                user.setUsername(generateUniqueUsername(email, displayName));
                user.setEmailVerified(true);
                user = userRepository.save(user);

                UserSettings settings = new UserSettings();
                settings.setUser(user);
                userSettingsRepository.save(settings);
            } else if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                user = userRepository.save(user);
            }

            OAuthConnection connection = new OAuthConnection();
            connection.setUser(user);
            connection.setProvider(provider);
            connection.setProviderUserId(providerUserId);
            connection.setProfileData(profileJson);
            oAuthConnectionRepository.save(connection);
        }

        return generateTokenPair(user);
    }

    private TokenResponse generateTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        String rawRefreshToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawRefreshToken));
        refreshToken.setTokenVersion(user.getTokenVersion());
        refreshToken.setExpiresAt(OffsetDateTime.now().plus(refreshTokenExpirationMs, ChronoUnit.MILLIS));
        refreshTokenRepository.save(refreshToken);

        return new TokenResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirationMs() / 1000
        );
    }

    private String generateUniqueUsername(String email, String displayName) {
        String base = (displayName != null && !displayName.isBlank())
                ? displayName.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase()
                : email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();

        if (base.length() < 3) base = "user" + base;
        base = base.substring(0, Math.min(base.length(), 25));

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
