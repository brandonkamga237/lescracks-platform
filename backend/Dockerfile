# ── Stage 1 : compilation ──
# Le cache Maven (.m2) est monté via un volume Docker dans docker-compose-dev.yml
# => les dépendances téléchargées persistent entre les builds, même après --no-cache
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2 : image de run Dev ──
FROM eclipse-temurin:21-jdk-alpine AS dev
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=dev"]

# ── Stage 3 : image de run Prod ──
FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
