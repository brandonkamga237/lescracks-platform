package com.brandonkamga.lescracks.config;
import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.util.Slugs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Profile("prod")
public class ProductionDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionDataSeeder.class);

    private final CategoryRepository categories;
    private final TagRepository tags;

    public ProductionDataSeeder(CategoryRepository categories, TagRepository tags) {
        this.categories = categories;
        this.tags = tags;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, List<String>> taxonomy = new LinkedHashMap<>();
        taxonomy.put("Backend", List.of("Java", "Python", "JavaScript", "TypeScript", "PHP", "C#", "Go", "Rust", "Node.js", "Spring Boot", "Spring MVC", "Django", "Flask", "FastAPI", "Laravel", "Express.js", "NestJS", ".NET", "ASP.NET", "REST", "REST API", "GraphQL", "WebSocket", "MVC", "Microservices", "API", "ORM", "JPA", "Hibernate", "Prisma", "Sequelize", "Middleware", "Routing", "Dependency Injection", "Server-side"));
        taxonomy.put("Frontend", List.of("HTML", "CSS", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Tailwind CSS", "Bootstrap", "Material UI", "DOM", "JSX", "TSX", "Components", "Hooks", "State Management", "Redux", "Zustand", "Context API", "Forms", "Responsive Design", "Accessibility", "SPA", "SSR", "SSG", "Web Components"));
        taxonomy.put("Programmation", List.of("Java", "Python", "C", "C++", "C#", "Go", "Rust", "PHP", "JavaScript", "TypeScript", "Variables", "Functions", "Loops", "Conditions", "Arrays", "Collections", "Exceptions", "Generics", "Interfaces", "Classes", "Objects", "Recursion", "Lambda", "Functional Programming", "OOP", "Memory Management", "Concurrency"));
        taxonomy.put("Algorithmique", List.of("Algorithms", "Data Structures", "Arrays", "Linked List", "Stack", "Queue", "Hash Table", "HashMap", "Tree", "Binary Tree", "Binary Search Tree", "Heap", "Graph", "Trie", "Sorting", "Searching", "Binary Search", "Recursion", "Backtracking", "Dynamic Programming", "Greedy", "BFS", "DFS", "Big O", "Complexity", "Time Complexity", "Space Complexity"));
        taxonomy.put("Base de données", List.of("SQL", "NoSQL", "PostgreSQL", "MySQL", "MariaDB", "SQLite", "Oracle", "MongoDB", "Redis", "Cassandra", "Tables", "Relations", "Primary Key", "Foreign Key", "Index", "Constraints", "Transactions", "ACID", "Joins", "Subqueries", "Views", "Stored Procedures", "Normalization", "Denormalization", "Database Design", "Query Optimization"));
        taxonomy.put("DevOps", List.of("Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "Ansible", "Terraform", "Linux", "Nginx", "Traefik", "Deployment", "Automation", "Infrastructure", "Containers", "Containerization", "Pipeline", "Build", "Release", "Monitoring", "Logging", "Scaling", "Configuration Management", "Infrastructure as Code"));
        taxonomy.put("Cloud", List.of("AWS", "Azure", "GCP", "EC2", "S3", "Lambda", "VPC", "IAM", "RDS", "DynamoDB", "CloudFront", "Route 53", "EKS", "ECS", "Azure VM", "Azure Blob Storage", "Azure Functions", "Google Compute Engine", "Cloud Run", "Cloud Storage", "Regions", "Availability Zones", "Serverless", "Virtual Machine", "Cloud Security", "Cloud Architecture"));
        taxonomy.put("Linux", List.of("Ubuntu", "Debian", "Kali Linux", "Fedora", "CentOS", "Bash", "Shell", "Terminal", "SSH", "SCP", "Permissions", "Users", "Groups", "Processes", "Services", "Systemd", "Cron", "Package Management", "APT", "File System", "Environment Variables", "Pipes", "Redirection", "grep", "awk", "sed", "chmod", "chown", "Networking"));
        taxonomy.put("Réseaux", List.of("TCP/IP", "HTTP", "HTTPS", "DNS", "DHCP", "FTP", "SSH", "SMTP", "IPv4", "IPv6", "MAC Address", "IP Address", "Subnetting", "CIDR", "Routing", "Switching", "NAT", "Firewall", "Proxy", "Load Balancer", "Port", "Socket", "OSI", "TCP", "UDP", "ICMP", "VLAN", "VPN", "Network Security"));
        taxonomy.put("Cybersécurité", List.of("OWASP", "XSS", "SQL Injection", "CSRF", "SSRF", "Authentication", "Authorization", "JWT", "OAuth2", "OpenID Connect", "HTTPS", "TLS", "Encryption", "Hashing", "Password Security", "MFA", "RBAC", "Vulnerability", "Pentest", "Network Security", "Web Security", "Linux Security", "Firewall", "Session Security", "Secure Coding"));
        taxonomy.put("Intelligence artificielle", List.of("AI", "Machine Learning", "Deep Learning", "LLM", "Generative AI", "NLP", "Computer Vision", "Neural Networks", "Transformers", "GPT", "Embeddings", "Prompt Engineering", "Fine-tuning", "Inference", "Training", "Classification", "Regression", "Clustering", "Recommendation", "TensorFlow", "PyTorch", "Scikit-learn"));
        taxonomy.put("Data Science", List.of("Python", "Pandas", "NumPy", "Matplotlib", "Jupyter", "Statistics", "Data Analysis", "Data Cleaning", "Data Visualization", "Exploratory Data Analysis", "Regression", "Classification", "Clustering", "Correlation", "Probability", "Dataset", "Feature Engineering", "Data Preprocessing", "Scikit-learn"));
        taxonomy.put("Git", List.of("Git", "Repository", "Commit", "Branch", "Merge", "Rebase", "Clone", "Pull", "Push", "Fetch", "Stash", "Tag", "Cherry-pick", "Reset", "Revert", "Conflict", "HEAD", "Remote", "Git Config", "Git Log", "Git Diff", "Git Bisect", "Git Hooks"));
        taxonomy.put("GitHub", List.of("Repository", "Pull Request", "Issue", "Actions", "Workflow", "Runner", "Branch Protection", "Code Review", "Fork", "Release", "Tag", "GitHub Pages", "GitHub Projects", "GitHub Packages", "Secrets", "Environments", "Actions Marketplace", "CI/CD", "Dependabot", "CODEOWNERS"));
        taxonomy.put("Architecture logicielle", List.of("Clean Architecture", "Hexagonal Architecture", "Layered Architecture", "MVC", "MVVM", "Microservices", "Monolith", "Modular Monolith", "DDD", "CQRS", "Event Sourcing", "SOLID", "Dependency Injection", "Separation of Concerns", "Design Principles", "Scalability", "Maintainability", "Coupling", "Cohesion"));
        taxonomy.put("Design Patterns", List.of("Singleton", "Factory", "Abstract Factory", "Builder", "Prototype", "Adapter", "Bridge", "Composite", "Decorator", "Facade", "Proxy", "Flyweight", "Strategy", "Observer", "Command", "State", "Template Method", "Iterator", "Mediator", "Memento", "Chain of Responsibility"));
        taxonomy.put("Tests", List.of("Unit Testing", "Integration Testing", "End-to-End Testing", "Regression Testing", "JUnit", "Mockito", "Jest", "PyTest", "Cypress", "Playwright", "Testcontainers", "TDD", "BDD", "Mock", "Stub", "Fixture", "Assertion", "Test Coverage", "Test Case", "Test Suite", "Test Automation"));
        taxonomy.put("Java", List.of("Java", "JVM", "JDK", "JRE", "Maven", "Gradle", "Collections", "Streams", "Lambda", "Generics", "Threads", "Concurrency", "Multithreading", "Exception", "Interface", "Abstract Class", "Inheritance", "Polymorphism", "Encapsulation", "Reflection", "JDBC", "Records", "Sealed Classes", "Virtual Threads"));
        taxonomy.put("Spring", List.of("Spring Boot", "Spring MVC", "Spring Data", "Spring Security", "Spring Cloud", "Spring AI", "Spring Batch", "Spring Web", "Spring Validation", "Spring Actuator", "Dependency Injection", "IoC", "Bean", "REST Controller", "Repository", "Service", "Entity", "JPA", "Hibernate", "JWT", "OAuth2"));
        taxonomy.put("Python", List.of("Python", "PIP", "Virtual Environment", "Venv", "Poetry", "Functions", "Decorators", "Generators", "Iterators", "List Comprehension", "Lambda", "Classes", "Dataclasses", "Exceptions", "Asyncio", "Multithreading", "Multiprocessing", "Type Hints", "PyTest", "FastAPI", "Django", "Flask"));
        taxonomy.put("Docker", List.of("Docker", "Dockerfile", "Image", "Container", "Docker Compose", "Volume", "Network", "Registry", "Docker Hub", "Build", "Run", "Exec", "Logs", "Port Mapping", "Environment Variables", "Multi-stage Build", "Healthcheck", "Container Security", "Docker CLI"));
        taxonomy.put("Kubernetes", List.of("Kubernetes", "Pod", "Deployment", "Service", "Namespace", "ConfigMap", "Secret", "Ingress", "Volume", "Persistent Volume", "StatefulSet", "DaemonSet", "ReplicaSet", "Job", "CronJob", "Helm", "Kubelet", "Kubectl", "Cluster", "Node", "Autoscaling", "HPA", "RBAC"));
        taxonomy.put("Infrastructure as Code", List.of("Terraform", "Ansible", "Pulumi", "CloudFormation", "Infrastructure", "Provisioning", "Automation", "Modules", "Variables", "State", "Backend", "Plan", "Apply", "Destroy", "Inventory", "Playbook", "Role", "Idempotency", "Configuration Management"));
        taxonomy.put("CI/CD", List.of("Continuous Integration", "Continuous Delivery", "Continuous Deployment", "GitHub Actions", "GitLab CI", "Jenkins", "Pipeline", "Workflow", "Runner", "Build", "Test", "Deploy", "Artifact", "Release", "Environment", "Secrets", "Deployment Strategy", "Rollback", "Blue Green Deployment", "Canary Deployment"));
        taxonomy.put("Observabilité", List.of("Monitoring", "Logging", "Metrics", "Tracing", "Prometheus", "Grafana", "Loki", "OpenTelemetry", "Alerting", "Dashboard", "Health Check", "Application Metrics", "System Metrics", "Distributed Tracing", "Log Aggregation", "Performance Monitoring", "Error Tracking"));
        taxonomy.put("Développement mobile", List.of("Android", "Kotlin", "Java", "Flutter", "Dart", "React Native", "Swift", "iOS", "Jetpack Compose", "Android Studio", "Mobile UI", "Navigation", "State Management", "Push Notifications", "Local Storage", "SQLite", "Firebase", "REST API"));
        taxonomy.put("Développement web", List.of("Web", "HTTP", "HTTPS", "Browser", "URL", "Domain", "DNS", "Cookies", "Sessions", "CORS", "WebSocket", "REST", "API", "Authentication", "Authorization", "HTML", "CSS", "JavaScript", "Forms", "Upload", "Cache", "CDN"));
        taxonomy.put("Gestion de projet", List.of("Agile", "Scrum", "Kanban", "Sprint", "Backlog", "User Story", "Epic", "Task", "Issue", "Roadmap", "Planning", "Estimation", "Stand-up", "Retrospective", "Product Backlog", "Sprint Planning", "Scrum Master", "Product Owner"));
        taxonomy.put("Qualité logicielle", List.of("Clean Code", "Code Review", "Refactoring", "SOLID", "Technical Debt", "Code Smell", "Maintainability", "Readability", "Documentation", "Naming", "Complexity", "Static Analysis", "SonarQube", "Linting", "Coding Standards", "Best Practices"));
        taxonomy.put("Systèmes distribués", List.of("Distributed Systems", "Microservices", "Distributed Database", "Message Queue", "Kafka", "RabbitMQ", "Event-driven Architecture", "CAP Theorem", "Consistency", "Availability", "Partition Tolerance", "Replication", "Sharding", "Load Balancing", "Service Discovery", "Distributed Transactions", "Eventual Consistency"));

        taxonomy.forEach((categoryName, tagNames) -> {
            Category category = categories.findByNameIgnoreCase(categoryName)
                    .orElseGet(() -> categories.save(Category.builder()
                            .name(categoryName)
                            .slug(Slugs.uniqueFrom(categoryName, categories::existsBySlug))
                            .build()));
            tagNames.stream()
                    .filter(tagName -> !tags.existsByNameIgnoreCaseAndCategoryId(tagName, category.getId()))
                    .map(tagName -> Tag.builder().name(tagName).category(category).build())
                    .forEach(tags::save);
        });

        log.info("Production taxonomy ensured: {} categories", taxonomy.size());
    }
}
