package fpt.teddypet.application.port.output;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.enums.RoleEnum;
import java.util.Optional;


public interface RoleRepositoryPort {
    
    Optional<Role> findByName(String name);
    
    Role save(Role role);
    
    Optional<Role> findByEnum(RoleEnum roleEnum);
}

