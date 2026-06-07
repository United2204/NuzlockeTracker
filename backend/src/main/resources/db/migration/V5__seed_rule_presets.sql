-- ============================================================
-- V5 — Datos iniciales: presets de reglas del sistema
-- ============================================================
-- Los presets del sistema definen configuraciones predefinidas.
-- Las reglas concretas (RunRule) se crean en el backend cuando
-- el usuario crea una run, copiando la configuración del preset.
-- ============================================================

INSERT INTO rule_preset (name, description, is_system, owner_id) VALUES
    ('Clásico',  'Solo primer encuentro por ruta, permadeath, nickname obligatorio',       TRUE, NULL),
    ('Hardcore', 'Clásico + sin objetos en combate + level cap por siguiente gym',         TRUE, NULL),
    ('Libre',    'Sin restricciones — solo registrar lo que capturás',                     TRUE, NULL);
