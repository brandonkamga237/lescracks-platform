-- Umami stores its analytics tables in its own database on the same server:
-- analytics data grows independently and never mixes with the platform's schema.
CREATE DATABASE umami;
