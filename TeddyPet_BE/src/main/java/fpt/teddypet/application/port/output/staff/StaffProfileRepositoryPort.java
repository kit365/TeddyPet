package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffProfileRepositoryPort {

    StaffProfile save(StaffProfile staffProfile);

    Optional<StaffProfile> findById(Long id);

    Optional<StaffProfile> findByUserId(UUID userId);

    List<StaffProfile> findAllActive();

    List<StaffProfile> findAllActiveByPositionIdAndEmploymentType(Long positionId, EmploymentTypeEnum employmentType);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberExcludingId(String phoneNumber, Long excludeStaffId);

    boolean existsByCitizenId(String citizenId);

    boolean existsByCitizenIdExcludingId(String citizenId, Long excludeStaffId);
}

