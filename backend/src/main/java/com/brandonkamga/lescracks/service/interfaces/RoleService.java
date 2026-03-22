package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for Role operations.
 * Follows Interface Segregation Principle.
 */
public interface RoleService {

    /**
     * Find a role by its ID.
     *
     * @param id the role ID
     * @return the role if found
     */
    Optional<Role> findById(Long id);

    /**
     * Find a role by its name.
     *
     * @param name the role name
     * @return the role if found
     */
    Optional<Role> findByName(RoleName name);

    /**
     * Find all roles.
     *
     * @return list of all roles
     */
    List<Role> findAll();

    /**
     * Save a role.
     *
     * @param role the role to save
     * @return the saved role
     */
    Role save(Role role);

    /**
     * Delete a role by its ID.
     *
     * @param id the role ID
     */
    void deleteById(Long id);

    /**
     * Check if a role exists by ID.
     *
     * @param id the role ID
     * @return true if exists, false otherwise
     */
    boolean existsById(Long id);
}
