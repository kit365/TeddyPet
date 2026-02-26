package fpt.teddypet.application.port.output.pet;

import fpt.teddypet.domain.entity.PetProfile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PetProfileRepositoryPort {

    List<PetProfile> findByUserId(UUID userId);

    Optional<PetProfile> findById(Long id);

    Optional<PetProfile> findByIdAndUserId(Long id, UUID userId);

    PetProfile save(PetProfile petProfile);

    void deleteById(Long id);
}
