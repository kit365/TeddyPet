package fpt.teddypet.infrastructure.persistence.postgres.repository.user;

import fpt.teddypet.domain.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findAllByUserId(UUID userId);

    Optional<UserAddress> findByUserIdAndDefaultAddressTrue(UUID userId);

    boolean existsByUserIdAndAddressIgnoreCaseAndPhone(UUID userId, String address, String phone);

    @Modifying
    @Query("UPDATE UserAddress ua SET ua.defaultAddress = false WHERE ua.user.id = :userId")
    void unsetDefaultAddress(@Param("userId") UUID userId);
}
