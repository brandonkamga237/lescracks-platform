package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.repository.ResourceTypeRepository;
import com.brandonkamga.lescracks.repository.EventStatusRepository;
import com.brandonkamga.lescracks.repository.ApplicationTypeRepository;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    /**
     * Admin credentials are read from environment variables so they are never
     * committed to source control.
     *
     * Required env vars:
     *   ADMIN_EMAIL            — e-mail used to create / identify the admin account
     *   ADMIN_INITIAL_PASSWORD — password set on first creation only
     *
     * Defaults are intentionally insecure placeholders that fail in production
     * (the prod profile requires JWT_SECRET, ADMIN_EMAIL, etc. to be set explicitly).
     */
    @Value("${app.admin.email:admin@lescracks.local}")
    private String adminEmail;

    @Value("${app.admin.initial-password:ChangeMe@1234}")
    private String adminInitialPassword;

    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final EventStatusRepository eventStatusRepository;
    private final ApplicationTypeRepository applicationTypeRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(
            RoleRepository roleRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ResourceTypeRepository resourceTypeRepository,
            EventStatusRepository eventStatusRepository,
            ApplicationTypeRepository applicationTypeRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        this.roleRepository            = roleRepository;
        this.categoryRepository        = categoryRepository;
        this.tagRepository             = tagRepository;
        this.resourceTypeRepository    = resourceTypeRepository;
        this.eventStatusRepository     = eventStatusRepository;
        this.applicationTypeRepository = applicationTypeRepository;
        this.providerRepository        = providerRepository;
        this.userRepository            = userRepository;
        this.passwordEncoder           = passwordEncoder;
        this.jdbcTemplate              = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        dropLegacyRoleConstraint();
        initRoles();
        initProviders();
        initAdminUser();
        initCategories();
        initTags();
        initResourceTypes();
        initEventStatuses();
        initApplicationTypes();
    }

    private void dropLegacyRoleConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check");
        } catch (Exception ignored) {
            // Constraint absent or DB does not support IF EXISTS — safe to skip
        }
    }

    private void initRoles() {
        for (RoleName name : RoleName.values()) {
            if (roleRepository.findByName(name).isEmpty()) {
                roleRepository.save(Role.builder().name(name).build());
                log.debug("Created role: {}", name);
            }
        }
    }

    private void initProviders() {
        if (providerRepository.count() == 0) {
            providerRepository.save(Provider.builder()
                    .providerName(ProviderType.LOCAL)
                    .description("Local email/password authentication")
                    .build());
            providerRepository.save(Provider.builder()
                    .providerName(ProviderType.GOOGLE)
                    .description("Google OAuth2 authentication")
                    .build());
            providerRepository.save(Provider.builder()
                    .providerName(ProviderType.GITHUB)
                    .description("GitHub OAuth2 authentication")
                    .build());
            log.info("Authentication providers initialized");
        }
    }

    private void initAdminUser() {
        Role adminRole         = roleRepository.findByName(RoleName.admin).orElse(null);
        Provider localProvider = providerRepository.findByProviderName(ProviderType.LOCAL).orElse(null);

        if (adminRole == null || localProvider == null) {
            log.error("Cannot initialize admin user — role or provider is missing");
            return;
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            existing -> {
                boolean changed = false;
                if (existing.getRole() == null || existing.getRole().getName() != RoleName.admin) {
                    existing.setRole(adminRole);
                    changed = true;
                }
                if (!existing.isEmailVerified()) {
                    existing.setEmailVerified(true);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(existing);
                    log.info("Admin account repaired");
                }
            },
            () -> {
                User admin = User.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminInitialPassword))
                        .username("admin")
                        .provider(localProvider)
                        .role(adminRole)
                        .emailVerified(true)
                        .build();
                userRepository.save(admin);
                log.info("Admin account created (email: {})", adminEmail);
            }
        );
    }

    private void initCategories() {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("data_science").build());
            categoryRepository.save(Category.builder().name("dev_web").build());
            categoryRepository.save(Category.builder().name("devops").build());
            categoryRepository.save(Category.builder().name("security").build());
            log.debug("Categories initialized");
        }
    }

    private void initTags() {
        if (tagRepository.count() == 0) {
            categoryRepository.findByName("data_science").ifPresent(cat -> {
                tagRepository.save(Tag.builder().name("ai").category(cat).build());
                tagRepository.save(Tag.builder().name("data_science").category(cat).build());
                tagRepository.save(Tag.builder().name("tensorflow").category(cat).build());
                tagRepository.save(Tag.builder().name("pytorch").category(cat).build());
                tagRepository.save(Tag.builder().name("machine_learning").category(cat).build());
            });
            categoryRepository.findByName("dev_web").ifPresent(cat -> {
                tagRepository.save(Tag.builder().name("dev_web").category(cat).build());
                tagRepository.save(Tag.builder().name("react").category(cat).build());
                tagRepository.save(Tag.builder().name("angular").category(cat).build());
                tagRepository.save(Tag.builder().name("vuejs").category(cat).build());
                tagRepository.save(Tag.builder().name("springboot").category(cat).build());
            });
            categoryRepository.findByName("devops").ifPresent(cat -> {
                tagRepository.save(Tag.builder().name("devops").category(cat).build());
                tagRepository.save(Tag.builder().name("docker").category(cat).build());
                tagRepository.save(Tag.builder().name("kubernetes").category(cat).build());
                tagRepository.save(Tag.builder().name("ci_cd").category(cat).build());
            });
            categoryRepository.findByName("security").ifPresent(cat -> {
                tagRepository.save(Tag.builder().name("security").category(cat).build());
                tagRepository.save(Tag.builder().name("cybersecurity").category(cat).build());
                tagRepository.save(Tag.builder().name("penetration_testing").category(cat).build());
                tagRepository.save(Tag.builder().name("network_security").category(cat).build());
            });
            log.debug("Tags initialized");
        }
    }

    private void initResourceTypes() {
        if (resourceTypeRepository.count() == 0) {
            resourceTypeRepository.save(ResourceType.builder().name(ResourceTypeName.video).build());
            resourceTypeRepository.save(ResourceType.builder().name(ResourceTypeName.document).build());
            log.debug("Resource types initialized");
        }
    }

    private void initEventStatuses() {
        if (eventStatusRepository.count() == 0) {
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.open).build());
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.closed).build());
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.upcoming).build());
            log.debug("Event statuses initialized");
        }
    }

    private void initApplicationTypes() {
        if (applicationTypeRepository.count() == 0) {
            for (ApplicationTypeName name : ApplicationTypeName.values()) {
                applicationTypeRepository.save(
                        ApplicationType.builder().name(name).build());
            }
            log.debug("Application types initialized");
        }
    }
}
