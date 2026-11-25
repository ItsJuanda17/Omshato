-- Se ejecuta una sola vez, al crear el volumen de PostgreSQL por primera vez.
-- Las pruebas de integración del API usan esta base y la reinician en cada corrida.
CREATE DATABASE omshato_test OWNER omshato;
