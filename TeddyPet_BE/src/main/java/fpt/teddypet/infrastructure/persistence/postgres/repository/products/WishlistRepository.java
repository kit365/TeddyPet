package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Page<Wishlist> findByUserId(UUID userId, Pageable pageable);

    Optional<Wishlist> findByUserIdAndProductId(UUID userId, Long productId);

    boolean existsByUserIdAndProductId(UUID userId, Long productId);

    void deleteByUserIdAndProductId(UUID userId, Long productId);
}
