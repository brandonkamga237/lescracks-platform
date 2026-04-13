package com.brandonkamga.lescracks.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Configuration class for managing environment variables securely.
 * Supports environment variable rotation without application restart.
 */
@Configuration
@EnableAsync
@EnableScheduling
@ConfigurationProperties(prefix = "app.config")
public class AppConfig {

    private static final String ENV_FILE_PATH = System.getProperty("user.dir") + "/.env";
    
    private final Map<String, String> encryptedValues = new ConcurrentHashMap<>();
    private final ScheduledExecutorService rotationExecutor = Executors.newSingleThreadScheduledExecutor();
    private Properties envProperties;
    private long lastModifiedTime = 0;

    /**
     * Initialize the configuration by loading environment variables from .env file
     */
    @PostConstruct
    public void init() {
        loadEnvFile();
        scheduleEnvFileReload();
    }

    /**
     * Load environment variables from .env file
     */
    private void loadEnvFile() {
        try {
            Path envPath = Paths.get(ENV_FILE_PATH);
            if (Files.exists(envPath)) {
                long currentModifiedTime = Files.getLastModifiedTime(envPath).toMillis();
                
                // Only reload if file has been modified
                if (currentModifiedTime > lastModifiedTime) {
                    Properties props = new Properties();
                    try (InputStream is = Files.newInputStream(envPath)) {
                        props.load(is);
                    }
                    this.envProperties = props;
                    this.lastModifiedTime = currentModifiedTime;
                }
            }
        } catch (Exception e) {
            // If .env file doesn't exist or can't be loaded, use system environment variables
            this.envProperties = new Properties();
        }
    }

    /**
     * Schedule periodic reload of .env file for rotation support
     */
    private void scheduleEnvFileReload() {
        rotationExecutor.scheduleAtFixedRate(this::loadEnvFile, 5, 5, TimeUnit.MINUTES);
    }

    /**
     * Get environment variable value with optional default
     */
    public String getEnv(String key, String defaultValue) {
        // First check .env file
        if (envProperties != null && envProperties.containsKey(key)) {
            return envProperties.getProperty(key);
        }
        // Then check system environment
        String envValue = System.getenv(key);
        return envValue != null ? envValue : defaultValue;
    }

    /**
     * Get required environment variable (throws exception if not found)
     */
    public String getRequiredEnv(String key) {
        String value = getEnv(key, null);
        if (value == null || value.isEmpty()) {
            throw new IllegalStateException("Required environment variable '" + key + "' is not set");
        }
        return value;
    }

    /**
     * Encrypt a sensitive value
     */
    public String encryptValue(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes());
            String encrypted = Base64.getEncoder().encodeToString(hash);
            encryptedValues.put(encrypted, value);
            return encrypted;
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt value", e);
        }
    }

    /**
     * Decrypt an encrypted value
     */
    public String decryptValue(String encryptedValue) {
        String original = encryptedValues.get(encryptedValue);
        if (original != null) {
            return original;
        }
        throw new IllegalArgumentException("Encrypted value not found in cache");
    }

    /**
     * Rotate a specific environment variable
     */
    public void rotateEnvVariable(String key, String newValue) {
        if (envProperties != null) {
            envProperties.setProperty(key, newValue);
        }
    }

    /**
     * Check if running in production
     */
    public boolean isProduction() {
        return "prod".equalsIgnoreCase(getEnv("SPRING_PROFILES_ACTIVE", "dev"));
    }

    /**
     * Check if running in development
     */
    public boolean isDevelopment() {
        return "dev".equalsIgnoreCase(getEnv("SPRING_PROFILES_ACTIVE", "dev"));
    }

    /**
     * Check if running in test
     */
    public boolean isTest() {
        return "test".equalsIgnoreCase(getEnv("SPRING_PROFILES_ACTIVE", "dev"));
    }

    /**
     * Get database host
     */
    public String getDbHost() {
        return getEnv("DB_HOST", "localhost");
    }

    /**
     * Get database port
     */
    public int getDbPort() {
        return Integer.parseInt(getEnv("DB_PORT", "5432"));
    }

    /**
     * Get database name
     */
    public String getDbName() {
        return getEnv("DB_NAME", "lescracks");
    }

    /**
     * Get database username
     */
    public String getDbUsername() {
        return getEnv("DB_USERNAME", "postgres");
    }

    /**
     * Get database password
     */
    public String getDbPassword() {
        return getEnv("DB_PASSWORD", "");
    }

    /**
     * Get JWT secret
     */
    public String getJwtSecret() {
        return getEnv("JWT_SECRET", "");
    }

    /**
     * Get JWT expiration time in milliseconds
     */
    public long getJwtExpiration() {
        return Long.parseLong(getEnv("JWT_EXPIRATION", "86400000"));
    }

    /**
     * Get MinIO endpoint
     */
    public String getMinioEndpoint() {
        return getEnv("MINIO_ENDPOINT", "http://localhost:9000");
    }

    /**
     * Get MinIO access key
     */
    public String getMinioAccessKey() {
        return getEnv("MINIO_ACCESS_KEY", "");
    }

    /**
     * Get MinIO secret key
     */
    public String getMinioSecretKey() {
        return getEnv("MINIO_SECRET_KEY", "");
    }

    /**
     * Get MinIO bucket name
     */
    public String getMinioBucket() {
        return getEnv("MINIO_BUCKET", "lescracks");
    }

    /**
     * Get application URL
     */
    public String getAppUrl() {
        return getEnv("APP_URL", "http://localhost:8080");
    }

    /**
     * Get frontend URL
     */
    public String getFrontendUrl() {
        return getEnv("FRONTEND_URL", "http://localhost:5173");
    }

    /**
     * Get CORS allowed origins
     */
    public String getCorsOrigins() {
        return getEnv("CORS_ORIGINS", "http://localhost:5173");
    }

    /**
     * Shutdown the rotation executor
     */
    public void shutdown() {
        rotationExecutor.shutdown();
        try {
            if (!rotationExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                rotationExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            rotationExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
