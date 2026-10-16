package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserSearch;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** Builds the user list query from the back-office filters, adding only the filters that are set. */
public final class UserSpecifications {
    private UserSpecifications() {
    }

    public static Specification<User> matching(UserSearch search) {
        return (root, query, cb) -> {
            List<Predicate> filters = new ArrayList<>();
            if (search.text() != null && !search.text().isBlank()) {
                String like = "%" + search.text().trim().toLowerCase() + "%";
                filters.add(cb.or(cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("firstName")), like),
                        cb.like(cb.lower(root.get("lastName")), like)));
            }
            if (search.kind() == UserSearch.Kind.MEMBER) filters.add(canSignIn(root, cb));
            if (search.kind() == UserSearch.Kind.CONTACT) filters.add(cb.not(canSignIn(root, cb)));
            if (search.verified() != null) filters.add(cb.equal(root.get("emailVerified"), search.verified()));
            return cb.and(filters.toArray(Predicate[]::new));
        };
    }

    /** Same rule as {@link User#hasLoginMethod()} and {@link UserRepository#MEMBER}. */
    private static Predicate canSignIn(Root<User> root, CriteriaBuilder cb) {
        return cb.or(cb.isNotNull(root.get("passwordHash")), cb.notEqual(root.get("provider"), AuthProvider.LOCAL));
    }
}
