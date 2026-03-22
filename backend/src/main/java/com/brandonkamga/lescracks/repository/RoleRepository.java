package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;


@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    Optional<Role> findById(Long id);

    Optional<Role> findByName(RoleName name);

}
