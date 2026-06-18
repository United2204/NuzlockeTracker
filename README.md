# Nuzlocke Tracker

A full-stack PWA for managing Pokémon Nuzlocke runs. Built as a learning project to solidify Spring Boot 3, Spring Security, and a production-grade full-stack architecture.

**Frontend:** [nuzlocke-tracker.vercel.app](https://nuzlocke-tracker.vercel.app) (Vercel, always up) · **Backend:** not running — see Status section below

---

## What it does

In a Nuzlocke run, players self-impose rules on Pokémon games: one capture per route, a fainted Pokémon is permanently dead, etc. This app lets players track their run in real time without interrupting the game.

- All routes for a game grouped by gym badge, with level caps per gym
- Register encounters per route: captured, failed, died, not found, deferred
- Team, box and graveyard views with sprite display and shiny support
- Evolve, devolve, move Pokémon between team/box/graveyard, delete incorrect captures
- Special encounters: starters, gifts, fossils, legendaries, trades
- Multi-slot routes (more than one catch per route, configurable per run)
- Run statistics computed on-demand: captures, deaths, time in team
- Damage calculator with base stats, nature, EVs/IVs, items, type effectiveness
- Nuzlocke rule presets (Classic, Hardcore, Free) fully customizable per run
- Community route data submissions for fan games, with admin moderation
- Social: follow users, subscribe to runs, reactions, comments, activity feed
- Push notifications via Web Push API

---

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Spring Boot 3, Spring Security 6, Spring Data JPA |
| Auth | JWT (access + refresh tokens), Google OAuth2, email/password + verification |
| Database | PostgreSQL, Flyway migrations (25 migrations) |
| Frontend | React 18, TypeScript, Vite |
| Offline storage | IndexedDB (idb library), Service Worker, PWA manifest |
| State / data fetching | TanStack Query v5 |
| i18n | react-i18next (Spanish + English) |
| Deploy | Railway (backend + PostgreSQL), Vercel (frontend) |

---

## Architecture

```text
backend/
  auth/           JWT issuing, refresh token rotation, Google OAuth2, email verification,
                  password reset, session invalidation via tokenVersion
  catalog/        Read-only game data: Pokémon, moves, abilities, items, routes, badges,
                  gyms, type effectiveness, evolution chains, learnsets
  run/            Core domain: runs, route encounters, caught Pokémon, rules,
                  badge tracking, run events, damage calc presets
  social/         Follows, run subscriptions, reactions, comments, notifications,
                  activity feed, push subscriptions
  stats/          On-demand run statistics (captures, deaths, time-in-team)
  contribution/   Community fan-game data submissions with PENDING/APPROVED/REJECTED/
                  CHANGES_REQUESTED lifecycle and admin feedback
  sync/           Batch upsert API for local→cloud data migration
  user/           Profile, settings, username history, username change cooldown

frontend/
  pages/          One component per route
  components/     Shared UI: EncounterModal, DamageCalcModal, PokemonSearch,
                  NotificationBell, RunSocialSection, PokemonDetailCard, ...
  services/       guestStore — full IndexedDB implementation mirroring the API
  api/            Typed axios wrappers for every backend endpoint
  i18n/locales/   en.json + es.json
```

> 191 Java source files · 25 Flyway migrations · 21 React pages · 106 commits

---

## Key design decisions

**Local-first, offline-capable.** The app works fully without an account. All data lives in IndexedDB. Guest users get the full feature set. Creating an account migrates local data to the cloud via a batch upsert API. UUIDs are generated client-side so there are no ID collisions on upload.

**Sync strategy: last-write-wins on `updatedAt`.** Mutable entities carry `updatedAt` and `deletedAt`. No CRDT or OT — straightforward and sufficient for a single-user local-first app.

**JWT + refresh token rotation.** Access tokens are short-lived. Each refresh issues a new token and revokes the old one. `User.tokenVersion` invalidates all active sessions simultaneously without a server-side blocklist.

**Rule snapshots, not references.** Nuzlocke rules are stored as `RunRule` rows at run creation. Editing a preset never affects runs already in progress.

**Rules warn, never block.** The UI shows warnings for species clause, duplicate clause, etc., but always lets the player proceed. "Automatic but never locked."

**Append-only event log.** `RunEvent` drives three things: push notifications, the public activity feed, and run statistics — one write, three consumers.

**Multi-language catalog.** `PokemonName`, `MoveName`, `AbilityName`, `RouteName` follow the same localization pattern (one row per language). Adding a new language is inserting rows, not changing schema.

---

## Data model highlights

- `route_encounter` — one row per slot per run. Outcomes: `PENDING / DEFERRED / CAPTURED / FAILED / DIED_IN_ENCOUNTER / NOT_FOUND`
- `caught_pokemon` — `originalPokemonId` (immutable) vs `currentPokemonId` (changes on evolution)
- `pokemon_status_log` — append-only. Enables time-in-team stats and distinguishes real events from player corrections
- `run_rule` — snapshot of rules at creation. Preset changes don't affect active runs
- `run_event` — append-only. Powers notifications + timeline + feed
- `oauth_connection` — decoupled from `User`. Adding a new OAuth provider is inserting rows, not changing schema
- `push_subscription` — one row per device for Web Push API

---

## Running locally

```bash
# 1. Start PostgreSQL + Mailpit (email testing)
docker compose up -d db mail

# 2. Backend — port 8080
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Frontend — port 5173
cd frontend && npm run dev
```

Mail UI: [http://localhost:8025](http://localhost:8025)

Copy `.env.example` files in `backend/` and `frontend/` and fill in your values.

---

## What I learned

- Configuring Spring Security 6 for JWT + OAuth2 in the same filter chain
- Refresh token rotation and `tokenVersion`-based session invalidation without a blocklist
- IndexedDB as a first-class data store (offline-first before API-first)
- Local-to-cloud sync with client-generated UUIDs and batch upsert
- PWA Service Worker: asset precaching, background sync, Web Push
- TanStack Query cache invalidation patterns for a responsive UI without optimistic updates
- Flyway as the single source of truth for schema — migrations are the documentation
- Designing "automatic but not locked" UX: suggest, but always let the user override

---

## Status

**Archived.** The core loop works end-to-end: create run → register encounters → track team and deaths, including guest mode, authentication, and cloud sync. Not actively maintained.

The backend is no longer hosted. The frontend at [nuzlocke-tracker.vercel.app](https://nuzlocke-tracker.vercel.app) stays up and the full app is usable in **guest mode** (no account needed) — routes, captures, team, deaths, all stored locally in IndexedDB. Auth and cloud sync require running the backend locally.
