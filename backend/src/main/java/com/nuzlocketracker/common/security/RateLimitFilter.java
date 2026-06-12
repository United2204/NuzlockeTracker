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
 * Security filter: IP-based rate limiting on auth endpoints + payload size enforcement.
 * In-memory buckets — suitable for single-instance Railway deployment.
 * Buckets are never evicted (auth endpoints are low-volume), which is acceptable.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private record Limit(long capacity, Duration refill) {}

    private static final Map<String, Limit> RATE_LIMITS = Map.of(
        "/api/auth/login",                new Limit(10, Duration.ofMinutes(15)),
        "/api/auth/register",             new Limit(5,  Duration.ofHours(1)),
        "/api/auth/forgot-password",      new Limit(5,  Duration.ofHours(1)),
        "/api/auth/resend-verification",  new Limit(5,  Duration.ofHours(1)),
        "/api/auth/reset-password",       new Limit(10, Duration.ofMinutes(15))
    );

    // Endpoints with payload size limits (bytes). Content-Length header checked when present.
    private static final long CONTRIBUTION_MAX_BYTES = 100_000L; // 100 KB

    // key = "path:ip"
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if (!HttpMethod.POST.matches(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        String uri = req.getRequestURI();

        // Payload size limit for contribution endpoints
        if (uri.equals("/api/contributions") || uri.matches("/api/contributions/\\d+/resubmit")) {
            long contentLength = req.getContentLengthLong();
            if (contentLength > CONTRIBUTION_MAX_BYTES) {
                res.setStatus(413);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Payload too large. Maximum 100 KB.\"}");
                return;
            }
        }

        // IP-based rate limiting for auth endpoints
        Limit limit = RATE_LIMITS.get(uri);
        if (limit == null) {
            chain.doFilter(req, res);
            return;
        }

        String key = uri + ":" + resolveIp(req);
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
        // server.forward-headers-strategy=native makes Tomcat rewrite getRemoteAddr()
        // with the real client IP from X-Forwarded-For set by Railway's trusted proxy.
        // Reading the header directly would allow attackers to spoof the IP.
        return req.getRemoteAddr();
    }
}
