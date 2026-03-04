package fpt.teddypet.application.service.pet;

import fpt.teddypet.application.dto.request.pet.PetProfileRequest;
import fpt.teddypet.application.dto.response.pet.PetProfileResponse;
import fpt.teddypet.application.port.input.pet.PetProfileService;
import fpt.teddypet.application.port.output.pet.PetProfileRepositoryPort;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.AvatarImage;
import fpt.teddypet.domain.entity.PetProfile;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.infrastructure.persistence.postgres.repository.AvatarImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PetProfileApplicationService implements PetProfileService {

    private final PetProfileRepositoryPort petProfileRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;
    private final AvatarImageRepository avatarImageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PetProfileResponse> getByUserId(UUID userId) {
        List<PetProfile> list = petProfileRepositoryPort.findByUserId(userId);
        return list.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PetProfileResponse getById(Long id, UUID userId) {
        PetProfile pet = petProfileRepositoryPort.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thú cưng."));
        return toResponse(pet);
    }

    @Override
    @Transactional
    public PetProfileResponse create(UUID userId, PetProfileRequest request) {
        User user = userRepositoryPort.getById(userId);
        AvatarImage avatarImage = resolveAvatarImage(request.avatarUrl(), request.name());
        String altImage = request.avatarUrl() != null && !request.avatarUrl().isBlank()
                ? ("Ảnh đại diện " + (request.name() != null ? request.name() : "thú cưng"))
                : null;
        PetProfile pet = PetProfile.builder()
                .user(user)
                .name(request.name())
                .petType(request.petType())
                .breed(request.breed())
                .gender(request.gender())
                .birthDate(request.birthDate())
                .weight(request.weight())
                .avatarUrl(request.avatarUrl())
                .altImage(altImage)
                .avatarImage(avatarImage)
                .isNeutered(request.isNeutered())
                .healthNote(request.healthNote())
                .build();
        pet = petProfileRepositoryPort.save(pet);
        return toResponse(pet);
    }

    @Override
    @Transactional
    public PetProfileResponse update(Long id, UUID userId, PetProfileRequest request) {
        PetProfile pet = petProfileRepositoryPort.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thú cưng."));
        pet.setName(request.name());
        pet.setPetType(request.petType());
        pet.setBreed(request.breed());
        pet.setGender(request.gender());
        pet.setBirthDate(request.birthDate());
        pet.setWeight(request.weight());
        AvatarImage avatarImage = resolveAvatarImage(request.avatarUrl(), request.name());
        pet.setAvatarImage(avatarImage);
        pet.setAvatarUrl(request.avatarUrl());
        String altImage = request.avatarUrl() != null && !request.avatarUrl().isBlank()
                ? ("Ảnh đại diện " + (request.name() != null ? request.name() : "thú cưng"))
                : null;
        pet.setAltImage(altImage);
        pet.setIsNeutered(request.isNeutered());
        pet.setHealthNote(request.healthNote());
        pet = petProfileRepositoryPort.save(pet);
        return toResponse(pet);
    }

    @Override
    @Transactional
    public void delete(Long id, UUID userId) {
        PetProfile pet = petProfileRepositoryPort.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thú cưng."));
        petProfileRepositoryPort.deleteById(pet.getId());
    }

    private PetProfileResponse toResponse(PetProfile p) {
        String avatarUrl = p.getAvatarUrl();
        if (avatarUrl == null && p.getAvatarImage() != null) {
            avatarUrl = p.getAvatarImage().getImageUrl();
        }
        return new PetProfileResponse(
                p.getId(),
                p.getUser().getId(),
                p.getName(),
                p.getPetType(),
                p.getBreed(),
                p.getGender(),
                p.getBirthDate(),
                p.getWeight(),
                avatarUrl,
                p.getIsNeutered(),
                p.getHealthNote()
        );
    }

    /**
     * Nếu có avatarUrl thì tạo bản ghi avatar_images và trả về entity; không thì trả về null.
     */
    private AvatarImage resolveAvatarImage(String avatarUrl, String petName) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }
        AvatarImage avatar = AvatarImage.builder()
                .imageUrl(avatarUrl.trim())
                .altText(petName != null ? "Ảnh đại diện " + petName : "Pet avatar")
                .category("PET")
                .isPredefined(false)
                .build();
        return avatarImageRepository.save(avatar);
    }
}
