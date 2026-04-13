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
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final EventStatusRepository eventStatusRepository;
    private final ApplicationTypeRepository applicationTypeRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ResourceTypeRepository resourceTypeRepository,
            EventStatusRepository eventStatusRepository,
            ApplicationTypeRepository applicationTypeRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.resourceTypeRepository = resourceTypeRepository;
        this.eventStatusRepository = eventStatusRepository;
        this.applicationTypeRepository = applicationTypeRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Initialize Roles — idempotent: insert only missing roles
        if (roleRepository.findByName(RoleName.user).isEmpty())
            roleRepository.save(Role.builder().name(RoleName.user).build());
        if (roleRepository.findByName(RoleName.premium_user).isEmpty())
            roleRepository.save(Role.builder().name(RoleName.premium_user).build());
        if (roleRepository.findByName(RoleName.learner).isEmpty())
            roleRepository.save(Role.builder().name(RoleName.learner).build());
        if (roleRepository.findByName(RoleName.admin).isEmpty())
            roleRepository.save(Role.builder().name(RoleName.admin).build());

        // Initialize Providers FIRST (required for admin user creation)
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
        }

        // Create admin user AFTER providers are initialized
        System.out.println("=== DataInitializer: Checking for admin user ===");
        System.out.println("User count: " + userRepository.count());
        System.out.println("Admin exists: " + userRepository.findByEmail("admin@admin.com").isPresent());
        
        Role adminRole = roleRepository.findByName(RoleName.admin).orElse(null);
        Provider localProvider = providerRepository.findByProviderName(ProviderType.LOCAL).orElse(null);

        System.out.println("Admin role: " + (adminRole != null ? adminRole.getName() : "NULL"));
        System.out.println("Local provider: " + (localProvider != null ? localProvider.getProviderName() : "NULL"));

        if (!userRepository.findByEmail("admin@admin.com").isPresent()) {
            if (adminRole != null && localProvider != null) {
                User adminUser = User.builder()
                        .email("admin@admin.com")
                        .password(passwordEncoder.encode("Admin@Admin"))
                        .username("admin")
                        .provider(localProvider)
                        .role(adminRole)
                        .build();
                userRepository.save(adminUser);
                System.out.println("=== Admin user created successfully! ===");
            } else {
                System.out.println("=== Admin user NOT created - role or provider is null! ===");
            }
        } else {
            // Ensure admin always has the admin role (in case it was accidentally changed)
            userRepository.findByEmail("admin@admin.com").ifPresent(existingAdmin -> {
                if (adminRole != null && (existingAdmin.getRole() == null || existingAdmin.getRole().getName() != RoleName.admin)) {
                    existingAdmin.setRole(adminRole);
                    userRepository.save(existingAdmin);
                    System.out.println("=== Admin role restored to admin! ===");
                } else {
                    System.out.println("=== Admin user already exists with correct role ===");
                }
            });
        }

        // Initialize Categories
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("data_science").build());
            categoryRepository.save(Category.builder().name("dev_web").build());
            categoryRepository.save(Category.builder().name("devops").build());
            categoryRepository.save(Category.builder().name("security").build());
        }

        // Initialize Tags
        if (tagRepository.count() == 0) {
            // Interest tags as requested
            categoryRepository.findByName("data_science").ifPresent(category -> {
                tagRepository.save(Tag.builder().name("ai").category(category).build());
                tagRepository.save(Tag.builder().name("data_science").category(category).build());
                tagRepository.save(Tag.builder().name("tensorflow").category(category).build());
                tagRepository.save(Tag.builder().name("pytorch").category(category).build());
                tagRepository.save(Tag.builder().name("machine_learning").category(category).build());
            });
            
            // Dev Web tags
            categoryRepository.findByName("dev_web").ifPresent(category -> {
                tagRepository.save(Tag.builder().name("dev_web").category(category).build());
                tagRepository.save(Tag.builder().name("react").category(category).build());
                tagRepository.save(Tag.builder().name("angular").category(category).build());
                tagRepository.save(Tag.builder().name("vuejs").category(category).build());
                tagRepository.save(Tag.builder().name("springboot").category(category).build());
            });
            
            // DevOps tags
            categoryRepository.findByName("devops").ifPresent(category -> {
                tagRepository.save(Tag.builder().name("devops").category(category).build());
                tagRepository.save(Tag.builder().name("docker").category(category).build());
                tagRepository.save(Tag.builder().name("kubernetes").category(category).build());
                tagRepository.save(Tag.builder().name("ci_cd").category(category).build());
            });
            
            // Security tags
            categoryRepository.findByName("security").ifPresent(category -> {
                tagRepository.save(Tag.builder().name("security").category(category).build());
                tagRepository.save(Tag.builder().name("cybersecurity").category(category).build());
                tagRepository.save(Tag.builder().name("penetration_testing").category(category).build());
                tagRepository.save(Tag.builder().name("network_security").category(category).build());
            });
        }

        // Initialize Resource Types
        if (resourceTypeRepository.count() == 0) {
            resourceTypeRepository.save(ResourceType.builder().name(ResourceTypeName.video).build());
            resourceTypeRepository.save(ResourceType.builder().name(ResourceTypeName.document).build());
        }

        // Initialize Event Statuses
        if (eventStatusRepository.count() == 0) {
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.open).build());
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.closed).build());
            eventStatusRepository.save(EventStatus.builder().name(EventStatusEnum.upcoming).build());
        }

        // Initialize Application Types
        if (applicationTypeRepository.count() == 0) {
            applicationTypeRepository.save(ApplicationType.builder().name(ApplicationTypeName.apply).build());
            applicationTypeRepository.save(ApplicationType.builder().name(ApplicationTypeName.register).build());
            applicationTypeRepository.save(ApplicationType.builder().name(ApplicationTypeName.participate).build());
            applicationTypeRepository.save(ApplicationType.builder().name(ApplicationTypeName.accompagnement_360).build());
            applicationTypeRepository.save(ApplicationType.builder().name(ApplicationTypeName.formation_classique).build());
        }
    }
}
