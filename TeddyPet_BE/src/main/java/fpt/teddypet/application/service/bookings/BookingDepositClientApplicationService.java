package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetServiceRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositIntentResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositPayosResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositClientService;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.application.port.output.EmailServicePort;
import lombok.extern.slf4j.Slf4j;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.BankInformation;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingDeposit;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.PetProfile;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.entity.UserAddress;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.domain.exception.BookingValidationException;
import fpt.teddypet.infrastructure.adapter.payment.PayosGatewayAdapter;
import fpt.teddypet.infrastructure.persistence.postgres.repository.PetProfileRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.UserAddressRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BookingDepositClientApplicationService implements BookingDepositClientService {

    private static final int HOLD_MINUTES = 5;

    private final BookingDepositRepository bookingDepositRepository;
    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final BookingRepository bookingRepository;
    private final BookingClientService bookingClientService;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final ObjectMapper objectMapper;
    private final EmailServicePort emailServicePort;
    private final PayosGatewayAdapter payosGatewayAdapter;
    private final UserAddressRepository userAddressRepository;
    private final PetProfileRepository petProfileRepository;
    private final BankInformationRepository bankInformationRepository;
    private final fpt.teddypet.application.port.output.payment.PaymentOrderCodePort paymentOrderCodePort;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public CreateBookingDepositIntentResponse createDepositIntent(CreateBookingRequest request) {
        if (request.pets() == null || request.pets().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một thú cưng và dịch vụ.");
        }
        if (request.bookingType() != null
                && BookingTypeEnum.WALK_IN.name().equalsIgnoreCase(request.bookingType().trim())) {
            throw new IllegalArgumentException("Đặt lịch tại quầy không áp dụng giữ chỗ/thanh toán cọc.");
        }

        // validate service active (main + add-on)
        validateServicesActive(request);

        // reserve resources (rooms / time slots) for 5 minutes
        ObjectNode holdPayload = reserveResources(request);

        // tạo booking tạm thời (không tăng currentBookings lần nữa)
        CreateBookingResponse bookingResponse = bookingClientService.createBookingWithoutTimeSlotIncrement(request);
        Booking booking = bookingRepository.findByBookingCode(bookingResponse.bookingCode())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy booking với mã: " + bookingResponse.bookingCode()));
        booking.setIsTemporary(true);
        bookingRepository.save(booking);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_MINUTES);

        try {
            String holdPayloadJson = objectMapper.writeValueAsString(holdPayload);

            BookingDeposit deposit = BookingDeposit.builder()
                    .bookingId(booking.getId())
                    .bookingCode(booking.getBookingCode())
                    .status("PENDING")
                    .expiresAt(expiresAt)
                    .holdPayloadJson(holdPayloadJson)
                    .build();

            BookingDeposit saved = bookingDepositRepository.save(deposit);

            if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                emailServicePort.sendBookingPendingDepositEmail(booking.getCustomerEmail(), booking.getBookingCode());
            }

            return new CreateBookingDepositIntentResponse(
                    saved.getId(),
                    saved.getExpiresAt(),
                    booking.getId(),
                    booking.getBookingCode());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo giữ chỗ: " + e.getMessage(), e);
        }
    }

    @Override
    public CreateBookingResponse confirmDepositAndCreateBooking(Long depositId, String paymentMethod) {
        BookingDeposit deposit = bookingDepositRepository.findById(depositId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giữ chỗ với id: " + depositId));

        if (!"PENDING".equalsIgnoreCase(deposit.getStatus())) {
            throw new IllegalStateException("Giữ chỗ đã được xử lý hoặc hết hạn.");
        }
        if (deposit.getExpiresAt() != null && deposit.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Giữ chỗ đã hết hạn. Vui lòng chọn lại dịch vụ.");
        }
        if (deposit.getBookingId() == null) {
            throw new IllegalStateException("Giữ chỗ này không gắn với booking nào.");
        }

        try {
            Booking booking = bookingRepository.findById(deposit.getBookingId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy booking với id: " + deposit.getBookingId()));

            BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal percentage = deposit.getDepositPercentage() != null ? deposit.getDepositPercentage()
                    : BigDecimal.valueOf(25);
            BigDecimal depositAmount = total
                    .multiply(percentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            booking.setPaidAmount(depositAmount);
            booking.setRemainingAmount(total.subtract(depositAmount).max(BigDecimal.ZERO));
            booking.setIsTemporary(false);
            bookingRepository.save(booking);

            deposit.setStatus("PAID");
            deposit.setDepositPaid(true);
            deposit.setDepositPaidAt(LocalDateTime.now());
            if (paymentMethod != null && !paymentMethod.isBlank()) {
                deposit.setPaymentMethod(paymentMethod);
            }
            String depositNote = "Thanh toán cọc - " + getPaymentMethodLabel(paymentMethod);
            deposit.setNotes(depositNote);
            deposit.setDepositAmount(depositAmount);
            deposit.setBookingCode(booking.getBookingCode());
            bookingDepositRepository.save(deposit);

            // Sau khi cọc thành công: đồng bộ địa chỉ / pet / ngân hàng cho user đã đăng nhập.
            runAfterDepositPaidSuccessfully(booking, deposit);

            if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                emailServicePort.sendBookingDepositSuccessEmail(booking.getCustomerEmail(), booking.getBookingCode());
            }

            return new CreateBookingResponse(booking.getBookingCode());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo booking từ giữ chỗ: " + e.getMessage(), e);
        }
    }

    @Override
    public CreateBookingDepositPayosResponse createPayosCheckoutUrl(Long depositId, String returnUrl) {
        BookingDeposit deposit = bookingDepositRepository.findById(depositId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giữ chỗ với id: " + depositId));

        if (!"PENDING".equalsIgnoreCase(deposit.getStatus())) {
            throw new IllegalStateException("Giữ chỗ đã được xử lý hoặc hết hạn.");
        }
        if (deposit.getExpiresAt() != null && deposit.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Giữ chỗ đã hết hạn. Vui lòng chọn lại dịch vụ.");
        }
        if (deposit.getBookingId() == null) {
            throw new IllegalStateException("Giữ chỗ này không gắn với booking nào.");
        }

        Booking booking = bookingRepository.findById(deposit.getBookingId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking với id: " + deposit.getBookingId()));

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal percentage = deposit.getDepositPercentage() != null ? deposit.getDepositPercentage()
                : BigDecimal.valueOf(25);
        BigDecimal depositAmount = total
                .multiply(percentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Số tiền cọc không hợp lệ.");
        }
        long amount = depositAmount.longValue();

        // Reuse existing link if present AND still valid on PayOS
        if (deposit.getCheckoutUrl() != null && !deposit.getCheckoutUrl().isBlank()
                && deposit.getPayosOrderCode() != null) {
            
            // Check if the link is still alive on PayOS (not cancelled/expired/paid AND amount matches)
            if (!payosGatewayAdapter.isLinkDead(deposit.getPayosOrderCode(), amount)) {
                log.info("Reusing existing valid PayOS URL for deposit {}: {}", depositId, deposit.getCheckoutUrl());
                return new CreateBookingDepositPayosResponse(
                        deposit.getId(),
                        deposit.getPayosOrderCode(),
                        deposit.getCheckoutUrl(),
                        deposit.getExpiresAt(),
                        booking.getId(),
                        booking.getBookingCode()
                );
            }
            
            log.info("Existing PayOS link for deposit {} (orderCode={}) is dead. Regenerating with fresh code...", 
                    depositId, deposit.getPayosOrderCode());
            // Clear BOTH stale URL AND old orderCode to force full regeneration
            deposit.setCheckoutUrl(null);
            deposit.setPayosOrderCode(null);
        }

        Long payosOrderCode = deposit.getPayosOrderCode();
        if (payosOrderCode == null) {
            payosOrderCode = paymentOrderCodePort.getNext();
            deposit.setPayosOrderCode(payosOrderCode);
        }

        String desc = "Coc " + (booking.getBookingCode() != null ? booking.getBookingCode() : ("BK" + booking.getId()));

        String effectiveReturnUrl = (returnUrl != null && !returnUrl.isBlank()) ? returnUrl : frontendUrl;
        String checkoutUrl;
        try {
            checkoutUrl = payosGatewayAdapter.buildPaymentUrlByOrderCode(payosOrderCode, amount, desc, effectiveReturnUrl);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            // Nếu link cũ đã chết (hủy/hết hạn), sinh mã mới để tạo link mới ngay lập tức
            if (msg.contains("đã tồn tại") || msg.contains("already exist")) {
                payosOrderCode = paymentOrderCodePort.getNext();
                deposit.setPayosOrderCode(payosOrderCode);
                checkoutUrl = payosGatewayAdapter.buildPaymentUrlByOrderCode(payosOrderCode, amount, desc, effectiveReturnUrl);
            } else {
                throw e;
            }
        }
        deposit.setCheckoutUrl(checkoutUrl);
        bookingDepositRepository.save(deposit);

        return new CreateBookingDepositPayosResponse(
                deposit.getId(),
                payosOrderCode,
                checkoutUrl,
                deposit.getExpiresAt(),
                booking.getId(),
                booking.getBookingCode()
        );
    }

    private void validateServicesActive(CreateBookingRequest request) {
        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            if (petRequest.services() == null)
                continue;
            for (int svcIdx = 0; svcIdx < petRequest.services().size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = petRequest.services().get(svcIdx);
                fpt.teddypet.domain.entity.Service svc = serviceRepositoryPort.findById(sr.serviceId())
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ: " + sr.serviceId()));
                if (!svc.isActive()) {
                    throw new BookingValidationException(
                            BookingValidationException.SERVICE_INACTIVE,
                            "Dịch vụ \"" + (svc.getServiceName() != null ? svc.getServiceName() : "N/A")
                                    + "\" không còn hoạt động. Vui lòng chọn dịch vụ khác.",
                            petIdx, svcIdx, svcIdx > 0, null);
                }
                for (Long addonId : sr.addonServiceIds()) {
                    if (addonId == null)
                        continue;
                    fpt.teddypet.domain.entity.Service addon = serviceRepositoryPort.findById(addonId).orElse(null);
                    if (addon != null && !addon.isActive()) {
                        throw new BookingValidationException(
                                BookingValidationException.SERVICE_INACTIVE,
                                "Dịch vụ add-on \"" + (addon.getServiceName() != null ? addon.getServiceName() : "N/A")
                                        + "\" không còn hoạt động. Vui lòng bỏ chọn hoặc chọn add-on khác.",
                                petIdx, svcIdx, svcIdx > 0, null);
                    }
                }
            }
        }
    }

    /**
     * Reserve rooms/time slots for HOLD_MINUTES.
     * - isRequiredRoom=true: mark room status OCCUPIED (and validate not
     * overlapping dates).
     * - isRequiredRoom=false: increment currentBookings of time_slots (validate
     * capacity & optimistic lock).
     */
    private ObjectNode reserveResources(CreateBookingRequest request) {
        ObjectNode payload = objectMapper.createObjectNode();
        ArrayNode rooms = objectMapper.createArrayNode();
        ArrayNode timeSlots = objectMapper.createArrayNode();
        payload.set("rooms", rooms);
        payload.set("timeSlots", timeSlots);
        if (request.customerAddress() != null && !request.customerAddress().isBlank()) {
            payload.put("customerAddress", request.customerAddress().trim());
        }

        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            if (petRequest.services() == null)
                continue;
            for (int svcIdx = 0; svcIdx < petRequest.services().size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = petRequest.services().get(svcIdx);
                // Hold room — chỉ dịch vụ requiresRoom mới chiếm phòng + ghi vào hold payload
                if (sr.requiresRoom() && sr.roomId() != null && sr.checkInDate() != null && !sr.checkInDate().isBlank()
                        && sr.checkOutDate() != null && !sr.checkOutDate().isBlank()) {
                    LocalDate checkIn = LocalDate.parse(sr.checkInDate());
                    LocalDate checkOut = LocalDate.parse(sr.checkOutDate());
                    if (bookingPetServiceRepository.existsByRoomIdAndOverlappingDates(sr.roomId(), checkIn, checkOut)) {
                        throw new BookingValidationException(
                                BookingValidationException.ROOM_ALREADY_BOOKED,
                                "Phòng này đã được đặt trong khoảng ngày bạn chọn. Vui lòng chọn phòng khác hoặc đổi ngày.",
                                petIdx, svcIdx, svcIdx > 0, sr.roomId());
                    }
                    Room room = roomRepositoryPort.findById(sr.roomId())
                            .orElseThrow(
                                    () -> new EntityNotFoundException("Không tìm thấy phòng với id: " + sr.roomId()));
                    if (room.getStatus() != RoomStatusEnum.AVAILABLE) {
                        if (room.getStatus() == RoomStatusEnum.OCCUPIED
                                && !bookingPetServiceRepository.existsActiveAssignmentForRoom(sr.roomId())) {
                            room.setStatus(RoomStatusEnum.AVAILABLE);
                            roomRepositoryPort.save(room);
                        } else {
                            throw new BookingValidationException(
                                    BookingValidationException.ROOM_ALREADY_BOOKED,
                                    "Phòng này vừa được giữ/đặt bởi khách khác. Vui lòng chọn phòng khác.",
                                    petIdx, svcIdx, svcIdx > 0, sr.roomId());
                        }
                    }
                    room.setStatus(RoomStatusEnum.OCCUPIED);
                    roomRepositoryPort.save(room);
                    rooms.add(sr.roomId());
                    continue;
                }

                // Hold time slot
                if (sr.timeSlotId() != null) {
                    try {
                        TimeSlot slot = timeSlotRepositoryPort.findById(sr.timeSlotId())
                                .orElseThrow(() -> new EntityNotFoundException(
                                        "Không tìm thấy khung giờ: " + sr.timeSlotId()));
                        int maxCap = slot.getMaxCapacity() != null ? slot.getMaxCapacity() : 1;
                        int current = slot.getCurrentBookings() != null ? slot.getCurrentBookings() : 0;
                        if (current >= maxCap) {
                            throw new BookingValidationException(
                                    BookingValidationException.TIME_SLOT_FULL,
                                    "Khung giờ đã đủ chỗ. Vui lòng chọn khung giờ khác cho thú cưng này.",
                                    petIdx, svcIdx, svcIdx > 0, null);
                        }
                        slot.setCurrentBookings(current + 1);
                        timeSlotRepositoryPort.save(slot);
                        timeSlots.add(sr.timeSlotId());
                    } catch (OptimisticLockException e) {
                        throw new BookingValidationException(
                                BookingValidationException.TIME_SLOT_FULL,
                                "Khung giờ vừa được đặt bởi khách khác. Vui lòng làm mới trang và chọn khung giờ khác.",
                                petIdx, svcIdx, svcIdx > 0, null);
                    }
                }
            }
        }
        return payload;
    }

    private static String getPaymentMethodLabel(String method) {
        if (method == null || method.isBlank()) return "N/A";
        return switch (method.trim().toUpperCase()) {
            case "CASH" -> "Tiền mặt";
            case "BANK_TRANSFER" -> "Chuyển khoản";
            case "VIETQR" -> "VietQR";
            default -> method;
        };
    }

    @Override
    public void runAfterDepositPaidSuccessfully(Booking booking, BookingDeposit deposit) {
        if (booking == null || deposit == null) {
            return;
        }
        syncUserAddressAndPetProfiles(booking, deposit);
        syncBankInformationToUser(booking);
    }

    private void syncUserAddressAndPetProfiles(Booking booking, BookingDeposit deposit) {
        if (booking == null || booking.getUser() == null || booking.getUser().getId() == null) {
            return;
        }

        String customerAddress = extractCustomerAddressFromHoldPayload(deposit);
        createUserAddressIfNeeded(booking, customerAddress);
        createPetProfilesIfNeeded(booking);
    }

    /**
     * Bản ghi bank do FE tạo qua /bank-information/booking/code (GUEST, user_id null).
     * Khi booking gắn USER và cọc đã thành công → gắn vào ví ngân hàng của khách.
     */
    private void syncBankInformationToUser(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }
        if (booking.getUser() == null || booking.getUser().getId() == null) {
            return;
        }
        UUID userId = booking.getUser().getId();
        List<BankInformation> rows = bankInformationRepository.findByBookingIdNotDeleted(booking.getId());
        if (rows.isEmpty()) {
            return;
        }

        List<BankInformation> userBanksBefore = bankInformationRepository.findByUserIdNotDeleted(userId);
        boolean userHadNoBanks = userBanksBefore.isEmpty();
        int attachedCount = 0;

        for (BankInformation row : rows) {
            if (row.getUserId() != null) {
                continue;
            }
            if (!BankInformation.ACCOUNT_TYPE_GUEST.equalsIgnoreCase(row.getAccountType())) {
                continue;
            }
            List<BankInformation> dup = bankInformationRepository.findByAccountNumberAndBankCodeAndUserIdAndIsDeletedFalse(
                    row.getAccountNumber(), row.getBankCode(), userId);
            if (!dup.isEmpty()) {
                row.setDeleted(true);
                bankInformationRepository.save(row);
                continue;
            }
            row.setUserId(userId);
            row.setAccountType(BankInformation.ACCOUNT_TYPE_CUSTOMER);
            if (userHadNoBanks && attachedCount == 0) {
                row.setDefault(true);
            }
            bankInformationRepository.save(row);
            attachedCount++;
        }
    }

    private String extractCustomerAddressFromHoldPayload(BookingDeposit deposit) {
        if (deposit == null || deposit.getHoldPayloadJson() == null || deposit.getHoldPayloadJson().isBlank()) {
            return null;
        }
        try {
            var root = objectMapper.readTree(deposit.getHoldPayloadJson());
            if (root == null) return null;
            String address = root.path("customerAddress").asText(null);
            return (address == null || address.isBlank()) ? null : address.trim();
        } catch (Exception ignored) {
            return null;
        }
    }

    private void createUserAddressIfNeeded(Booking booking, String customerAddress) {
        if (customerAddress == null || customerAddress.isBlank()) {
            return;
        }
        String normalizedAddress = customerAddress.trim();
        String phone = booking.getCustomerPhone() == null ? "" : booking.getCustomerPhone().trim();
        String fullName = booking.getCustomerName() == null || booking.getCustomerName().isBlank()
                ? "Khách hàng"
                : booking.getCustomerName().trim();

        boolean exists = userAddressRepository.existsByUserIdAndAddressIgnoreCaseAndPhone(
                booking.getUser().getId(),
                normalizedAddress,
                phone
        );
        if (exists) {
            return;
        }

        List<UserAddress> existingAddresses = userAddressRepository.findAllByUserId(booking.getUser().getId());
        UserAddress address = UserAddress.builder()
                .user(booking.getUser())
                .fullName(fullName)
                .phone(phone)
                .address(normalizedAddress)
                .defaultAddress(existingAddresses.isEmpty())
                .build();
        userAddressRepository.save(address);
    }

    private void createPetProfilesIfNeeded(Booking booking) {
        if (booking.getPets() == null || booking.getPets().isEmpty()) {
            return;
        }

        for (BookingPet bookingPet : booking.getPets()) {
            if (bookingPet == null || bookingPet.getPetName() == null || bookingPet.getPetName().isBlank()) {
                continue;
            }

            PetTypeEnum petType = toPetTypeEnum(bookingPet.getPetType());
            String petName = bookingPet.getPetName().trim();
            boolean existed = petProfileRepository.existsByUserIdAndNameIgnoreCaseAndPetType(
                    booking.getUser().getId(),
                    petName,
                    petType
            );
            if (existed) {
                continue;
            }

            PetProfile petProfile = PetProfile.builder()
                    .user(booking.getUser())
                    .name(petName)
                    .petType(petType)
                    .weight(bookingPet.getWeightAtBooking())
                    .healthNote(bookingPet.getPetConditionNotes())
                    .build();
            petProfileRepository.save(petProfile);
        }
    }

    private PetTypeEnum toPetTypeEnum(String raw) {
        if (raw == null) return PetTypeEnum.OTHER;
        return switch (raw.trim().toUpperCase()) {
            case "DOG", "CHO" -> PetTypeEnum.DOG;
            case "CAT", "MEO" -> PetTypeEnum.CAT;
            default -> PetTypeEnum.OTHER;
        };
    }
}
