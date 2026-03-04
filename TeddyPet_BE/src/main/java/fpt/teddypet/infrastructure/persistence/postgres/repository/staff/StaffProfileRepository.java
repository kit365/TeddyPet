package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {

    Optional<StaffProfile> findByUserId(UUID userId);

    @Query("SELECT s FROM StaffProfile s WHERE s.isDeleted = false AND s.isActive = true")
    List<StaffProfile> findAllActive();

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT COUNT(s) > 0 FROM StaffProfile s WHERE s.phoneNumber = :phoneNumber AND s.id != :excludeStaffId")
    boolean existsByPhoneNumberExcludingId(@org.springframework.data.repository.query.Param("phoneNumber") String phoneNumber,
                                           @org.springframework.data.repository.query.Param("excludeStaffId") Long excludeStaffId);

    boolean existsByCitizenId(String citizenId);

    @Query("SELECT COUNT(s) > 0 FROM StaffProfile s WHERE s.citizenId = :citizenId AND s.id != :excludeStaffId")
    boolean existsByCitizenIdExcludingId(@org.springframework.data.repository.query.Param("citizenId") String citizenId,
                                         @org.springframework.data.repository.query.Param("excludeStaffId") Long excludeStaffId);
}

