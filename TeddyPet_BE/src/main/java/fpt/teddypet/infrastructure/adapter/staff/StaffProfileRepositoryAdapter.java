package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StaffProfileRepositoryAdapter implements StaffProfileRepositoryPort {

    private final StaffProfileRepository staffProfileRepository;

    @Override
    public StaffProfile save(StaffProfile staffProfile) {
        return staffProfileRepository.save(staffProfile);
    }

    @Override
    public Optional<StaffProfile> findById(Long id) {
        return staffProfileRepository.findById(id);
    }

    @Override
    public Optional<StaffProfile> findByUserId(UUID userId) {
        return staffProfileRepository.findByUserId(userId);
    }

    @Override
    public List<StaffProfile> findAllActive() {
        return staffProfileRepository.findAllActive();
    }

    @Override
    public List<StaffProfile> findAllActiveByPositionIdAndEmploymentType(Long positionId, EmploymentTypeEnum employmentType) {
        return staffProfileRepository.findAllActiveByPositionIdAndEmploymentType(positionId, employmentType);
    }

    @Override
    public boolean existsByEmail(String email) {
        return staffProfileRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return staffProfileRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    public boolean existsByPhoneNumberExcludingId(String phoneNumber, Long excludeStaffId) {
        return staffProfileRepository.existsByPhoneNumberExcludingId(phoneNumber, excludeStaffId);
    }

    @Override
    public boolean existsByCitizenId(String citizenId) {
        return staffProfileRepository.existsByCitizenId(citizenId);
    }

    @Override
    public boolean existsByCitizenIdExcludingId(String citizenId, Long excludeStaffId) {
        return staffProfileRepository.existsByCitizenIdExcludingId(citizenId, excludeStaffId);
    }
}

