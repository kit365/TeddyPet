package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.AvatarImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvatarImageRepository extends JpaRepository<AvatarImage, Long> {
    List<AvatarImage> findByCategory(String category);
    List<AvatarImage> findByIsPredefinedTrue();
}
