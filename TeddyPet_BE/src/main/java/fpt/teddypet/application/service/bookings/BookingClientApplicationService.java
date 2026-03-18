package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingPetRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetServiceRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.request.bookings.PetFoodBroughtItemRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingDetailResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingPetDetailResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingPetServiceDetailResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingPetServiceItemDetailResponse;
import fpt.teddypet.application.dto.response.bookings.ClientPetFoodBroughtDetailResponse;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.application.service.bookings.BookingHoldReleaseService;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.domain.entity.PetFoodBrought;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.entity.TimeSlotBooking;
import fpt.teddypet.domain.enums.bookings.BookingPaymentMethodEnum;
import fpt.teddypet.domain.exception.BookingValidationException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.context.annotation.Lazy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import fpt.teddypet.application.service.dashboard.DashboardService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class BookingClientApplicationService implements BookingClientService {

    private final BookingRepository bookingRepository;
    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository timeSlotBookingRepository;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final ServicePricingRepositoryPort servicePricingRepositoryPort;
    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository;
    private final UserRepository userRepository;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository bankInformationRepository;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRefundPolicyRepository bookingDepositRefundPolicyRepository;
    private final EmailServicePort emailServicePort;
    private final DashboardService dashboardService;
    private final BookingHoldReleaseService bookingHoldReleaseService;

    public BookingClientApplicationService(
            BookingRepository bookingRepository,
            BookingPetServiceRepository bookingPetServiceRepository,
            fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository timeSlotBookingRepository,
            ServiceRepositoryPort serviceRepositoryPort,
            ServicePricingRepositoryPort servicePricingRepositoryPort,
            RoomRepositoryPort roomRepositoryPort,
            TimeSlotRepositoryPort timeSlotRepositoryPort,
            fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository,
            UserRepository userRepository,
            fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository bankInformationRepository,
            fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRefundPolicyRepository bookingDepositRefundPolicyRepository,
            EmailServicePort emailServicePort,
            @Lazy DashboardService dashboardService,
            BookingHoldReleaseService bookingHoldReleaseService) {
        this.bookingRepository = bookingRepository;
        this.bookingPetServiceRepository = bookingPetServiceRepository;
        this.timeSlotBookingRepository = timeSlotBookingRepository;
        this.serviceRepositoryPort = serviceRepositoryPort;
        this.servicePricingRepositoryPort = servicePricingRepositoryPort;
        this.roomRepositoryPort = roomRepositoryPort;
        this.timeSlotRepositoryPort = timeSlotRepositoryPort;
        this.bookingDepositRepository = bookingDepositRepository;
        this.userRepository = userRepository;
        this.bankInformationRepository = bankInformationRepository;
        this.bookingDepositRefundPolicyRepository = bookingDepositRefundPolicyRepository;
        this.emailServicePort = emailServicePort;
        this.dashboardService = dashboardService;
        this.bookingHoldReleaseService = bookingHoldReleaseService;
    }

    @Override
    public CreateBookingResponse createBooking(CreateBookingRequest request) {
        return createBookingInternal(request, true);
    }

    @Override
    public CreateBookingResponse createBookingWithoutTimeSlotIncrement(CreateBookingRequest request) {
        return createBookingInternal(request, false);
    }

    @Transactional(readOnly = true)
    public ClientBookingDetailResponse getClientBookingDetailByCode(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt lịch với mã: " + bookingCode));

        Long depositId = null;
        LocalDateTime depositExpiresAt = null;
        boolean depositPaid = bookingDepositRepository.findByBookingId(booking.getId()).stream()
                .map(fpt.teddypet.domain.entity.BookingDeposit::getDepositPaid).filter(Boolean.TRUE::equals)
                .findFirst().orElse(false);

        if (!depositPaid && "PENDING".equals(booking.getPaymentStatus())) {
            var pendingDeposit = bookingDepositRepository.findByBookingId(booking.getId())
                    .stream()
                    .filter(d -> "PENDING".equals(d.getStatus())
                            && (d.getExpiresAt() == null || d.getExpiresAt().isAfter(LocalDateTime.now())))
                    .findFirst()
                    .orElse(null);
            if (pendingDeposit != null) {
                depositId = pendingDeposit.getId();
                depositExpiresAt = pendingDeposit.getExpiresAt();
            }
        }

        List<ClientBookingPetDetailResponse> petResponses = booking.getPets().stream().map(pet -> {
            List<ClientBookingPetServiceDetailResponse> svcResponses = pet.getServices().stream().map(svc -> {
                String roomName = null;
                String displayTypeName = null;
                String roomNumber = null;
                String timeSlotName = null; // để lưu tên khung giờ

                if (svc.getRoomId() != null) {
                    var room = roomRepositoryPort.findById(svc.getRoomId()).orElse(null);
                    if (room != null) {
                        roomName = room.getRoomName();
                        roomNumber = room.getRoomNumber();
                        if (room.getRoomType() != null) {
                            displayTypeName = room.getRoomType().getDisplayTypeName();
                        }
                    }
                } else {
                    // Dịch vụ không yêu cầu phòng → fetch từ time_slot_bookings
                    var timeSlotBooking = timeSlotBookingRepository.findByBookingPetService_Id(svc.getId()).orElse(null);
                    if (timeSlotBooking != null && timeSlotBooking.getTimeSlot() != null) {
                        var timeSlot = timeSlotBooking.getTimeSlot();
                        timeSlotName = timeSlot.getStartTime() + " - " + timeSlot.getEndTime();
                    }
                }

                List<ClientBookingPetServiceItemDetailResponse> itemResponses = svc.getItems().stream().map(item -> {
                    String itemName = item.getItemService() != null ? item.getItemService().getServiceName()
                            : "Unknown";
                    return new ClientBookingPetServiceItemDetailResponse(
                            item.getId(),
                            itemName,
                            1, // item.getQuantity() is unavailable
                            item.getItemService() != null ? item.getItemService().getBasePrice() : null,
                            item.getItemService() != null ? item.getItemService().getBasePrice() : null);
                }).toList();

                return new ClientBookingPetServiceDetailResponse(
                        svc.getId(),
                        svc.getAssignedStaffId(),
                        svc.getService() != null ? svc.getService().getServiceName() : null,
                        timeSlotName,
                        svc.getEstimatedCheckInDate(),
                        svc.getEstimatedCheckOutDate(),
                        svc.getActualCheckInDate(),
                        svc.getActualCheckOutDate(),
                        svc.getNumberOfNights(),
                        svc.getScheduledStartTime(),
                        svc.getScheduledEndTime(),
                        svc.getActualStartTime(),
                        svc.getActualEndTime(),
                        svc.getBasePrice(),
                        svc.getSubtotal(),
                        svc.getStatus(),
                        svc.getCustomerRating(),
                        svc.getCustomerReview(),
                        svc.getRoomId(),
                        roomName,
                        displayTypeName,
                        roomNumber,
                        itemResponses);
            }).toList();

            List<ClientPetFoodBroughtDetailResponse> foodResponses = pet.getFoodItems().stream().map(food -> {
                return new ClientPetFoodBroughtDetailResponse(
                        food.getId(),
                        food.getFoodBroughtType(),
                        food.getFoodBrand(),
                        food.getQuantity(),
                        food.getFeedingInstructions());
            }).toList();

            return new ClientBookingPetDetailResponse(
                    pet.getId(),
                    pet.getPetName(),
                    pet.getPetType(),
                    pet.getEmergencyContactName(),
                    pet.getEmergencyContactPhone(),
                    pet.getWeightAtBooking(),
                    pet.getPetConditionNotes(),
                    pet.getArrivalCondition(),
                    pet.getDepartureCondition(),
                    pet.getArrivalPhotos(),
                    pet.getDeparturePhotos(),
                    pet.getBelongingPhotos(),
                    pet.getFoodBrought(),
                    svcResponses,
                    foodResponses);
        }).toList();

        return new ClientBookingDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getCustomerName(),
                booking.getCustomerEmail(),
                booking.getCustomerPhone(),
                null, // address was removed earlier
                booking.getBookingType() != null ? booking.getBookingType().name() : null,
                booking.getTotalAmount(),
                booking.getPaidAmount(),
                booking.getRemainingAmount(),
                depositPaid,
                booking.getPaymentStatus(),
                booking.getPaymentMethod(),
                booking.getStatus(),
                booking.getInternalNotes(),
                depositId,
                depositExpiresAt,
                booking.getBookingCheckInDate(),
                booking.getBookingCheckOutDate(),
                booking.getCreatedAt(),
                petResponses);
    }

    @Override
    public ClientBookingDetailResponse updateBookingContact(String bookingCode,
            fpt.teddypet.application.dto.request.bookings.UpdateBookingContactRequest request) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt lịch với mã: " + bookingCode));

        booking.setCustomerName(request.customerName());
        booking.setCustomerEmail(request.customerEmail());
        booking.setCustomerPhone(request.customerPhone());

        if (request.pets() != null) {
            for (var petReq : request.pets()) {
                if (petReq.id() != null) {
                    booking.getPets().stream()
                            .filter(p -> p.getId().equals(petReq.id()))
                            .findFirst()
                            .ifPresent(p -> {
                                if (petReq.petName() != null && !petReq.petName().trim().isEmpty()) {
                                    p.setPetName(petReq.petName().trim());
                                }
                                if (petReq.emergencyContactName() != null) {
                                    p.setEmergencyContactName(petReq.emergencyContactName().trim());
                                }
                                if (petReq.emergencyContactPhone() != null) {
                                    p.setEmergencyContactPhone(petReq.emergencyContactPhone().trim());
                                }
                            });
                }
            }
        }

        bookingRepository.save(booking);

        return getClientBookingDetailByCode(bookingCode);
    }

    @Override
    public ClientBookingDetailResponse cancelBooking(String bookingCode, fpt.teddypet.application.dto.request.bookings.ClientCancelBookingRequest request) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt lịch với mã: " + bookingCode));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể hủy đơn đặt lịch ở trạng thái chờ xử lý hoặc chưa thanh toán cọc.");
        }

        boolean depositPaid = bookingDepositRepository.findByBookingId(booking.getId()).stream()
                .map(fpt.teddypet.domain.entity.BookingDeposit::getDepositPaid).filter(Boolean.TRUE::equals)
                .findFirst().orElse(false);

        BigDecimal refundAmount = BigDecimal.ZERO;

        if (depositPaid) {
            fpt.teddypet.domain.entity.BookingDepositRefundPolicy policy = bookingDepositRefundPolicyRepository.findDefaultActivePolicy()
                    .orElse(null);

            BigDecimal refundPercentage = BigDecimal.ZERO;

            if (policy != null) {
                LocalDateTime earliestCheckIn = booking.getPets().stream()
                        .flatMap(pet -> pet.getServices().stream())
                        .map(svc -> {
                            if (svc.getEstimatedCheckInDate() != null) return svc.getEstimatedCheckInDate().atStartOfDay();
                            if (svc.getScheduledStartTime() != null) return svc.getScheduledStartTime();
                            return null;
                        })
                        .filter(java.util.Objects::nonNull)
                        .min(LocalDateTime::compareTo)
                        .orElse(LocalDateTime.now().plusDays(7));

                long hoursUntilCheckIn = ChronoUnit.HOURS.between(LocalDateTime.now(), earliestCheckIn);

                if (hoursUntilCheckIn >= policy.getFullRefundHours()) {
                    refundPercentage = policy.getFullRefundPercentage();
                } else if (hoursUntilCheckIn >= policy.getPartialRefundHours()) {
                    refundPercentage = policy.getPartialRefundPercentage();
                } else if (hoursUntilCheckIn >= policy.getNoRefundHours()) {
                    refundPercentage = policy.getNoRefundPercentage();
                }

                if (refundPercentage != null && refundPercentage.compareTo(BigDecimal.ZERO) > 0 && booking.getPaidAmount() != null) {
                    refundAmount = booking.getPaidAmount().multiply(refundPercentage).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                }
            }

            if (request.bankInformation() != null && refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                fpt.teddypet.domain.entity.BankInformation bankInfo = new fpt.teddypet.domain.entity.BankInformation();
                bankInfo.setUserId(booking.getUser() != null ? booking.getUser().getId() : null);
                bankInfo.setBookingId(booking.getId());
                bankInfo.setAccountType("CUSTOMER");
                String guestEmail = booking.getCustomerEmail();
                bankInfo.setUserEmail(guestEmail != null && !guestEmail.isBlank() ? guestEmail.trim() : null);
                bankInfo.setBankName(request.bankInformation().bankName());
                bankInfo.setBankCode(request.bankInformation().bankCode());
                bankInfo.setAccountHolderName(request.bankInformation().accountHolderName());
                bankInfo.setAccountNumber(request.bankInformation().accountNumber());
                bankInfo.setVerify(false);
                bankInfo.setDefault(false);
                bankInfo.setActive(true);
                bankInfo.setDeleted(false);
                bankInformationRepository.save(bankInfo);
                booking.setRefundMethod("BANK_TRANSFER");
            }

            booking.setRefundAmount(refundAmount);

            // Nếu có số tiền hoàn > 0 → đây là yêu cầu hủy cần nhân viên duyệt.
            // Giữ status ở PENDING và set cờ cancelRequested=true để hiển thị trong admin.
            if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                booking.setCancelRequested(true);
                // Yêu cầu hoàn cọc → thông báo khách hàng
                if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                    String refundAmountFormatted = String.format("%,.0f VND", refundAmount);
                    emailServicePort.sendBookingRefundRequestedEmail(
                            booking.getCustomerEmail(), booking.getBookingCode(), refundAmountFormatted);
                }
            } else {
                // Không hoàn cọc (0%) → hủy ngay lập tức giống như chưa thanh toán cọc
                booking.setStatus("CANCELLED");
                booking.setCancelRequested(false);
                // Cancel all associated pet services and pets
                for (fpt.teddypet.domain.entity.BookingPet pet : booking.getPets()) {
                    pet.setStatus("CANCELLED");
                    for (fpt.teddypet.domain.entity.BookingPetService svc : pet.getServices()) {
                        svc.setStatus("CANCELLED");
                    }
                }
                // Cancel pending deposits
                bookingDepositRepository.findByBookingId(booking.getId()).forEach(deposit -> {
                    if ("PENDING".equals(deposit.getStatus())) {
                        String holdPayloadJson = deposit.getHoldPayloadJson();
                        deposit.setStatus("CANCELLED");
                        bookingDepositRepository.save(deposit);
                        // Nhả giữ chỗ room/time-slot ngay khi user hủy trong lúc deposit PENDING
                        bookingHoldReleaseService.releaseFromJson(holdPayloadJson);
                    }
                });
                // Xóa TimeSlotBooking records
                timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());
                // Hủy ngay (0% hoàn) → gửi email hủy
                if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                    emailServicePort.sendBookingCancelledEmail(booking.getCustomerEmail(), booking.getBookingCode());
                }
            }
        } else {
            // Không có cọc → hủy ngay
            booking.setStatus("CANCELLED");
            booking.setCancelRequested(false);
            // Cancel all associated pet services and pets
            for (fpt.teddypet.domain.entity.BookingPet pet : booking.getPets()) {
                pet.setStatus("CANCELLED");
                for (fpt.teddypet.domain.entity.BookingPetService svc : pet.getServices()) {
                    svc.setStatus("CANCELLED");
                }
            }
            // Cancel pending deposits
            bookingDepositRepository.findByBookingId(booking.getId()).forEach(deposit -> {
                if ("PENDING".equals(deposit.getStatus())) {
                    String holdPayloadJson = deposit.getHoldPayloadJson();
                    deposit.setStatus("CANCELLED");
                    bookingDepositRepository.save(deposit);
                    // Nhả giữ chỗ room/time-slot ngay khi user hủy trong lúc deposit PENDING
                    bookingHoldReleaseService.releaseFromJson(holdPayloadJson);
                }
            });
            // Xóa TimeSlotBooking records
            timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());
            // Hủy không có cọc → gửi email hủy
            if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                emailServicePort.sendBookingCancelledEmail(booking.getCustomerEmail(), booking.getBookingCode());
            }
        }

        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelledBy("CLIENT");
        booking.setCancelledReason(request.reason());

        bookingRepository.save(booking);
        dashboardService.sendDashboardUpdate();
        return getClientBookingDetailByCode(bookingCode);
    }

    @Override
    public List<Long> getBookedRoomIds(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            return Collections.emptyList();
        }
        return bookingPetServiceRepository.findDistinctRoomIdsWithOverlappingDates(checkIn, checkOut);
    }

    private CreateBookingResponse createBookingInternal(CreateBookingRequest request,
            boolean increaseTimeSlotBookings) {
        if (request.pets() == null || request.pets().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một thú cưng và dịch vụ.");
        }

        // Kiểm tra toàn bộ dịch vụ (chính + add-on) còn hoạt động không
        validateServicesActive(request);

        // Kiểm tra phòng (isRequiredRoom=true) chưa bị đặt trùng ngày bởi khách khác
        validateRoomNotAlreadyBooked(request);

        Booking booking = buildBookingEntity(request);
        // Ngày gửi (khách chọn khi tạo booking). Lấy từ request để lưu riêng,
        // không phụ thuộc luồng staff check-in/check-out.
        booking.setBookingDateFrom(extractBookingDateFrom(request));

        BigDecimal bookingTotal = BigDecimal.ZERO;

        for (CreateBookingPetRequest petRequest : request.pets()) {
            BookingPet bookingPet = buildBookingPetEntity(booking, petRequest);
            booking.getPets().add(bookingPet);

            for (CreateBookingPetServiceRequest svcRequest : petRequest.services()) {
                BookingPetService bookingPetService = buildBookingPetServiceEntity(bookingPet, svcRequest);
                bookingPet.getServices().add(bookingPetService);

                // Pricing: resolve unit price by petType + weight, then compute subtotal
                Long roomTypeIdForPricing = null;
                if (Boolean.TRUE.equals(bookingPetService.getService() != null ? bookingPetService.getService().getIsRequiredRoom() : null)
                        && bookingPetService.getRoomId() != null) {
                    roomTypeIdForPricing = roomRepositoryPort.findById(bookingPetService.getRoomId())
                            .map(r -> r.getRoomType() != null ? r.getRoomType().getId() : null)
                            .orElse(null);
                }
                BigDecimal unitPrice = resolveUnitPrice(
                        bookingPetService.getService(),
                        petRequest.petType(),
                        petRequest.weightAtBooking(),
                        roomTypeIdForPricing);
                BigDecimal subtotal = computeSubtotal(bookingPetService, unitPrice);
                bookingPetService.setBasePrice(unitPrice);
                bookingPetService.setSubtotal(subtotal);
                bookingTotal = bookingTotal.add(subtotal);
            }
        }

        booking.setTotalAmount(bookingTotal);
        booking.setPaidAmount(BigDecimal.ZERO);
        booking.setRemainingAmount(bookingTotal);

        // compute max min for something else? no longer stored on booking

        Booking saved = bookingRepository.save(booking);

        if (increaseTimeSlotBookings) {
            // Tạo TimeSlotBooking records cho dịch vụ không yêu cầu phòng (session-based)
            // và kiểm tra dung lượng khung giờ
            try {
                int petIdx = 0;
                for (BookingPet pet : saved.getPets()) {
                    int svcIdx = 0;
                    for (BookingPetService bps : pet.getServices()) {
                        boolean requiresRoom = Boolean.TRUE.equals(bps.getService().getIsRequiredRoom());
                        if (requiresRoom) {
                            // Phòng được quản lý riêng - skip
                            svcIdx++;
                            continue;
                        }

                        // Tìm timeSlotId từ request để tạo TimeSlotBooking
                        CreateBookingPetRequest petReq = request.pets().get(petIdx);
                        CreateBookingPetServiceRequest svcReq = petReq.services().get(svcIdx);
                        Long timeSlotId = svcReq.timeSlotId();

                        if (timeSlotId == null) {
                            svcIdx++;
                            continue;
                        }

                        TimeSlot slot = timeSlotRepositoryPort.findById(timeSlotId)
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + timeSlotId));
                        int maxCap = slot.getMaxCapacity() != null ? slot.getMaxCapacity() : 1;

                        // Kiểm tra dung lượng của TimeSlotBooking cho khung giờ này
                        LocalDate bookingDate = bps.getEstimatedCheckInDate();
                        long count = timeSlotBookingRepository.countByBookingDateAndTimeSlot(bookingDate, timeSlotId);
                        if (count >= maxCap) {
                            throw new BookingValidationException(
                                    BookingValidationException.TIME_SLOT_FULL,
                                    "Khung giờ đã đủ chỗ. Vui lòng chọn khung giờ khác cho thú cưng này.",
                                    petIdx, svcIdx, svcIdx > 0, null);
                        }

                        // Tạo TimeSlotBooking record
                        fpt.teddypet.domain.entity.TimeSlotBooking timeSlotBooking = new fpt.teddypet.domain.entity.TimeSlotBooking();
                        timeSlotBooking.setTimeSlot(slot);
                        timeSlotBooking.setService(bps.getService());
                        timeSlotBooking.setBookingPetService(bps);
                        timeSlotBooking.setBookingDate(bookingDate);
                        timeSlotBooking.setStartTime(slot.getStartTime());
                        timeSlotBooking.setEndTime(slot.getEndTime());
                        timeSlotBooking.setMaxCapacity(slot.getMaxCapacity());
                        timeSlotBooking.setStatus("ACTIVE");
                        timeSlotBookingRepository.save(timeSlotBooking);

                        svcIdx++;
                    }
                    petIdx++;
                }
            } catch (OptimisticLockException e) {
                throw new BookingValidationException(
                        BookingValidationException.TIME_SLOT_FULL,
                        "Khung giờ vừa được đặt bởi khách khác. Vui lòng làm mới trang và chọn khung giờ khác.",
                        null, null, null, null);
            }
        }

        dashboardService.sendDashboardUpdate();
        return new CreateBookingResponse(saved.getBookingCode());
    }

    /**
     * Kiểm tra mọi dịch vụ (chính + add-on) còn active. Nếu không → throw để FE
     * hiển thị và scroll.
     */
    private void validateServicesActive(CreateBookingRequest request) {
        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            List<CreateBookingPetServiceRequest> services = petRequest.services();
            if (services == null)
                continue;
            for (int svcIdx = 0; svcIdx < services.size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = services.get(svcIdx);
                fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(sr.serviceId())
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ: " + sr.serviceId()));
                if (!service.isActive()) {
                    throw new BookingValidationException(
                            BookingValidationException.SERVICE_INACTIVE,
                            "Dịch vụ \"" + (service.getServiceName() != null ? service.getServiceName() : "N/A")
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
     * Kiểm tra phòng (isRequiredRoom) chưa bị đặt trùng khoảng ngày bởi booking
     * khác.
     */
    private void validateRoomNotAlreadyBooked(CreateBookingRequest request) {
        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            if (petRequest.services() == null)
                continue;
            for (int svcIdx = 0; svcIdx < petRequest.services().size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = petRequest.services().get(svcIdx);
                if (sr.roomId() == null || sr.checkInDate() == null || sr.checkInDate().isBlank()
                        || sr.checkOutDate() == null || sr.checkOutDate().isBlank())
                    continue;
                LocalDate checkIn = LocalDate.parse(sr.checkInDate());
                LocalDate checkOut = LocalDate.parse(sr.checkOutDate());
                if (bookingPetServiceRepository.existsByRoomIdAndOverlappingDates(sr.roomId(), checkIn, checkOut)) {
                    throw new BookingValidationException(
                            BookingValidationException.ROOM_ALREADY_BOOKED,
                            "Phòng này đã được đặt trong khoảng ngày bạn chọn. Vui lòng chọn phòng khác hoặc đổi ngày.",
                            petIdx, svcIdx, svcIdx > 0, sr.roomId());
                }
            }
        }
    }

    private Booking buildBookingEntity(CreateBookingRequest request) {
        Booking booking = new Booking();
        booking.setId(null);
        booking.setBookingCode(generateBookingCode());
        booking.setCustomerName(request.customerName());
        booking.setCustomerEmail(request.customerEmail());
        booking.setCustomerPhone(request.customerPhone());
        try {
            if (request.bookingType() != null && !request.bookingType().isBlank()) {
                booking.setBookingType(fpt.teddypet.domain.enums.bookings.BookingTypeEnum
                        .valueOf(request.bookingType().toUpperCase()));
            } else {
                booking.setBookingType(fpt.teddypet.domain.enums.bookings.BookingTypeEnum.ONLINE);
            }
        } catch (IllegalArgumentException e) {
            booking.setBookingType(fpt.teddypet.domain.enums.bookings.BookingTypeEnum.ONLINE);
        }
        booking.setNote(request.note());
        booking.setSpecialRequests(request.note());
        booking.setStatus("PENDING");
        booking.setPaymentStatus("PENDING");
        booking.setCustomerPhone(request.customerPhone());
        booking.setCustomerEmail(request.customerEmail());

        // Gắn user (guest hoặc customer) dựa trên thông tin liên hệ
        fpt.teddypet.domain.entity.User user = ensureUserForBooking(request);
        booking.setUser(user);

        return booking;
    }

    private BookingPet buildBookingPetEntity(Booking booking, CreateBookingPetRequest petRequest) {
        BookingPet pet = new BookingPet();
        pet.setId(null);
        pet.setBooking(booking);
        pet.setPetName(petRequest.petName());
        pet.setPetType(petRequest.petType());
        pet.setEmergencyContactName(petRequest.emergencyContactName());
        pet.setEmergencyContactPhone(petRequest.emergencyContactPhone());
        pet.setWeightAtBooking(petRequest.weightAtBooking());
        pet.setPetConditionNotes(petRequest.petConditionNotes());
        pet.setStatus("PENDING");

        List<PetFoodBroughtItemRequest> foodItems = petRequest.foodItems() != null
                ? petRequest.foodItems()
                : Collections.emptyList();
        for (PetFoodBroughtItemRequest item : foodItems) {
            if (item == null)
                continue;
            PetFoodBrought entity = new PetFoodBrought();
            entity.setId(null);
            entity.setBookingPet(pet);
            entity.setFoodBroughtType(item.foodBroughtType());
            entity.setFoodBrand(item.foodBrand());
            entity.setQuantity(item.quantity());
            entity.setFeedingInstructions(item.feedingInstructions());
            pet.getFoodItems().add(entity);
        }
        return pet;
    }

    /**
     * Lấy "Ngày gửi" (global) khách chọn khi tạo booking từ request.
     * Ở FE, ngày gửi được áp dụng cho tất cả dịch vụ nên checkInDate/sessionDate
     * thường sẽ trùng nhau giữa các service.
     */
    private LocalDate extractBookingDateFrom(CreateBookingRequest request) {
        if (request == null || request.pets() == null) return null;

        for (CreateBookingPetRequest petReq : request.pets()) {
            if (petReq == null || petReq.services() == null) continue;
            for (CreateBookingPetServiceRequest svcReq : petReq.services()) {
                if (svcReq == null) continue;
                String d = (svcReq.checkInDate() != null && !svcReq.checkInDate().isBlank())
                        ? svcReq.checkInDate()
                        : svcReq.sessionDate();
                if (d == null || d.isBlank()) continue;
                return LocalDate.parse(d.trim());
            }
        }

        return null;
    }

    private BookingPetService buildBookingPetServiceEntity(BookingPet pet, CreateBookingPetServiceRequest svcRequest) {
        fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(svcRequest.serviceId())
                .orElseThrow(
                        () -> new EntityNotFoundException("Không tìm thấy dịch vụ với id: " + svcRequest.serviceId()));

        BookingPetService entity = new BookingPetService();
        entity.setId(null);
        entity.setBookingPet(pet);
        entity.setService(service);

        boolean requiresRoom = Boolean.TRUE.equals(service.getIsRequiredRoom()) || svcRequest.requiresRoom();
        if (requiresRoom) {
            if (svcRequest.checkInDate() != null && !svcRequest.checkInDate().isBlank()) {
                entity.setEstimatedCheckInDate(LocalDate.parse(svcRequest.checkInDate()));
            }
            if (svcRequest.checkOutDate() != null && !svcRequest.checkOutDate().isBlank()) {
                entity.setEstimatedCheckOutDate(LocalDate.parse(svcRequest.checkOutDate()));
            }
            if (svcRequest.roomId() != null) {
                Room room = roomRepositoryPort.findById(svcRequest.roomId())
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Không tìm thấy phòng với id: " + svcRequest.roomId()));
                entity.setRoomId(room.getId());
            }
        } else {
            // Dịch vụ không yêu cầu phòng: ngày hẹn -> estimatedCheckInDate;
            // estimatedCheckOutDate xử lý logic sau
            String dateStr = (svcRequest.sessionDate() != null && !svcRequest.sessionDate().isBlank())
                    ? svcRequest.sessionDate()
                    : svcRequest.checkInDate();
            if (dateStr != null && !dateStr.isBlank()) {
                LocalDate date = LocalDate.parse(dateStr);
                entity.setEstimatedCheckInDate(date);
                if (svcRequest.sessionSlotLabel() != null && svcRequest.sessionSlotLabel().contains("-")) {
                    String[] parts = svcRequest.sessionSlotLabel().split("-");
                    String start = parts[0].trim();
                    String end = parts[1].trim();
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                    try {
                        entity.setScheduledStartTime(
                                LocalDateTime.of(date, java.time.LocalTime.parse(start, timeFormatter)));
                        entity.setScheduledEndTime(
                                LocalDateTime.of(date, java.time.LocalTime.parse(end, timeFormatter)));
                    } catch (Exception ignored) {
                        // Nếu parse lỗi, bỏ qua, vẫn lưu booking bình thường
                    }
                }
            }
            // Ghi chú: timeSlotId KHÔNG được set ở đây nữa.
            // Thay vào đó, TimeSlotBooking record sẽ được tạo sau khi lưu BookingPetService
        }

        entity.setStatus("PENDING");

        // Add-on items (chỉ chấp nhận dịch vụ isAddon=true)
        for (Long addonId : svcRequest.addonServiceIds()) {
            if (addonId == null)
                continue;
            fpt.teddypet.domain.entity.Service addonService = serviceRepositoryPort.findById(addonId).orElse(null);
            if (addonService == null || !Boolean.TRUE.equals(addonService.getIsAddon()))
                continue;
            BookingPetServiceItem item = new BookingPetServiceItem();
            item.setBookingPetService(entity);
            item.setParentServiceId(service.getId());
            item.setItemService(addonService);
            item.setItemType("ADDON");
            entity.getItems().add(item);
        }

        return entity;
    }

    private BigDecimal computeSubtotal(BookingPetService bookingPetService, BigDecimal unitPrice) {
        if (unitPrice == null) {
            unitPrice = BigDecimal.ZERO;
        }

        boolean requiredRoom = bookingPetService.getService() != null
                && Boolean.TRUE.equals(bookingPetService.getService().getIsRequiredRoom());

        if (!requiredRoom) {
            bookingPetService.setNumberOfNights(null);
            return unitPrice;
        }

        LocalDate checkIn = bookingPetService.getEstimatedCheckInDate();
        LocalDate checkOut = bookingPetService.getEstimatedCheckOutDate();
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Dịch vụ yêu cầu phòng phải có check-in và check-out.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Ngày trả phải sau ngày gửi (không được bằng hoặc nhỏ hơn).");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights < 1)
            nights = 1;
        bookingPetService.setNumberOfNights((int) nights);

        return unitPrice.multiply(BigDecimal.valueOf(nights));
    }

    /**
     * Resolve correct price by service pricing rules based on pet type + weight.
     *
     * Rule matching:
     * - Only active pricing rules are considered.
     * - If suitablePetTypes is empty -> matches all pet types.
     * - If weight is provided -> must be within [minWeight, maxWeight] (null
     * min/max means open-ended).
     * - If weight is missing -> prefers rules without weight constraints; falls
     * back to any pet-type-matching rule.
     * - Chooses the best candidate by priority DESC, then more specific weight
     * constraints, then narrower range.
     */
    private BigDecimal resolveUnitPrice(fpt.teddypet.domain.entity.Service service, String petTypeRaw,
            BigDecimal petWeight, Long roomTypeId) {
        if (service == null || service.getId() == null) {
            return BigDecimal.ZERO;
        }

        List<ServicePricing> rules = servicePricingRepositoryPort.findByServiceIdAndActive(service.getId(), true);
        if (rules == null || rules.isEmpty()) {
            return service.getBasePrice() != null ? service.getBasePrice() : BigDecimal.ZERO;
        }

        String petTypeKey = normalizePetType(petTypeRaw);
        LocalDateTime now = LocalDateTime.now();

        List<ServicePricing> eligible = new ArrayList<>();
        for (ServicePricing r : rules) {
            if (r == null || r.getPrice() == null)
                continue;

            if (r.getEffectiveFrom() != null && r.getEffectiveFrom().isAfter(now))
                continue;
            if (r.getEffectiveTo() != null && r.getEffectiveTo().isBefore(now))
                continue;

            if (!matchesPetType(r.getSuitablePetTypes(), petTypeKey))
                continue;

            // If we know the selected room type, resolve pricing rules by roomTypeId.
            // Rule with roomTypeId = null means "applies to all room types".
            Long pricingRoomTypeId = r.getRoomType() != null ? r.getRoomType().getId() : null;
            if (roomTypeId == null) {
                if (pricingRoomTypeId != null) continue;
            } else {
                if (pricingRoomTypeId != null && !pricingRoomTypeId.equals(roomTypeId)) continue;
            }

            if (petWeight == null) {
                // If pet weight is unknown, only accept "no weight constraint" rules.
                if (r.getMinWeight() != null || r.getMaxWeight() != null)
                    continue;
            } else if (!matchesWeight(r.getMinWeight(), r.getMaxWeight(), petWeight)) {
                continue;
            }

            eligible.add(r);
        }

        ServicePricing best = eligible.stream()
                .sorted(bestPricingComparator())
                .findFirst()
                .orElse(null);

        if (best == null || best.getPrice() == null) {
            return service.getBasePrice() != null ? service.getBasePrice() : BigDecimal.ZERO;
        }
        return best.getPrice();
    }

    private Comparator<ServicePricing> bestPricingComparator() {
        return Comparator
                // lower priority number first (consistent with FE ordering)
                .comparing((ServicePricing r) -> r.getPriority() != null ? r.getPriority() : 0)
                // more weight constraints -> more specific
                .thenComparing(r -> weightSpecificityScore(r.getMinWeight(), r.getMaxWeight()),
                        Comparator.reverseOrder())
                // prefer higher minWeight (more specific for heavier pets)
                .thenComparing(r -> r.getMinWeight() != null ? r.getMinWeight() : BigDecimal.valueOf(-1),
                        Comparator.reverseOrder())
                // prefer lower maxWeight (narrower upper bound)
                .thenComparing(r -> r.getMaxWeight() != null ? r.getMaxWeight() : BigDecimal.valueOf(Double.MAX_VALUE));
    }

    private int weightSpecificityScore(BigDecimal min, BigDecimal max) {
        int s = 0;
        if (min != null)
            s++;
        if (max != null)
            s++;
        return s;
    }

    private boolean matchesWeight(BigDecimal minWeight, BigDecimal maxWeight, BigDecimal petWeight) {
        if (petWeight == null)
            return true;
        if (minWeight != null && petWeight.compareTo(minWeight) < 0)
            return false;
        if (maxWeight != null && petWeight.compareTo(maxWeight) > 0)
            return false;
        return true;
    }

    private boolean matchesPetType(String suitablePetTypes, String petTypeKey) {
        if (petTypeKey == null || petTypeKey.isBlank())
            return true;
        if (suitablePetTypes == null || suitablePetTypes.isBlank())
            return true;

        String trimmed = suitablePetTypes.trim();
        // Accept JSON array format (["DOG","CAT"]) or CSV ("DOG,CAT")
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            // very small parser (avoid ObjectMapper dependency here)
            String inner = trimmed.substring(1, trimmed.length() - 1).trim();
            if (inner.isBlank())
                return true;
            String[] parts = inner.split(",");
            for (String p : parts) {
                String v = p == null ? "" : p.trim();
                v = v.replace("\"", "").replace("'", "").trim();
                if (v.equalsIgnoreCase(petTypeKey))
                    return true;
            }
            return false;
        }

        String[] parts = trimmed.split(",");
        for (String p : parts) {
            String v = p == null ? "" : p.trim();
            if (v.isEmpty())
                continue;
            if (v.equalsIgnoreCase(petTypeKey))
                return true;
        }
        return false;
    }

    private String normalizePetType(String petTypeRaw) {
        if (petTypeRaw == null)
            return "OTHER";
        String v = petTypeRaw.trim();
        if (v.isEmpty())
            return "OTHER";
        // Client sends "dog"/"cat"/"other" or enum-like values
        String upper = v.toUpperCase(Locale.ENGLISH);
        return switch (upper) {
            case "DOG", "CAT", "OTHER" -> upper;
            case "CHO" -> "DOG";
            case "MEO" -> "CAT";
            default -> "OTHER";
        };
    }

    private LocalDateTime[] calculateBookingRange(Booking booking) {
        LocalDateTime min = null;
        LocalDateTime max = null;

        for (BookingPet pet : booking.getPets()) {
            for (BookingPetService svc : pet.getServices()) {
                LocalDateTime start = null;
                LocalDateTime end = null;

                if (svc.getEstimatedCheckInDate() != null) {
                    start = svc.getEstimatedCheckInDate().atStartOfDay();
                }
                if (svc.getScheduledStartTime() != null) {
                    start = svc.getScheduledStartTime();
                }

                if (svc.getEstimatedCheckOutDate() != null) {
                    end = svc.getEstimatedCheckOutDate().atTime(23, 59);
                }
                if (svc.getScheduledEndTime() != null) {
                    end = svc.getScheduledEndTime();
                }

                if (start != null) {
                    min = (min == null || start.isBefore(min)) ? start : min;
                }
                if (end != null) {
                    max = (max == null || end.isAfter(max)) ? end : max;
                }
            }
        }

        if (min == null) {
            min = LocalDateTime.now();
        }
        if (max == null) {
            max = min;
        }
        return new LocalDateTime[] { min, max };
    }

    private String generateBookingCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 5).toUpperCase();
        return "BK-" + datePart + "-" + randomPart;
    }

    /**
     * Tạo (hoặc lấy) tài khoản user tương ứng với thông tin liên hệ của booking.
     * - Nếu email đã tồn tại: dùng luôn user đó.
     * - Nếu chưa tồn tại: tạo user mới với role GUEST (nếu có) hoặc CUSTOMER/USER
     * fallback.
     * - Guest sẽ có hasPassword = false, password random (đã mã hóa) chỉ để thỏa
     * DB.
     */
    private fpt.teddypet.domain.entity.User ensureUserForBooking(CreateBookingRequest request) {
        String email = request.customerEmail();
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email)
                .map(existing -> {
                    // Cập nhật nhẹ thông tin hiển thị nếu thiếu
                    if ((existing.getPhoneNumber() == null || existing.getPhoneNumber().isBlank())
                            && request.customerPhone() != null) {
                        existing.setPhoneNumber(request.customerPhone());
                    }
                    if ((existing.getFirstName() == null || existing.getFirstName().isBlank())
                            && request.customerName() != null) {
                        existing.setFirstName(request.customerName());
                    }
                    return userRepository.save(existing);
                })
                .orElse(null);
    }
}
