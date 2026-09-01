# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
# --mount=type=cache keeps /root/.m2 across builds through BuildKit, so a pom.xml
# change only downloads the new dependencies.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copy pom.xml alone => the layer stays cached when only sources change
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

# 2. Copy sources and build
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests

# ── Stage 2: dev runtime image ────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS dev
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=dev"]

# ── Stage 3: prod runtime image ───────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
# wget is required for the Docker healthcheck (not present in alpine-jre by default)
RUN apk add --no-cache wget
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
