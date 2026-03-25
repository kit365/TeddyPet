package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@Order(1) // Run first
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Value("${data.init.admin.password:1}")
    private String adminPassword;

    @Value("${data.init.staff.password:1}")
    private String staffPassword;

    @Value("${data.init.user.password:1}")
    private String userPassword;

    @Value("${data.init.enabled:true}")
    private boolean isDataInitEnabled;

    @Override
    public void run(String... args) {
        if (!isDataInitEnabled) {
            log.info("⏭️ Data initialization is disabled.");
            return;
        }
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

        // Create STAFF role if not exists
        if (!roleRepository.existsByName(RoleEnum.STAFF.name())) {
            Role staffRole = Role.builder()
                    .name(RoleEnum.STAFF.name())
                    .description("Staff role for shop employees")
                    .build();
            roleRepository.save(staffRole);
            log.info("✅ Created {} role", RoleEnum.STAFF.name());
        }

        // Create SUPER_ADMIN role if not exists
        if (!roleRepository.existsByName(RoleEnum.SUPER_ADMIN.name())) {
            Role superAdminRole = Role.builder()
                    .name(RoleEnum.SUPER_ADMIN.name())
                    .description("Super Administrator role")
                    .build();
            roleRepository.save(superAdminRole);
            log.info("✅ Created {} role", RoleEnum.SUPER_ADMIN.name());
        }
    }

    private void initializeUsers() {
        Role adminRole = roleRepository.findByName(RoleEnum.ADMIN.name())
                .orElseThrow(() -> new RuntimeException("ADMIN role not found. Please initialize roles first."));

        Role userRole = roleRepository.findByName(RoleEnum.USER.name())
                .orElseThrow(() -> new RuntimeException("USER role not found. Please initialize roles first."));

        Role staffRole = roleRepository.findByName(RoleEnum.STAFF.name())
                .orElseThrow(() -> new RuntimeException("STAFF role not found. Please initialize roles first."));

        Role superAdminRole = roleRepository.findByName(RoleEnum.SUPER_ADMIN.name())
                .orElseThrow(() -> new RuntimeException("SUPER_ADMIN role not found. Please initialize roles first."));

        // Manage admin@gmail.com - Ensure it exists and has SUPER_ADMIN role
        Optional<User> adminOpt = userService.findByEmail("admin@gmail.com");
        if (adminOpt.isPresent()) {
            User existingAdmin = adminOpt.get();
            if (!existingAdmin.getRole().getName().equals(RoleEnum.SUPER_ADMIN.name())) {
                existingAdmin.setRole(superAdminRole);
                userService.save(existingAdmin);
                log.info("✅ Updated admin user to SUPER_ADMIN (email: admin@gmail.com)");
            }
        } else {
            User adminUser = User.builder()
                    .username("admin")
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode(adminPassword))
                    .firstName("Administrator")
                    .lastName("TeddyPet")
                    .phoneNumber("0123456789")
                    .gender(fpt.teddypet.domain.enums.GenderEnum.MALE)
                    .dateOfBirth(java.time.LocalDate.of(1990, 1, 1))
                    .role(superAdminRole)
                    .build();
            userService.save(adminUser);
            log.info("✅ Created admin user (email: admin@gmail.com) with SUPER_ADMIN role");
        }

        // Create regular user if not exists
        if (!userService.existsByEmail("user@gmail.com")) {
            User regularUser = User.builder()
                    .username("user")
                    .email("user@gmail.com")
                    .password(passwordEncoder.encode(userPassword))
                    .firstName("Regular")
                    .lastName("User")
                    .phoneNumber("0987654321")
                    .gender(fpt.teddypet.domain.enums.GenderEnum.FEMALE)
                    .dateOfBirth(java.time.LocalDate.of(1995, 5, 5))
                    .role(userRole)
                    .build();
            userService.save(regularUser);
            log.info("✅ Created user (email: user@gmail.com)");
        }

        // Create staff user if not exists
        if (!userService.existsByEmail("staff@gmail.com")) {
            User staffUser = User.builder()
                    .username("staff")
                    .email("staff@gmail.com")
                    .password(passwordEncoder.encode(staffPassword))
                    .firstName("Staff")
                    .lastName("TeddyPet")
                    .phoneNumber("0912345678")
                    .gender(fpt.teddypet.domain.enums.GenderEnum.MALE)
                    .dateOfBirth(java.time.LocalDate.of(1992, 2, 2))
                    .role(staffRole)
                    .build();
            userService.save(staffUser);
            log.info("✅ Created staff user (email: staff@gmail.com)");
        }
    }
}
