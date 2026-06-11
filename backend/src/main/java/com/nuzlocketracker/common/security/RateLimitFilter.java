package com.nuzlocketracker.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP-based rate limiting for auth endpoints.
 * In-memory buckets — suitable for single-instance Railway deployment.
 * Buckets are never evicted (auth endpoints are low-volume), which is acceptable.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // endpoint key → (capacity, refill duration)
    private record Limit(long capacity, Duration refill) {}

    private static final Map<String, Limit> LIMITS = Map.of(
        "/api/auth/login",                new Limit(10, Duration.ofMinutes(15)),
        "/api/auth/register",             new Limit(5,  Duration.ofHours(1)),
        "/api/auth/forgot-password",      new Limit(5,  Duration.ofHours(1)),
        "/api/auth/resend-verification",  new Limit(5,  Duration.ofHours(1)),
        "/api/auth/reset-password",       new Limit(10, Duration.ofMinutes(15))
    );

    // key = "path:ip"
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if (!HttpMethod.POST.matches(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        Limit limit = LIMITS.get(req.getRequestURI());
        if (limit == null) {
            chain.doFilter(req, res);
            return;
        }

        String ip = resolveIp(req);
        String key = req.getRequestURI() + ":" + ip;
        Bucket bucket = buckets.computeIfAbsent(key, k -> buildBucket(limit));

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
        }
    }

    private Bucket buildBucket(Limit limit) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit.capacity())
                        .refillGreedy(limit.capacity(), limit.refill())
                        .build())
                .build();
    }

    private String resolveIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
