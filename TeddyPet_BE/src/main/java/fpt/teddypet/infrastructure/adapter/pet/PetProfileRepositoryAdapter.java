package fpt.teddypet.infrastructure.adapter.pet;

import fpt.teddypet.application.port.output.pet.PetProfileRepositoryPort;
import fpt.teddypet.domain.entity.PetProfile;
import fpt.teddypet.infrastructure.persistence.postgres.repository.PetProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PetProfileRepositoryAdapter implements PetProfileRepositoryPort {

    private final PetProfileRepository petProfileRepository;

    @Override
    public List<PetProfile> findByUserId(UUID userId) {
        return petProfileRepository.findByUserId(userId);
    }

    @Override
    public Optional<PetProfile> findById(Long id) {
        return petProfileRepository.findById(id);
    }

    @Override
    public Optional<PetProfile> findByIdAndUserId(Long id, UUID userId) {
        return petProfileRepository.findByIdAndUserId(id, userId);
    }

    @Override
    public PetProfile save(PetProfile petProfile) {
        return petProfileRepository.save(petProfile);
    }

    @Override
    public void deleteById(Long id) {
        petProfileRepository.deleteById(id);
    }
}
