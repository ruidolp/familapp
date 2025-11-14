-- Migration 008: Add PROYECTO type to sobres
-- Description: Agrega PROYECTO como nuevo tipo de sobre
-- Types soportados: GASTO, AHORRO, DEUDA, PROYECTO
-- PROYECTO se usa para sobres temporales de proyectos específicos

-- Nota: Como el campo tipo es TEXT, no necesita cambios en schema
-- Solo es documentación de que ahora soportamos PROYECTO además de GASTO, AHORRO, DEUDA

-- Ejemplo de inserción:
-- INSERT INTO sobres (nombre, tipo, usuario_id, presupuesto_asignado)
-- VALUES ('Renovación Casa', 'PROYECTO', 'user-id-here', 10000);
