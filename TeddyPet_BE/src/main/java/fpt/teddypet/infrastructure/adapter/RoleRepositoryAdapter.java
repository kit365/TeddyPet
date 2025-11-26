package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.RoleRepositoryPort;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Adapter for Role repository operations
 * Implements RoleRepositoryPort and delegates to Spring Data JPA repository
 */
@Component
@RequiredArgsConstructor
public class RoleRepositoryAdapter implements RoleRepositoryPort {

    private final RoleRepository roleRepository;

    @Override
    public Optional<Role> findByName(String name) {
        return roleRepository.findByName(name);
    }

    @Override
    public Role save(Role role) {
        return roleRepository.save(role);
    }

    @Override
    public Optional<Role> findByEnum(RoleEnum roleEnum) {
        return roleRepository.findByName(roleEnum.name());
    }
}

