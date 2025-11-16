package fpt.teddypet.infrastructure.persistence.postgres;

import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final RoleRepository roleRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeRoles();
        initializeUsers();
    }

    private void initializeRoles() {
        // Create USER role if not exists
        if (!roleRepository.existsByName(RoleEnum.USER.name())) {
            Role userRole = Role.builder()
                    .name(RoleEnum.USER.name())
                    .description("Default user role")
                    .build();
            roleRepository.save(userRole);
            log.info("✅ Created {} role", RoleEnum.USER.name());
        }

        // Create ADMIN role if not exists
        if (!roleRepository.existsByName(RoleEnum.ADMIN.name())) {
            Role adminRole = Role.builder()
                    .name(RoleEnum.ADMIN.name())
                    .description("Administrator role")
                    .build();
            roleRepository.save(adminRole);
            log.info("✅ Created {} role", RoleEnum.ADMIN.name());
        }
    }

    private void initializeUsers() {
        // Use repository directly here since we're in infrastructure layer
        // In application layer, use RoleService.getByName() instead
        Role adminRole = roleRepository.findByName(RoleEnum.ADMIN.name())
                .orElseThrow(() -> new RuntimeException("ADMIN role not found. Please initialize roles first."));
        
        Role userRole = roleRepository.findByName(RoleEnum.USER.name())
                .orElseThrow(() -> new RuntimeException("USER role not found. Please initialize roles first."));

        // Create admin user if not exists
        if (!userService.existsByEmail("admin@gmail.com")) {
            User adminUser = User.builder()
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("1"))
                    .fullName("Administrator")
                    .role(adminRole)
                    .isEnabled(true)
                    .isAccountNonLocked(true)
                    .build();
            userService.save(adminUser);
            log.info("✅ Created admin user (email: admin, password: admin)");
        }

        // Create regular user if not exists
        if (!userService.existsByEmail("user@gmail.com")) {
            User regularUser = User.builder()
                    .email("user@gmail.com")
                    .password(passwordEncoder.encode("1"))
                    .fullName("Regular User")
                    .role(userRole)
                    .isEnabled(true)
                    .isAccountNonLocked(true)
                    .build();
            userService.save(regularUser);
            log.info("✅ Created user (email: user, password: user)");
        }
    }
}

