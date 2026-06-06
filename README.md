# NuzlockeTracker

> Tu compañero de Nuzlocke. Registra tus runs, sigue tus Pokémon y comparte tu aventura.

NuzlockeTracker es una PWA mobile-first para registrar y gestionar partidas Nuzlocke de Pokémon. Funciona completamente sin conexión y opcionalmente sincroniza con la nube.

---

## Características

- **Registro rápido** — capturá, fallaste o murió en el intento: entrada de datos ultra rápida para no interrumpir el juego
- **Equipo y cementerio** — seguí el estado de cada Pokémon en tiempo real
- **Sistema de reglas** — presets de Nuzlocke clásico, hardcore y libre, todos 100% personalizables
- **Calculadora de daño** — básica o científica (EVs, IVs, naturaleza, habilidad, ítem, clima) accesible desde cualquier Pokémon del equipo
- **Offline-first** — funciona sin internet; sincronizá a la nube cuando quieras
- **Social** — hacé tus runs públicas, seguí las de otros y reaccioná con emojis de tu comunidad favorita
- **Estadísticas** — tiempo de uso por Pokémon, historial de capturas, tasas de éxito por ruta y más
- **Fangames** — soporte para juegos no oficiales con datos aportados por la comunidad

---

## Stack

| Capa | Tecnología |
| ---- | ---------- |
| Backend | Spring Boot 3, Spring Security + JWT, Spring Data JPA, Flyway |
| Base de datos | PostgreSQL |
| Frontend | React, PWA, IndexedDB |
| Deploy | Railway (backend + BD) · Vercel (frontend) |
| Archivos | Cloudflare R2 |

---

## Juegos soportados

| Juego | Estado |
| ----- | ------ |
| Pokémon X / Y | Planificado |
| Pokémon Omega Ruby / Alpha Sapphire | Planificado |
| Pokémon Añil | Planificado |
| Pokémon Z | Planificado |
| Más juegos | Contribuciones de la comunidad bienvenidas |

---

## Estado del proyecto

En desarrollo activo. Sin releases todavía.

Ver el [plan de implementación](docs/implementation-plan.md) para el roadmap detallado por fases.

---

## Desarrollo local

> Próximamente — instrucciones de setup al completar la Fase 0.

---

## Contribuir datos de juegos

¿Conocés un fangame que debería estar en NuzlockeTracker? Próximamente habrá un sistema de contribuciones comunitarias con moderación para agregar rutas, Pokémon y tablas de encuentro de juegos no oficiales.

---

## Licencia

Proyecto fan. Sin fines de lucro. Pokémon es marca registrada de Nintendo / Game Freak / Creatures Inc.
