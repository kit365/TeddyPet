package fpt.teddypet.application.port.input;

import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.enums.RoleEnum;

public interface RoleService {
    Role findByName(String name);
    Role getDefaultRole();
    Role create(RoleEnum roleEnum);
}

