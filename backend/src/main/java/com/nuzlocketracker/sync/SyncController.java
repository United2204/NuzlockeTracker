package com.nuzlocketracker.sync;

import com.nuzlocketracker.sync.dto.BatchSyncRequest;
import com.nuzlocketracker.sync.dto.BatchSyncResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    /**
     * Migración local → nube: sube datos offline generados antes de crear cuenta.
     * Solo inserta entidades que no existen en el servidor (INSERT-only, no overwrite).
     */
    @PostMapping("/batch")
    public BatchSyncResponse batchSync(@Valid @RequestBody BatchSyncRequest req, Authentication auth) {
        return syncService.batchSync(UUID.fromString(auth.getName()), req);
    }
}
