-- Keycloak stores its realm, users and sessions here. Separate database, same server:
-- what needs isolating is the data, not the process.
CREATE DATABASE keycloak;
