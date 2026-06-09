# Nuzlocke Tracker — Contexto del Proyecto

## Qué es

PWA (Progressive Web App) mobile-first para registrar y gestionar Nuzlocke runs de Pokémon. El usuario elige un juego, obtiene todas las rutas predefinidas, y registra qué Pokémon capturó (o no) en cada una. Funciona offline y opcionalmente sincroniza con la nube.

## Objetivo del proyecto

Proyecto de aprendizaje para afianzar Spring Boot 3 con stack completo (backend, frontend, seguridad, deploy). El código debe ser limpio y production-ready, no un tutorial.

## Stack definido

- **Backend:** Spring Boot 3, Spring Security + JWT, Spring Data JPA, PostgreSQL, Flyway
- **Frontend:** React (PWA, responsive, mobile-first)
- **Storage local:** IndexedDB (local-first)
- **Deploy:** Railway (backend + DB), Vercel (frontend)

## Estado actual

En fase de definición. Sin código aún. Se están definiendo features del MVP y modelo de datos.

---

## Plataforma

- **PWA** — funciona en desktop browser, mobile browser y tablet. Se puede instalar en el homescreen.
- **Mobile-first** — el caso de uso principal es el jugador con el celular al lado de la consola.
- **Offline-first (local-first):** los datos se guardan en IndexedDB. La app funciona completamente sin conexión.
- **Sync opcional:** el usuario elige si quiere respaldar y sincronizar sus datos en la nube. Sin cuenta o sin optar, todo queda local.

---

## Auth

- **Google OAuth** (método principal)
- **Email + password** con verificación por correo
- **JWT** para sesiones
- Sin cuenta = modo local únicamente (sin sync)

---

## Juegos soportados

Arrancar con los más jugados para Nuzlocke:

- **Oficiales 3DS:** Pokémon X/Y, Pokémon ORAS (Omega Ruby / Alpha Sapphire)
- **Fangames populares (español):** Pokémon Añil, Pokémon Z
- **Meta:** cubrir todos los juegos a largo plazo

### Fuente de datos por tipo de juego

- **Oficiales:** PokéAPI para Pokémon. Rutas y tablas de encuentro: web scraping de Bulbapedia/wikis como herramienta admin (one-time, para poblar la BD).
- **Fangames:** datos aportados por la comunidad. Usuarios proponen rutas/encuentros, admin aprueba. Sistema de contribuciones con moderación.

---

## Features

### Calculadora de daño (feature integrada en la run)

- Acceso rápido desde cualquier Pokémon del equipo
- Vista por defecto: básica (tipo, poder, efectividad, STAB)
- Vista expandible: completa con EVs, IVs, naturaleza, habilidad, clima — como calc común→científica
- Precargada con defaults inteligentes (stats del catálogo, EVs 0, IVs 31, naturaleza neutral, nivel = level cap o 50)
- Movimientos: sugiere learnset del Pokémon pero permite elegir cualquier movimiento
- En run randomizer: muestra todos los movimientos disponibles sin filtrar por learnset
- Stats custom: `RunStatOverride` sobreescribe las stats base para esa run (ROM hacks)
- Cálculo vive en el frontend — el backend solo provee los datos del catálogo

### MVP — sin esto no tiene sentido

- Registro / Login (Google o email)
- Crear una run eligiendo un juego
- Ver rutas del juego en orden
- Registrar encuentro por ruta: capturado / fallido / fainted
- Al registrar: la app sugiere la ruta actual, usuario busca el Pokémon por nombre (autocompletar)
- Ver equipo activo (vivos) y cementerio (muertos)
- Reglas Nuzlocke clásicas como preset por defecto
- Sistema de presets de reglas: clásico, hardcore, libre (solo registrar), personalizable
- Offline completo con sync opcional a la nube

### Post-MVP — valor agregado importante

- Runs públicas: hacerlas públicas, feed de runs públicas de todos los usuarios
- Seguir runs de otros jugadores + favoritos
- Notificaciones cuando una run seguida tiene actualizaciones: in-app + push PWA
- Filtro de rutas por medalla obtenida
- Estadísticas detalladas (ver sección)
- Historial de runs terminadas

### Futuro / ideas avanzadas

- **Reconocimiento por cámara:** usar la cámara del celular para detectar el sprite y nombre del Pokémon en pantalla (OCR / visión) y agregarlo automáticamente.
- Contribución comunitaria de datos de fangames
- Más presets de reglas según la comunidad

---

## Filosofía de UX

- **Automático pero no cerrado:** la app intenta hacer todo por el usuario, pero siempre puede desmarcar, corregir o sobreescribir cualquier cosa.
- Entrada de datos ultra rápida para no interrumpir el juego.
- Búsqueda de Pokémon con autocompletar por nombre (no selects largos).

---

## Sistema de Reglas

Presets predefinidos, todos personalizables:

- **Clásico Nuzlocke:** solo primer encuentro por ruta, si muere va al cementerio, nickname obligatorio
- **Hardcore Nuzlocke:** clásico + sin objetos en combate + nivel limitado por el siguiente gym
- **Libre:** sin restricciones, solo registrar lo que capturás
- Presets son base → el usuario puede activar/desactivar reglas individuales
- Ejemplos de reglas configurables: duplicados, cantidad de capturas por ruta, item clause, species clause, etc.
- Definición detallada de cada regla: pendiente

---

## Estadísticas

Cuanto más detalladas mejor. Ideas confirmadas:

- Veces que capturaste a cada Pokémon (histórico de todas las runs)
- Tiempo de uso de cada Pokémon en relación a la duración de la run (requiere timestamps de cuándo entró y salió del equipo)
- Más a definir: tasa de capturas por ruta, Pokémon más usado, causa de muertes, etc.
- Requiere que la run registre el equipo activo con timestamps a lo largo del tiempo

---

## Social

- Seguir usuarios (unidireccional, sin aprobación — como Twitter)
- El usuario puede desactivar que otros lo sigan (UserSettings)
- Feed de runs públicas de todos los usuarios
- Agregar runs a favoritos
- Notificaciones cuando una run seguida tiene actualizaciones: in-app + push PWA
- Sin sistema de amistad — el follow mutuo funciona informalmente como tal

### Visibilidad de runs (tres niveles)

- **Pública:** cualquiera la ve
- **Solo seguidores:** la ven los que te siguen
- **Privada:** solo vos

---

## Modelo de datos

### Catálogo (datos del juego — solo lectura para el usuario)

```text
Game: id, name, generation, isOfficial, coverImageUrl
      versions (JSONB array, nullable)
      ← ej: ["X","Y"] o ["OR","AS"]. Null = juego sin versiones.

Badge: id, gameId, name, order, imageUrl

Gym: id, gameId, badgeId, leaderName, order, acePokemonLevel
     ← nivel oficial precargado; usado para calcular level cap

Route: id, gameId, name, order, requiredBadgeId (nullable)
       encounterType: RANDOM | STATIC | GIFT | STARTER | FOSSIL | LEGENDARY | TRADE
       ← RANDOM = encuentro aleatorio normal
       ← resto = Pokémon predeterminado (RouteEncounterTable tendrá una sola entrada)

Pokemon: id, speciesId, nationalDexNumber (nullable), types, spriteUrl
         variant (nullable string — ej: "ALOLA", "GALAR", "HISUI". Null = forma base)
         isFromFangame, gameId (nullable)
         ← todas las variantes del mismo Pokémon comparten speciesId
         ← speciesId es usado por REGIONAL_VARIANT_CLAUSE para detectar duplicados
         ← nombre se guarda en PokemonName, no directamente en esta tabla

PokemonName: pokemonId → Pokemon, lang (ISO 639-1), name
     unique(pokemonId, lang)
     ← inicialmente solo "en". Agregar "es" u otros idiomas es solo agregar filas, sin cambio de schema
     ← el endpoint de búsqueda usa esta tabla para soportar múltiples idiomas

PokemonEvolutionChain: chainId, pokemonId
     ← todos los Pokémon de la misma línea comparten chainId
     ← usado por species clause para detectar duplicados por línea evolutiva

PokemonBaseStats: pokemonId, hp, attack, defense, spAtk, spDef, speed
     ← precargado desde PokéAPI para juegos oficiales
     ← para ROM hacks: comunidad contribuye los valores custom

PokemonLearnset: pokemonId, moveId, learnMethod (LEVEL_UP/TM/HM/TUTOR/EGG)
     levelLearned (nullable — solo para LEVEL_UP), gameId (nullable — algunos moves varían por juego)

PokemonAbility: pokemonId, abilityId, slot (1/2/HIDDEN)

Ability: id
AbilityName: abilityId, lang, name

Move: id, type (PokémonType), power (nullable), category: PHYSICAL/SPECIAL/STATUS
     accuracy (nullable), priority (int, default 0)
MoveName: moveId, lang, name

TypeEffectiveness: attackingType, defendingType, multiplier (0 / 0.5 / 1 / 2)
     ← tabla estática 18×18 = 324 filas, precargada una vez

Item: id
ItemName: itemId, lang, name
ItemCalcEffect: id, itemId, effectJson (JSONB)
     ← estructura del efecto: { "attackMultiplier": 1.5 } (Choice Band)
     ←                         { "damageMultiplier": 1.3 } (Life Orb)
     ←                         { "damageMultiplier": 1.2, "condition": { "moveType": "FIRE" } } (Charcoal)
     ←                         { "damageMultiplier": 1.2, "condition": { "superEffective": true } } (Expert Belt)
     ← JSONB permite modelar cualquier efecto sin cambiar el schema

RouteEncounterTable: id, routeId, pokemonId, encounterType, rarity
     gameVersion (nullable string)
     ← null = disponible en todas las versiones del juego
     ← "X" = solo en Pokémon X, "Y" = solo en Pokémon Y
```

### Usuarios y configuración

```text
User: id (UUID), email, emailVerified, passwordHash (nullable)
      username (único — usado en URLs: /{username}/{run-slug})
      role: USER | CONTRIBUTOR | ADMIN
           USER = usuario regular
           CONTRIBUTOR = miembro de confianza que puede enviar datos de fangames con mayor credibilidad
           ADMIN = puede aprobar/rechazar/solicitar cambios en contribuciones comunitarias
      isVerified (bool) ← cuenta verificada (YouTubers, streamers, cuentas oficiales)
      lastUsernameChangedAt (nullable) ← cooldown 30 días entre cambios de username
      tokenVersion (int, default 0) ← incrementar = invalida todos los tokens activos
      approvedContributionCount (int, default 0) ← desnormalizado: se incrementa al aprobar una contribución
           ← cuando llega a umbral (5 aprobadas): rol asciende automáticamente a CONTRIBUTOR
           ← admin puede ascender manualmente también
      deletedAt (nullable) ← soft delete: cuenta desactivada, datos preservados 90 días
      deletionReason (nullable — "self_requested" | "admin_ban")
      ← "Eliminar cuenta" en settings = soft delete (deletedAt = now, tokenVersion++)
      ← datos preservados 90 días; login dentro del período = reactivación automática
      ← "Eliminar mis datos permanentemente" (GDPR) = hard delete inmediato, sin reactivación
      ← job automático hace hard delete en cascada tras 90 días desde deletedAt
      ← googleId eliminado — reemplazado por OAuthConnection para soportar múltiples proveedores

OAuthConnection: id, userId, provider (GOOGLE | YOUTUBE | TWITCH | etc.)
     providerUserId, profileData (JSONB — foto, nombre del proveedor, etc.)
     createdAt
     ← unique(provider, providerUserId)
     ← agregar nuevo proveedor = solo nuevas filas, sin cambio de schema
     ← conectar YouTube/Twitch verificado → puede activar User.isVerified automáticamente

UsernameHistory: id, userId, oldUsername, changedAt
     ← redirige /{oldUsername}/... → /{newUsername}/... automáticamente

EmailVerificationToken: id, userId, tokenHash, expiresAt
     ← se genera al registrarse con email/password; sin esto no hay verificación de email

PasswordResetToken: id, userId, tokenHash, expiresAt, usedAt (nullable)
     ← se genera al pedir reset; se invalida tras usarse o expirar

RefreshToken: id, userId, tokenHash, tokenVersion, expiresAt, createdAt
     ← tokenVersion debe coincidir con User.tokenVersion; si no coincide, el token es inválido
     ← "cerrar todas las sesiones" = incrementar User.tokenVersion + borrar todos sus RefreshTokens
     ← permite rotación de tokens (cada refresh genera uno nuevo, el anterior se borra)
     ← cuando alguien cambia su username, el backend redirige /{oldUsername}/... → /{newUsername}/...
     ← sin esto, todos los links compartidos quedan rotos

UserSettings: userId
     allowFollowers (bool, default true)
     language ('en' | 'es', nullable — null = usar idioma del navegador)
     lastSeenNotificationsAt (nullable) ← se actualiza al abrir el centro de notificaciones
          ← usado para calcular el badge de "N no leídas" en el ícono de campana
          ← query: COUNT WHERE Notification.createdAt > lastSeenNotificationsAt
     notificationPreferences (JSONB)
          default: { POKEMON_CAPTURED: true, POKEMON_FAINTED: true, POKEMON_EVOLVED: true,
                     BADGE_OBTAINED: true, RUN_ENDED: true, NEW_FOLLOWER: true,
                     NEW_COMMENT: true, NEW_REACTION: true }

UserBlock: id, blockerId → User, blockedId → User, createdAt
     ← concern transversal: TODOS los endpoints sociales filtran por esta tabla
     ← efectos: no puede seguir, comentar, ver runs (incluso FOLLOWERS_ONLY que antes podía ver)
     ← el bloqueado no sabe que fue bloqueado

PushSubscription: id, userId, endpoint, p256dh, auth, createdAt
     ← datos requeridos por la Web Push API para enviar notificaciones PWA
     ← un usuario puede tener varias (un dispositivo por suscripción)
```

### Reglas

```text
RulePreset: id, name, description, isSystem (bool), ownerId (nullable)
RunRule: id, runId, ruleType (enum), isEnabled, value (nullable JSON)

RuleType enum:
  FIRST_ENCOUNTER_ONLY, PERMADEATH, NICKNAME_REQUIRED,
  SPECIES_CLAUSE, DUPLICATE_CLAUSE, ITEM_CLAUSE,
  REGIONAL_VARIANT_CLAUSE   ← si ON: variantes regionales cuentan como duplicado (mismo speciesId)
                               si OFF: Raichu-Kanto y Raichu-Alola se consideran distintos
  LEVEL_CAP                 valor: { "modifierPercent": number }
                            ← cap = floor(gym.acePokemonLevel * (1 + modifier/100))
                            ← 0% = nivel oficial, 10% = +10% de dificultad
  MAX_CATCHES_PER_ROUTE     valor: { "max": number }
```

### Runs y encuentros

```text
Run: id (UUID), userId, gameId, name
     slug (auto-generado desde el nombre — único por usuario)
     gameVersion (nullable string — ej: "X", "OR". Null si el juego no tiene versiones)
     isRandomized (bool) ← si true: sugerencias de encuentro deshabilitadas, catálogo completo disponible
     status: ACTIVE / COMPLETED / GAME_OVER / ABANDONED
     visibility: PUBLIC / FOLLOWERS_ONLY / PRIVATE
     eventVisibilityConfig (JSONB) ← qué tipos de eventos aparecen en el timeline público
          default: { POKEMON_CAPTURED: true, POKEMON_EVOLVED: true, POKEMON_FAINTED: true,
                     BADGE_OBTAINED: true, RUN_ENDED: true }
     isFavorite (bool) ← destacada en la lista del usuario
     displayOrder (int) ← orden manual en la lista del usuario
     basePresetId, startedAt, endedAt (nullable)
     lastActivityAt  ← desnormalizado: se actualiza en cada RunEvent (para ordenar el feed)
     subscriberCount ← desnormalizado: se actualiza al crear/borrar RunSubscription (para ordenar por popularidad)
     updatedAt, deletedAt (soft delete — para sync)
     ← URL pública: /{user.username}/{run.slug}
     ← GAME_OVER solo se dispara si PERMADEATH está ON y el último ACTIVE CaughtPokemon pasa a FAINTED
     ← si PERMADEATH está OFF: FAINTED es reversible, el jugador puede mover el Pokémon de vuelta al equipo
     ← posición actual = primera ruta PENDING sugerida; el jugador selecciona manualmente
     ← (futuro: detección automática de ruta actual)

RunBadge: id, runId, badgeId, obtainedAt  ← marca manual del jugador

RouteEncounter: id (UUID), runId, routeId
     outcome: PENDING        ← no llegaste aún (default)
              DEFERRED       ← dejaste para más adelante (backtracking), slot libre
              CAPTURED       ← slot usado
              FAILED         ← slot usado (intentaste, no pudiste)
              DIED_IN_ENCOUNTER ← slot usado (tu Pokémon murió durante la captura)
              NOT_FOUND      ← slot usado (pasaste sin encontrar nada)
     notes (nullable), encounteredAt (nullable)
     updatedAt, deletedAt

CaughtPokemon: id (UUID), runId, routeEncounterId
     originalPokemonId → Pokemon  ← lo que capturaste (no cambia)
     currentPokemonId  → Pokemon  ← forma actual (cambia al evolucionar)
     nickname (nullable), isShiny (bool)
     status: ACTIVE / BOXED / FAINTED
     caughtAt, updatedAt

PokemonStatusLog: id, caughtPokemonId, status, occurredAt, notes (nullable)
     isCorrection (bool, default false)
     ← append-only, para stats de tiempo
     ← notes en transición a FAINTED: contexto de muerte ("murió vs Brock, Onix nivel 14")
     ← isCorrection = true: el jugador deshizo un faint accidental o corrigió un estado equivocado
     ← stats de tiempo filtran o ajustan entradas con isCorrection = true

RunStatOverride: id, runId, pokemonId
     hp, attack, defense, spAtk, spDef, speed
     ← sobreescribe PokemonBaseStats solo para esta run (ROM hacks con stats custom)
     ← si no existe, la calculadora usa PokemonBaseStats del catálogo

CalcPreset: id, runId, name
     pokemonId, formVariant (nullable — ej: "MEGA_X")
     level (int, default 50)
     evHp, evAtk, evDef, evSpAtk, evSpDef, evSpe (ints, default 0)
     ivHp, ivAtk, ivDef, ivSpAtk, ivSpDef, ivSpe (ints, default 31)
     nature (nullable string — enum de las 25 naturalezas)
     abilityId (nullable), itemId (nullable)
     createdAt, updatedAt
     ← configuración guardada del atacante para reusar en la calculadora
     ← el defensor siempre se elige en el momento, no se guarda

RunEvent: id, runId, eventType, payload (JSONB), occurredAt  ← append-only
     eventType: POKEMON_CAPTURED | POKEMON_EVOLVED | POKEMON_FAINTED | BADGE_OBTAINED | RUN_ENDED
     payload: datos del evento (pokemonId, routeId, badgeId, fromPokemonId, toPokemonId, etc.)
     ← triple propósito: dispara notificaciones + alimenta timeline público + feed de seguidores
```

### Social (modelo)

```text
UserFollow: followerId → User, followedId → User, followedAt
     ← seguir un usuario: sus runs aparecen en tu feed
     ← da acceso a todas sus runs con visibility = FOLLOWERS_ONLY

RunSubscription: id, userId → User, runId → Run, subscribedAt
     ← seguir una run puntual: recibís notificaciones de esa run específica
     ← independiente de UserFollow

RunFavorite: userId, runId, savedAt
     ← solo bookmarking, no implica notificaciones

RunComment: id, runId → Run, userId → User
     parentCommentId → RunComment (nullable — null = top-level, no-null = respuesta)
     runEventId → RunEvent (nullable — solo en top-level, ancla el comentario a un evento)
     content (text), createdAt, deletedAt (soft delete — admin o autor pueden borrar)
     ← máximo un nivel de anidado: las respuestas no pueden tener respuestas (validado en service layer)

ReactionType: id, label, emoji (nullable), imageUrl (nullable), ownerId → User (nullable)
     isActive (bool, default true)
     ← ownerId null = reacción global (LIKE, RIP, HYPE, GG)
     ← ownerId not null = reacción custom de ese usuario (solo usuarios isVerified)
     ← unique(ownerId, label)
     ← fans del creador ven sus reacciones custom disponibles al reaccionar en sus runs

RunReaction: id, runId → Run, userId → User
     reactionTypeId → ReactionType
     createdAt
     ← unique (runId, userId, reactionTypeId) — una reacción por tipo por usuario por run

Notification: id, userId, type, referenceId, isRead, createdAt
     type: POKEMON_CAPTURED | POKEMON_FAINTED | BADGE_OBTAINED | RUN_ENDED | NEW_FOLLOWER | NEW_COMMENT | NEW_REACTION
     referenceId: runEventId, runCommentId o userId según el tipo
     ← generada automáticamente al crear un RunEvent en runs suscritas (RunSubscription)
```

### Contribuciones comunitarias (fangames)

```text
CommunityContribution: id, contributorId, status: PENDING/APPROVED/REJECTED/CHANGES_REQUESTED
     gameId, dataType: ROUTE/ENCOUNTER_TABLE/POKEMON
     dataJson (JSONB), reviewedBy (nullable), adminFeedback (text, nullable)
     createdAt, reviewedAt
     ← CHANGES_REQUESTED: admin pide correcciones específicas (feedback en adminFeedback)
     ← el contribuidor ve el feedback, corrige el dataJson y reenvía (status vuelve a PENDING)
     ← admin puede aprobar/rechazar/solicitar cambios — no edita el dataJson directamente
     ← cualquier usuario puede enviar contribuciones; CONTRIBUTOR = mayor credibilidad en la cola
```

### Decisiones técnicas del modelo

- IDs son UUIDs generados en el cliente (necesario para offline-first)
- Entidades mutables tienen `updatedAt` + `deletedAt` (soft delete para sync)
- Conflictos de sync: last-write-wins por `updatedAt`
- `RunRule` es snapshot al crear la run — cambiar el preset no afecta runs en curso
- `PokemonStatusLog` es append-only — permite calcular tiempo exacto en equipo/box
- `Run.visibility` reemplaza el boolean `isPublic` — tres niveles de visibilidad
- `CaughtPokemon` tiene `originalPokemonId` (inmutable) + `currentPokemonId` (cambia al evolucionar)
- Species clause compara `PokemonEvolutionChain.chainId`, no el Pokémon individual
- Level cap = `floor(gym.acePokemonLevel * (1 + modifierPercent/100))` — datos de gym precargados
- `DEFERRED` en RouteEncounter = backtracking explícito, el slot sigue libre
- Movimientos y nivel del Pokémon no se registran — la app prioriza agilidad de uso
- `Game.versions` + `Run.gameVersion` + `RouteEncounterTable.gameVersion` manejan exclusivos de versión
- `Route.encounterType` distingue encuentros aleatorios de estáticos/regalo/starter/etc.
- `User.username` único requerido — forma parte de la URL pública de cada run
- `User.role: USER | CONTRIBUTOR | ADMIN` — ADMIN aprueba/rechaza/solicita cambios; CONTRIBUTOR se gana automáticamente al alcanzar 5 contribuciones aprobadas (o manualmente por admin)
- `User.approvedContributionCount` desnormalizado — visible en perfil público como reconocimiento a la comunidad
- Ranking de contribuidores por juego: computable on-demand desde `CommunityContribution` (gameId + contributorId + status = APPROVED). Sin tabla extra en MVP; si escala, agregar `GameContributorStats (gameId, userId, approvedCount)`.
- `UsernameHistory` registra usernames anteriores para redirigir URLs viejas (username es mutable)
- `UserFollow` (seguir usuario) ≠ `RunSubscription` (suscribirse a notificaciones de una run puntual)
- FOLLOWERS_ONLY requiere `UserFollow` al dueño, no `RunSubscription`
- `Pokemon.speciesId` agrupa todas las variantes regionales del mismo Pokémon
- `REGIONAL_VARIANT_CLAUSE` controla si variantes cuentan como duplicado (configurable por run)
- `PokemonName`, `MoveName`, `AbilityName`, `ItemName` siguen el mismo patrón de localización (lang ISO 639-1)
- Mega/Primal/Gigantamax se modelan como Pokemon con `variant` propio y sus propios `PokemonBaseStats`
- `ItemCalcEffect.effectJson` JSONB permite modelar cualquier efecto de item sin cambio de schema futuro
- `OAuthConnection` reemplaza `User.googleId` — escala a cualquier proveedor sin cambio de schema
- `User.isVerified` para cuentas notables — activable manualmente por admin o automáticamente via proveedor verificado
- `User.lastUsernameChangedAt` — cooldown 30 días entre cambios de username
- `UserSettings.language` persiste idioma en BD — sincroniza entre dispositivos al logearse
- `UserSettings.notificationPreferences` JSONB — el usuario controla cada tipo de notificación individualmente
- Auth merge: si OAuth devuelve email de cuenta existente verificada, se vincula automáticamente
- `EmailVerificationToken`, `PasswordResetToken` y `RefreshToken` son necesidades técnicas de auth — sin ellas no hay reset de contraseña, verificación ni sesiones seguras
- `User.tokenVersion` permite invalidar TODAS las sesiones activas sin tabla adicional de "dispositivos"
- Run COMPLETED = botón manual → muestra Hall of Fame (Pokémon ACTIVE al momento de endedAt, computado desde CaughtPokemon, guardado en payload de RunEvent RUN_ENDED)
- Sin sistema de reportes — bloqueo de usuario + moderación directa del admin es suficiente
- `Run.isFavorite` + `Run.displayOrder` permiten al usuario organizar y destacar sus runs
- Frontend i18n (react-i18next o similar) debe configurarse desde el día 1 — no se puede agregar fácil después
- Sprites custom: `Pokemon.spriteUrl` acepta URL propia o externa; almacenamiento de archivos en Cloudflare R2 (free tier más generoso que S3 para este tipo de proyecto)
- El Service Worker pre-cachea sprites de los Pokémon de la run activa cuando hay conexión
- `TypeEffectiveness` es estática (324 filas) — se precarga una vez, nunca cambia
- `PokemonLearnset.gameId` nullable — algunos movimientos varían por juego (importante para sugerencias de la calc)
- `RunStatOverride` sobreescribe stats base solo en esa run — la calc usa override si existe, sino usa catálogo
- Calculadora: lógica de cálculo vive en el frontend; backend provee datos via API
- Calculadora pre-rellena defaults (IVs 31, EVs 0, naturaleza neutral, nivel = level cap o 50)
- `PokemonName` tabla de localización: solo "en" inicialmente, expandible a otros idiomas sin cambio de schema
- `RunComment.parentCommentId` permite un nivel de respuestas (replies no anidados — validado en service)
- `UserBlock` es concern transversal: cada endpoint social debe filtrar usuarios bloqueados
- Sin sistema de logros/achievements — el tracker no puede verificar que las runs son reales; los logros perderían valor inmediatamente
- `ReactionType` entidad reemplaza el enum en RunReaction — permite reacciones custom por creador verificado (isVerified). Reacciones globales: LIKE, RIP, HYPE, GG. Sin límite fijo de tipos.
- Rutas: se muestran todas en secciones por medalla. No bloquea acceso a rutas futuras — si el jugador toca una ruta con badge pendiente, la app pregunta "¿Ya obtuviste [Medalla X]?" y la crea automáticamente si confirma.
- `UserSettings.lastSeenNotificationsAt` para el badge de notificaciones no leídas. `Notification.isRead` se conserva para descarte individual dentro del centro de notificaciones.
- Contribuciones: admin puede solicitar cambios (CHANGES_REQUESTED + adminFeedback) — el contribuidor ve el feedback, corrige y reenvía. Admin no edita dataJson directamente.
- Tiempo en equipo de un Pokémon visible solo en la pantalla de estadísticas de la run, no en el detalle individual.
- Búsqueda global unificada (usuarios + runs públicas + Pokémon) con PostgreSQL full-text search (GIN indexes en username, run.name, PokemonName.name). Sin Elasticsearch en MVP.
- Mini ficha de Pokémon: sprite, tipos, stats base, habilidades posibles — datos del catálogo existente, sin entidades nuevas
- Reglas: solo warnings, nunca bloquea — filosofía "automático pero no cerrado" se aplica a reglas también
- PERMADEATH OFF: FAINTED es reversible. GAME_OVER solo aplica con PERMADEATH ON.
- Correcciones: todo editable — cambios en RouteEncounter.outcome son operaciones transaccionales (pueden crear/eliminar CaughtPokemon en cascada)
- `PokemonStatusLog.isCorrection` distingue correcciones de usuario de eventos reales — afecta cálculo de stats
- Feed público = stream de RunEvents (estilo Twitter), no tarjetas de runs
  ← query: RunEvents de runs PUBLIC + FOLLOWERS_ONLY (si sigo al dueño), filtrados por eventVisibilityConfig, orderBy occurredAt desc
- Stats históricas = tiempo real (on-demand). Sin tabla de resumen precalculada en MVP.
- Comentarios: no se editan — solo soft delete. Sin campo updatedAt visible en UI.
- `CalcPreset` guarda configuración del atacante; el defensor siempre es ad-hoc.
- Naturalezas = enum en código (25 fijos), no tabla en BD.
- `Run.eventVisibilityConfig` JSONB controla qué eventos aparecen en el timeline público — default all true
- `POKEMON_EVOLVED` agregado al enum de RunEvent — aparece en timeline si el usuario lo habilita
- `PokemonStatusLog.notes` guarda contexto de muerte (qué entrenador, qué Pokémon enemigo)
- Equipo lleno al capturar: el jugador elige si swapea con uno del equipo o manda el nuevo al box
- Posición en mapa: sugerida automáticamente (primera ruta PENDING), selección manual. Sin `currentRouteId`. Mejora a auto = feature futura.
- `Run.isRandomized = true` → sugerencias de ruta deshabilitadas, catálogo completo disponible para buscar
- En runs de fangames/hackroms (`Game.isOfficial = false`): también catálogo completo disponible
- `GAME_OVER` se setea automáticamente en el service layer cuando el último ACTIVE Pokémon fallece
- `Run.lastActivityAt` y `Run.subscriberCount` son campos desnormalizados para que el feed sea eficiente
- Feed soporta filtros: por juego, recién actualizadas, más seguidas, de usuarios que seguís
- Borrar cuenta = soft delete por 90 días (reactivable), luego hard delete automático. GDPR hard delete disponible como opción separada.
- `Run.slug` auto-generado desde el nombre — URL: `/{username}/{slug}`
- `RunEvent` append-only: dispara notificaciones + timeline público + feed de seguidores
- `PushSubscription` almacena credenciales de dispositivo para Web Push API
- Migración local→nube al crear cuenta: sync API soporta batch upsert (los UUIDs ya son del cliente)

---

## Decisiones tomadas

- PWA sobre app nativa — cubre todos los dispositivos sin stores
- Local-first con sync opcional — el usuario elige si quiere cuenta/nube
- PokéAPI para juegos oficiales; scraping one-time para rutas
- Datos de fangames: contribución comunitaria con moderación
- Sin monetización — fan project, hosting en tier gratuito
- Filosofía: automático pero nunca cerrado, siempre override manual posible

---

## Comandos de desarrollo

```bash
# 1. Base de datos y mail (Docker)
docker compose up -d db mail

# 2. Backend (Spring Boot) — puerto 8080
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Frontend (React + Vite) — puerto 5173
cd frontend && npm run dev

# Verificar compilación antes de testear
cd backend && mvn compile -q
cd frontend && npx tsc --noEmit
```

- DB: PostgreSQL en Docker puerto 5435 (user: nuzlocke, pass: nuzlocke, db: nuzlocke_tracker_dev)
- Mail UI: [http://localhost:8025](http://localhost:8025) (Mailpit)
- Después de cambios en el backend, siempre reiniciar el servidor — Spring Boot no tiene hot-reload para lógica de negocio
- El frontend tiene hot-reload automático vía Vite

---

## Convenciones de código

- Arquitectura en capas: Controller → Service → Repository
- DTOs para request/response (no exponer entidades directamente)
- Validaciones con Bean Validation (@Valid)
- Migraciones de BD con Flyway
- Variables de entorno para configuración sensible (nunca hardcodeada)
