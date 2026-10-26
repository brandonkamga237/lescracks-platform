package com.brandonkamga.lescracks;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/**
 * The architecture of .claude/skills/design-patterns, checked rather than hoped for. A module
 * joins the lists below once it follows the skeleton; the lists only grow.
 */
class ArchitectureTest {

    private static final String ROOT = "com.brandonkamga.lescracks";

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages(ROOT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"account", "member", "newsletter", "engagement", "taxonomy", "content", "event", "recognition"})
    @DisplayName("a module's domain and use cases are plain Java: no framework, persistence, web or infrastructure")
    void coreIsPlainJava(String module) {
        noClasses().that().resideInAnyPackage(ROOT + "." + module + ".domain..", ROOT + "." + module + ".application..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "org.springframework..", "jakarta.persistence..", "jakarta.servlet..", "org.hibernate..",
                        "io.micrometer..", ROOT + "." + module + ".infra..", ROOT + "." + module + ".api..")
                .because("the core declares ports and adapters in infra implement them")
                .check(classes);
    }

    @ParameterizedTest
    @ValueSource(strings = {"account", "member", "newsletter", "engagement", "taxonomy", "content", "event", "recognition"})
    @DisplayName("the parts of a module's domain depend on each other in one direction only")
    void domainHasNoCycles(String module) {
        slices().matching(ROOT + "." + module + ".domain.(*)..").should().beFreeOfCycles().check(classes);
    }

    @ParameterizedTest
    @ValueSource(strings = {"account", "member", "newsletter", "engagement", "taxonomy", "content", "event", "recognition"})
    @DisplayName("a migrated module persists in plain SQL: no JPA, no Spring Data JPA, no Hibernate anywhere in it")
    void noOrm(String module) {
        noClasses().that().resideInAPackage(ROOT + "." + module + "..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "jakarta.persistence..", "org.springframework.data.jpa..", "org.hibernate..")
                .check(classes);
    }

    @ParameterizedTest
    @ValueSource(strings = {"account", "member", "newsletter", "engagement", "taxonomy", "content", "event", "recognition"})
    @DisplayName("other modules reach a migrated module through its application layer, never its ports or adapters")
    void portsAndAdaptersStayInside(String module) {
        noClasses().that().resideOutsideOfPackage(ROOT + "." + module + "..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        ROOT + "." + module + ".domain.port..", ROOT + "." + module + ".infra..")
                .check(classes);
    }

    @Test
    @DisplayName("shared holds building blocks only: it never reaches into a module's adapters or controllers")
    void sharedNeverDependsOnAModulesInfraOrApi() {
        noClasses().that().resideInAPackage(ROOT + ".shared..")
                .should().dependOnClassesThat().resideInAnyPackage(ROOT + ".(*).infra..", ROOT + ".(*).api..")
                .check(classes);
    }

    // stats still builds its HTTP payloads in its service: it joins this list when its step of
    // the migration removes that.
    @ParameterizedTest
    @ValueSource(strings = {"account", "member", "newsletter", "engagement", "taxonomy", "content", "event", "recognition", "mail", "storage"})
    @DisplayName("a module's domain knows nothing about HTTP payloads or controllers, its own or another's")
    void domainNeverReachesAnApi(String module) {
        noClasses().that().resideInAPackage(ROOT + "." + module + ".domain..")
                .should().dependOnClassesThat().resideInAPackage(ROOT + ".(*).api..")
                .check(classes);
    }
}
