package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.service.interfaces.RoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of RoleService.
 * Follows Single Responsibility Principle.
 */
@Service
@Transactional
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Role> findByName(RoleName name) {
        return roleRepository.findByName(name);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Override
    public Role save(Role role) {
        return roleRepository.save(role);
    }

    @Override
    public void deleteById(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Role", "id", id);
        }
        roleRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return roleRepository.existsById(id);
    }
}
