package fpt.teddypet.infrastructure.persistence.postgres.repository.user;

import fpt.teddypet.domain.entity.BankInformation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankInformationRepository extends JpaRepository<BankInformation, Long> {

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.userId = :userId
            order by b.isDefault desc, b.createdAt desc
            """)
    List<BankInformation> findByUserIdNotDeleted(@Param("userId") UUID userId);

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.userId = :userId and b.isDefault = true
            """)
    Optional<BankInformation> findDefaultByUserId(@Param("userId") UUID userId);

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.bookingId = :bookingId
            order by b.createdAt desc
            """)
    List<BankInformation> findByBookingIdNotDeleted(@Param("bookingId") Long bookingId);

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.userId is not null
            order by b.isVerify asc, b.createdAt desc
            """)
    List<BankInformation> findAllUserCreatedNotDeleted();

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.userId is not null and b.isVerify = :isVerify
            order by b.createdAt desc
            """)
    List<BankInformation> findAllUserCreatedByVerify(@Param("isVerify") boolean isVerify);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update BankInformation b
            set b.isDefault = false
            where b.userId = :userId and b.isDeleted = false and b.isDefault = true and b.id <> :keepId
            """)
    int unsetOtherDefaults(@Param("userId") UUID userId, @Param("keepId") Long keepId);

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.accountType = :accountType
            """)
    Optional<BankInformation> findByAccountTypeAndIsDeletedFalse(@Param("accountType") String accountType);

    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.userEmail = :userEmail and b.accountType = :accountType
            order by b.updatedAt desc
            """)
    List<BankInformation> findByUserEmailAndAccountTypeAndIsDeletedFalseOrderByUpdatedAtDesc(
            @Param("userEmail") String userEmail,
            @Param("accountType") String accountType);

    /** Tìm bản ghi bank_information gắn với đơn hàng (vd: từ PayOS webhook) để cập nhật khi trùng order. */
    @Query("""
            select b from BankInformation b
            where b.isDeleted = false and b.orderId = :orderId
            order by b.updatedAt desc
            """)
    List<BankInformation> findByOrderIdAndIsDeletedFalseOrderByUpdatedAtDesc(@Param("orderId") UUID orderId);

    List<BankInformation> findByAccountNumberAndBankCodeAndUserIdAndIsDeletedFalse(
            String accountNumber, String bankCode, UUID userId);

    List<BankInformation> findByAccountNumberAndBankCodeAndUserEmailAndIsDeletedFalse(
            String accountNumber, String bankCode, String userEmail);
}

