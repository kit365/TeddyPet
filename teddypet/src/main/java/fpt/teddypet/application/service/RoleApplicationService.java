package fpt.teddypet.application.service;

import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.output.RoleRepositoryPort;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.enums.RoleEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleApplicationService implements RoleService {

    private final RoleRepositoryPort roleRepositoryPort;

    @Override
    public Role findByName(String name) {
        return roleRepositoryPort.findByName(name)
                .orElseThrow(() -> new EntityNotFoundException("Role not found with name: " + name));
    }

    @Override
    public Role getDefaultRole() {
        try {
            return findByName(RoleEnum.USER.name());
        } catch (EntityNotFoundException e) {
            return create(RoleEnum.USER);
        }
    }

    @Override
    public Role create(RoleEnum roleEnum) {
        Role newRole = Role.builder()
                .name(roleEnum.name())
                .description("Role: " + roleEnum.name())
                .build();
        return roleRepositoryPort.save(newRole);
    }
}

