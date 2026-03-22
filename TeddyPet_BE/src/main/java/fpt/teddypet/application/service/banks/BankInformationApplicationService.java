package fpt.teddypet.application.service.banks;

import fpt.teddypet.application.dto.request.banks.SetDefaultBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.VerifyBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.banks.BankInformationService;
import fpt.teddypet.domain.entity.BankInformation;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.banks.VietnamBankEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BankInformationApplicationService implements BankInformationService {

    private final BankInformationRepository bankInformationRepository;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<BankInformationResponse> getMyBanks() {
        UUID userId = authService.getCurrentUser().getId();
        return bankInformationRepository.findByUserIdNotDeleted(userId).stream().map(this::toResponse).toList();
    }

    @Override
    public BankInformationResponse createMyBank(UpsertBankInformationRequest request) {
        UUID userId = authService.getCurrentUser().getId();
        VietnamBankEnum bank = VietnamBankEnum.fromCode(request.bankCode())
                .orElseThrow(() -> new IllegalArgumentException("bankCode không hợp lệ."));

        BankInformation entity = BankInformation.builder()
                .userId(userId)
                .bookingId(null)
                .accountType("CUSTOMER")
                .accountNumber(request.accountNumber().trim())
                .accountHolderName(request.accountHolderName().trim())
                .bankCode(bank.getBankCode())
                .bankName(bank.getBankName())
                .isVerify(false)
                .isDefault(false)
                .note(request.note())
                .isActive(true)
                .isDeleted(false)
                .build();

        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public BankInformationResponse updateMyBank(Long id, UpsertBankInformationRequest request) {
        UUID userId = authService.getCurrentUser().getId();
        BankInformation entity = bankInformationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bank information."));

        if (entity.getUserId() == null || !entity.getUserId().equals(userId)) {
            throw new AccessDeniedException("Không có quyền chỉnh sửa tài khoản này.");
        }

        if (entity.isDeleted()) {
            throw new IllegalArgumentException("Tài khoản đã bị xóa.");
        }

        VietnamBankEnum bank = VietnamBankEnum.fromCode(request.bankCode())
                .orElseThrow(() -> new IllegalArgumentException("bankCode không hợp lệ."));

        // Nếu đổi số tài khoản hoặc ngân hàng thì reset verify
        if (!entity.getAccountNumber().equals(request.accountNumber().trim()) ||
                !entity.getBankCode().equals(bank.getBankCode())) {
            entity.setVerify(false);
        }

        entity.setAccountNumber(request.accountNumber().trim());
        entity.setAccountHolderName(request.accountHolderName().trim());
        entity.setBankCode(bank.getBankCode());
        entity.setBankName(bank.getBankName());
        entity.setNote(request.note());

        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public BankInformationResponse setMyDefault(Long bankInfoId, SetDefaultBankInformationRequest request) {
        UUID userId = authService.getCurrentUser().getId();
        BankInformation entity = bankInformationRepository.findById(bankInfoId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bank information."));
        if (entity.getUserId() == null || !entity.getUserId().equals(userId)) {
            throw new AccessDeniedException("Không có quyền.");
        }
        if (Boolean.TRUE.equals(request.isDefault())) {
            // Phải gỡ default các TK khác TRƯỚC khi set default=true cho bản ghi này,
            // vì index uq_bank_information_default_per_user chỉ cho tối đa 1 dòng is_default=true / user_id.
            bankInformationRepository.unsetOtherDefaults(userId, entity.getId());
            entity.setDefault(true);
            entity = bankInformationRepository.save(entity);
        } else {
            entity.setDefault(false);
            entity = bankInformationRepository.save(entity);
        }
        return toResponse(entity);
    }

    @Override
    public BankInformationResponse verifyBank(Long bankInfoId, VerifyBankInformationRequest request) {
        // staff/admin only, enforced at controller with @PreAuthorize
        BankInformation entity = bankInformationRepository.findById(bankInfoId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bank information."));
        entity.setVerify(Boolean.TRUE.equals(request.isVerify()));
        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public BankInformationResponse createGuestBankForBookingCode(String bookingCode, UpsertBankInformationRequest request) {
        if (bookingCode == null || bookingCode.isBlank()) {
            throw new IllegalArgumentException("bookingCode là bắt buộc.");
        }
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking với mã: " + bookingCode));



        VietnamBankEnum bank = VietnamBankEnum.fromCode(request.bankCode())
                .orElseThrow(() -> new IllegalArgumentException("bankCode không hợp lệ."));

        String userEmail = request.userEmail() != null && !request.userEmail().isBlank() ? request.userEmail().trim() : null;
        BankInformation entity = BankInformation.builder()
                .userId(null)
                .bookingId(booking.getId())
                .accountType("GUEST")
                .userEmail(userEmail)
                .accountNumber(request.accountNumber().trim())
                .accountHolderName(request.accountHolderName().trim())
                .bankCode(bank.getBankCode())
                .bankName(bank.getBankName())
                .isVerify(false)
                .isDefault(false)
                .note(request.note())
                .isActive(true)
                .isDeleted(false)
                .build();

        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public BankInformationResponse createGuestBankForOrderCode(String orderCode, UpsertBankInformationRequest request) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new IllegalArgumentException("orderCode là bắt buộc.");
        }
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với mã: " + orderCode));

        VietnamBankEnum bank = VietnamBankEnum.fromCode(request.bankCode())
                .orElseThrow(() -> new IllegalArgumentException("bankCode không hợp lệ."));

        String userEmail = request.userEmail() != null && !request.userEmail().isBlank() ? request.userEmail().trim() : null;
        BankInformation entity = BankInformation.builder()
                .userId(null)
                .orderId(order.getId())
                .accountType("GUEST")
                .userEmail(userEmail)
                .accountNumber(request.accountNumber().trim())
                .accountHolderName(request.accountHolderName().trim())
                .bankCode(bank.getBankCode())
                .bankName(bank.getBankName())
                .isVerify(false)
                .isDefault(false)
                .note(request.note())
                .isActive(true)
                .isDeleted(false)
                .build();

        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BankInformationResponse getBankForBookingCode(String bookingCode) {
        if (bookingCode == null || bookingCode.isBlank()) {
            throw new IllegalArgumentException("bookingCode là bắt buộc.");
        }
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking với mã: " + bookingCode));

        // 1. Lấy bank info theo booking_id trước (nếu khách đã nhập)
        var bankByBooking = bankInformationRepository.findByBookingIdNotDeleted(booking.getId()).stream()
                .findFirst()
                .map(this::toResponse);
        if (bankByBooking.isPresent()) {
            return bankByBooking.get();
        }

        // 2. Fallback: Lấy default bank info theo user_id (nếu booking có user)
        if (booking.getUser() != null && booking.getUser().getId() != null) {
            var byUser = bankInformationRepository.findDefaultByUserId(booking.getUser().getId())
                    .map(this::toResponse)
                    .orElse(null);
            if (byUser != null) return byUser;
        }

        // 3. Fallback: Lấy thông tin chuyển khoản đã lưu theo email khách (guest) để hiển thị lại
        String guestEmail = booking.getCustomerEmail();
        if (guestEmail != null && !guestEmail.isBlank()) {
            return bankInformationRepository.findByUserEmailAndAccountTypeAndIsDeletedFalseOrderByUpdatedAtDesc(
                            guestEmail.trim(), "GUEST").stream()
                    .findFirst()
                    .map(this::toResponse)
                    .orElse(null);
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public BankInformationResponse getBankByGuestEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return bankInformationRepository.findByUserEmailAndAccountTypeAndIsDeletedFalseOrderByUpdatedAtDesc(email.trim(), "GUEST")
                .stream()
                .findFirst()
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public BankInformationResponse getBankForOrderId(String orderId) {
        if (orderId == null || orderId.isBlank()) return null;
        UUID uuid;
        try {
            uuid = UUID.fromString(orderId);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("orderId không hợp lệ.");
        }
        return bankInformationRepository.findByOrderIdAndIsDeletedFalseOrderByUpdatedAtDesc(uuid)
                .stream()
                .findFirst()
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankInformationResponse> getAllForVerify(Boolean verifiedOnly) {
        List<BankInformation> list;
        if (verifiedOnly == null) {
            list = bankInformationRepository.findAllUserCreatedNotDeleted();
        } else {
            list = bankInformationRepository.findAllUserCreatedByVerify(Boolean.TRUE.equals(verifiedOnly));
        }
        return list.stream().map(this::toResponse).toList();
    }

    private BankInformationResponse toResponse(BankInformation b) {
        return new BankInformationResponse(
                b.getId(),
                b.getAccountNumber(),
                b.getAccountHolderName(),
                b.getBankCode(),
                b.getBankName(),
                b.isVerify(),
                b.isDefault(),
                b.getNote(),
                b.getBookingId(),
                b.getOrderId(),
                b.getAccountType(),
                b.getUserId() != null ? b.getUserId().toString() : null,
                b.getUserEmail(),
                b.getVietqrImageUrl(),
                b.getCreatedAt(),
                b.getUpdatedAt());
    }
}
