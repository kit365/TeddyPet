package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.AgeRange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgeRangeRepository extends JpaRepository<AgeRange, Long> {
    Optional<AgeRange> findByName(String name);
    boolean existsByName(String name);
}

