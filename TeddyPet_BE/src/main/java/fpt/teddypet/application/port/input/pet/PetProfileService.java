package fpt.teddypet.application.port.input.pet;

import fpt.teddypet.application.dto.request.pet.PetProfileRequest;
import fpt.teddypet.application.dto.response.pet.PetProfileResponse;

import java.util.List;
import java.util.UUID;

public interface PetProfileService {

    List<PetProfileResponse> getByUserId(UUID userId);

    PetProfileResponse getById(Long id, UUID userId);

    PetProfileResponse create(UUID userId, PetProfileRequest request);

    PetProfileResponse update(Long id, UUID userId, PetProfileRequest request);

    void delete(Long id, UUID userId);
}
