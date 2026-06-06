# Plan de Implementación — NuzlockeTracker

Construcción feature por feature: cada fase entrega algo visible y usable.
Las fases 5, 6, 7 y 8 son independientes entre sí una vez terminada la Fase 3.

---

## Fase 0 — Infraestructura base

Sin features. Solo el stack funcionando de punta a punta.

**Backend:**
- Spring Boot init, estructura de paquetes (Controller → Service → Repository)
- Dependencias: Spring Web, Spring Security, Spring Data JPA, Flyway, PostgreSQL driver, JWT
- Flyway configurado, conexión a BD local
- Variables de entorno para configuración sensible
- Environments: dev / prod

**Frontend:**
- React + Vite + PWA manifest
- react-i18next configurado desde el día 1 (EN + ES)
- Estructura de carpetas base

**Deploy:**
- Railway (backend + BD)
- Vercel (frontend)
- Pipeline básico funcionando

**Entregable:** "Hola mundo" desplegado. Stack completo corriendo.

---

## Fase 1 — Catálogo de datos

Todo lo demás depende de tener Pokémon, rutas y juegos en la base de datos.

**Migraciones Flyway:**
- `Game`, `Badge`, `Gym`, `Route`
- `Pokemon`, `PokemonName`, `PokemonEvolutionChain`, `PokemonBaseStats`, `PokemonAbility`
- `Ability`, `AbilityName`
- `Move`, `MoveName`, `TypeEffectiveness`
- `Item`, `ItemName`, `ItemCalcEffect`
- `RouteEncounterTable`

**Población de datos:**
- Script one-time: PokéAPI → BD (Pokémon, moves, abilities, items, stats)
- Script de scraping: Bulbapedia → rutas y tablas de encuentro por juego
- Juegos iniciales: Pokémon X/Y, ORAS

**API REST (solo lectura):**
- `GET /games` — lista de juegos
- `GET /games/{id}/routes` — rutas de un juego en orden
- `GET /pokemon/search?q=` — búsqueda por nombre con autocompletar

**Frontend:**
- Browse de juegos
- Búsqueda de Pokémon (para probar el catálogo)

**Aprenderás:** JPA con relaciones complejas, DTOs, Flyway en profundidad, fetch strategies (LAZY vs EAGER).

**Entregable:** Podés buscar "Charizard" y ver sus datos. Podés listar las rutas de Pokémon X.

---

## Fase 2 — Auth

Sin auth no hay runs personalizadas ni sync.

**Migraciones Flyway:**
- `User`, `UserSettings`, `OAuthConnection`, `UsernameHistory`
- `EmailVerificationToken`, `PasswordResetToken`, `RefreshToken`

**Backend:**
- Spring Security config completa
- Registro con email + password + verificación por correo
- Google OAuth (OAuthConnection)
- JWT: access token (15 min) + refresh token con rotación
- `User.tokenVersion` para invalidar todas las sesiones
- Endpoints: register, login, refresh, logout, verify-email, forgot-password, reset-password

**Frontend:**
- Pantallas: login, registro, verificación de email, recuperar contraseña
- Almacenamiento seguro del JWT en el cliente
- Interceptor para renovar tokens automáticamente

**Aprenderás:** Spring Security, OAuth2 Client, JWT, refresh token rotation, manejo de sesiones.

**Entregable:** Podés registrarte con Google o email, iniciar sesión, y el token funciona.

---

## Fase 3 — MVP core (runs y encuentros)

El corazón de la app. Sin esto no hay producto.

**Migraciones Flyway:**
- `RulePreset`, `RunRule`
- `Run`, `RunBadge`
- `RouteEncounter`, `CaughtPokemon`, `PokemonStatusLog`
- `RunEvent`

**Backend:**
- CRUD de runs (crear, listar, archivar, completar, GAME_OVER automático)
- Presets de reglas predefinidos (Clásico, Hardcore, Libre) + personalización
- Registrar encuentro: todos los outcomes (CAPTURED, FAILED, DIED_IN_ENCOUNTER, NOT_FOUND, DEFERRED)
- Marcar medallas (RunBadge) con auto-creación desde el flujo de rutas
- Gestión del equipo: ACTIVE, BOXED, FAINTED
- Evolucionar Pokémon (currentPokemonId, RunEvent POKEMON_EVOLVED)
- Marcar fainted + notas de muerte + deshacer (PokemonStatusLog.isCorrection)
- Run COMPLETED: Hall of Fame en payload de RunEvent RUN_ENDED
- GAME_OVER automático si PERMADEATH ON y último ACTIVE Pokémon fallece
- Warnings de reglas (nunca bloquea)

**Frontend:**
- Flujo de creación de run (wizard 4 pasos: juego → versión → nombre → reglas)
- Pantalla principal de run con 4 tabs: Rutas / Equipo / Stats / Config
- Modal de registro de encuentro
- Tab Equipo: ACTIVE + BOXED + FAINTED
- Pantalla detalle de Pokémon con acciones
- Pantalla Hall of Fame al completar
- Rutas en secciones por medalla, no bloqueante
  - Si el jugador toca una ruta con badge pendiente: "¿Ya obtuviste [Medalla X]?" → auto-crea RunBadge

**Aprenderás:** Transacciones JPA, lógica de negocio en service layer, manejo de estados complejos, operaciones en cascada.

**Entregable:** La app es jugable para Nuzlocke. Sin sync ni social, pero completamente funcional.

---

## Fase 4 — Offline + Sync

Sin esto no es una PWA de verdad.

**Frontend:**
- IndexedDB: estructura espejando el modelo de BD (mismas entidades, mismos UUIDs)
- Service Worker: cache de assets + pre-cache de sprites de la run activa
- Detección de conectividad (online/offline banner)
- Cola de operaciones pendientes cuando está offline
- Al recuperar conexión: sync automático de la cola

**Backend:**
- API de sync: `POST /sync/batch` — batch upsert (last-write-wins por `updatedAt`)
- Soporte para `deletedAt` (soft deletes propagados correctamente)
- Migración local → nube al crear cuenta por primera vez

**Aprenderás:** PWA Service Worker, IndexedDB, estrategias de sync, conflict resolution.

**Entregable:** La app funciona sin internet. Al crear cuenta, sincroniza los datos locales.

---

## Fase 5 — Calculadora de daño

**Migraciones Flyway:**
- `CalcPreset`, `RunStatOverride`

**Backend:**
- Endpoints para la calc: moves con learnset por Pokémon, abilities, items con efectos
- `GET /pokemon/{id}/calc-data` — todo lo necesario para pre-rellenar la calculadora

**Frontend:**
- Componente calculadora con layout progresivo (básico → expandido)
- Vista básica: tipo, poder, efectividad, STAB, damage range
- Vista expandida: EVs/IVs, naturaleza, habilidad, ítem, clima/terreno
- Pre-carga desde Pokémon del equipo (atacante)
- Defensor: búsqueda ad-hoc (no se guarda)
- Guardar/cargar CalcPresets
- RunStatOverride: editar stats base para la run (ROM hacks)
- En runs randomizadas o fangames: todos los movimientos disponibles sin filtrar por learnset

**Aprenderás:** Lógica de dominio compleja en el frontend, componentes reutilizables con estado complejo.

**Entregable:** Podés calcular daño desde cualquier Pokémon del equipo.

---

## Fase 6 — Social

**Migraciones Flyway:**
- `ReactionType`
- `UserFollow`, `RunSubscription`, `RunFavorite`
- `RunComment`, `RunReaction`
- `UserBlock`, `Notification`, `PushSubscription`

**Backend:**
- Visibilidad de runs: PUBLIC / FOLLOWERS_ONLY / PRIVATE
- Feed de RunEvents con filtros: todo / solo quienes sigo / por juego / más activas
  - Query: RunEvents de runs PUBLIC + FOLLOWERS_ONLY (si UserFollow al dueño)
  - Filtrado por `eventVisibilityConfig`
  - Ordenado por `occurredAt` desc (usa `Run.lastActivityAt` desnormalizado)
- UserFollow: seguir/dejar de seguir usuarios
- RunSubscription: suscribirse a notificaciones de una run puntual
- RunFavorite: bookmarking
- RunComment: crear, responder (1 nivel), soft delete
- RunReaction: reaccionar con tipos globales o custom del creador
- UserBlock: concern transversal en todos los endpoints sociales
- Notificaciones in-app: generadas al crear RunEvent en runs suscritas
- Web Push: registro de PushSubscription, envío de notificaciones push
- Perfiles públicos con runs visibles según follows
- Búsqueda global: GIN indexes en `username`, `run.name`, `PokemonName.name`
- `User.isVerified`: cuentas verificadas pueden crear ReactionTypes custom

**Frontend:**
- Feed público con infinite scroll y filtros
- Vista pública de run (`/{username}/{slug}`): timeline, equipo, comentarios, reacciones
- Perfiles de usuario: runs públicas, follows, contribuciones
- Centro de notificaciones + badge de no leídas (`lastSeenNotificationsAt`)
- Opt-in a notificaciones push
- Configuración: privacidad, preferencias de notificación, gestión de OAuth

**Aprenderás:** Queries complejas con filtros y paginación, Web Push API, GIN indexes.

**Entregable:** La app tiene componente social completo. Runs públicas, feed, follows, notificaciones.

---

## Fase 7 — Contribuciones comunitarias

**Migraciones Flyway:**
- `CommunityContribution`

**Backend:**
- Flujo de envío: cualquier usuario puede enviar datos de rutas/Pokémon/encuentros
- Panel admin: cola de revisión, aprobar / rechazar / solicitar cambios (`adminFeedback`)
- Al CHANGES_REQUESTED: el contribuidor puede ver el feedback y reenviar
- Al APPROVED: insertar datos en tablas de catálogo + incrementar `User.approvedContributionCount`
- Auto-promoción a CONTRIBUTOR al alcanzar 5 contribuciones aprobadas
- Ranking de contribuidores por juego (on-demand desde `CommunityContribution`)

**Frontend:**
- Vista contribuidor: mis envíos, estado, feedback del admin
- Formulario de envío por tipo (ROUTE / ENCOUNTER_TABLE / POKEMON)
- Vista admin: cola de revisión con acciones
- Ranking en página de cada juego
- Badge "Contributor" en perfiles

**Datos iniciales de fangames:**
- Poblar Pokémon Añil y Pokémon Z usando el sistema de contribuciones o script admin directo

**Entregable:** La comunidad puede contribuir datos. Los fangames son jugables.

---

## Fase 8 — Estadísticas

Sin nuevas migraciones — todo computable desde datos existentes.

**Backend:**
- `GET /runs/{id}/stats` — stats de una run: rutas completadas, capturas, bajas, tiempo
- `GET /users/{id}/stats` — stats globales: Pokémon más capturado, runs completadas, etc.
- Tiempo en equipo por Pokémon (desde `PokemonStatusLog`, filtrado por `isCorrection`)

**Frontend:**
- Tab Stats en la run: rutas, capturas, bajas, tiempo por Pokémon en equipo
- Sección de stats globales en el perfil propio
- Cementerio con notas de muerte de cada Pokémon

**Aprenderás:** Queries de agregación, window functions en SQL.

**Entregable:** Dashboard de estadísticas históricas.

---

## Resumen y dependencias

| Fase | Nombre | Depende de |
|------|--------|-----------|
| 0 | Infraestructura base | — |
| 1 | Catálogo de datos | 0 |
| 2 | Auth | 0 |
| 3 | MVP core (runs) | 1, 2 |
| 4 | Offline + Sync | 3 |
| 5 | Calculadora de daño | 1, 3 |
| 6 | Social | 3 |
| 7 | Contribuciones comunitarias | 2, 6 |
| 8 | Estadísticas | 3 |

Las fases 5, 6, 7 y 8 son independientes entre sí — se pueden hacer en cualquier orden después de la Fase 3.
