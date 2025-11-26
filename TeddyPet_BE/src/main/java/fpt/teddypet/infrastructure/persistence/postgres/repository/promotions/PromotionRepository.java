package fpt.teddypet.infrastructure.persistence.postgres.repository.promotions;
import fpt.teddypet.domain.entity.promotions.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromotionRepository extends JpaRepository<Promotion, UUID> {
    Optional<Promotion> findByCode(String code);
    Optional<Promotion> findByIdAndIsActiveAndIsDeleted(UUID promotionId, boolean isActive, boolean isDeleted);
    List<Promotion> findAllByIsActiveAndIsDeleted(boolean isActive, boolean isDeleted);
    boolean existsByCode(String code);
}
