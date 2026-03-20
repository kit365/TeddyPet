package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    /** Số tài khoản quản trị (ADMIN, STAFF, SUPER_ADMIN). */
    long countByRole_NameIn(Collection<String> roleNames);

    /** Đếm người dùng theo tên vai trò. */
    long countByRole_Name(String roleName);

    /** Đếm người dùng theo vai trò và thời gian. */
    long countByRole_NameAndCreatedAtBetween(String roleName, java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByRole_NameAndCreatedAtAfter(String roleName, java.time.LocalDateTime start);
    long countByRole_NameAndCreatedAtBefore(String roleName, java.time.LocalDateTime end);

    /** Tìm người dùng theo tên vai trò. */
    java.util.List<User> findByRole_Name(String roleName);
}
