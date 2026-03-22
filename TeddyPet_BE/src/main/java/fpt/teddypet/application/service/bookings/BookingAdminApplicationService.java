package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckInConfirmRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckInRepricePetInput;
import fpt.teddypet.application.dto.request.bookings.AdminCheckInRepricePreviewRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckOutConfirmPetInput;
import fpt.teddypet.application.dto.request.bookings.AdminCheckOutConfirmRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveBookingCancelRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPaymentTransactionRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminPetFoodBroughtResponse;
import fpt.teddypet.application.dto.response.bookings.AdminCheckInRepricePreviewResponse;
import fpt.teddypet.application.dto.response.bookings.BookingPaymentTransactionResponse;
import fpt.teddypet.application.dto.response.bookings.BookingTransactionItemResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.infrastructure.adapter.payment.PayosGatewayAdapter;
import fpt.teddypet.domain.enums.bookings.BookingPaymentMethodEnum;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPaymentTransaction;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPaymentTransactionRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceItemRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import fpt.teddypet.application.service.dashboard.DashboardService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BookingAdminApplicationService implements BookingAdminService {

        private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

        private final BookingRepository bookingRepository;
        private final BookingPetServiceItemRepository bookingPetServiceItemRepository;
        private final ServiceRepositoryPort serviceRepositoryPort;
        private final RoomRepositoryPort roomRepositoryPort;
        private final ServicePricingRepositoryPort servicePricingRepositoryPort;
        private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository;
        private final BookingPaymentTransactionRepository bookingPaymentTransactionRepository;
        private final TimeSlotBookingRepository timeSlotBookingRepository;
        private final EmailServicePort emailServicePort;
        private final DashboardService dashboardService;
        private final PayosGatewayAdapter payosGatewayAdapter;

        @Value("${app.frontend-url}")
        private String frontendUrl;

        public BookingAdminApplicationService(
                        BookingRepository bookingRepository,
                        BookingPetServiceItemRepository bookingPetServiceItemRepository,
                        ServiceRepositoryPort serviceRepositoryPort,
                        RoomRepositoryPort roomRepositoryPort,
                        ServicePricingRepositoryPort servicePricingRepositoryPort,
                        fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository,
                        BookingPaymentTransactionRepository bookingPaymentTransactionRepository,
                        TimeSlotBookingRepository timeSlotBookingRepository,
                        EmailServicePort emailServicePort,
                        @Lazy DashboardService dashboardService,
                        PayosGatewayAdapter payosGatewayAdapter) {
                this.bookingRepository = bookingRepository;
                this.bookingPetServiceItemRepository = bookingPetServiceItemRepository;
                this.serviceRepositoryPort = serviceRepositoryPort;
                this.roomRepositoryPort = roomRepositoryPort;
                this.servicePricingRepositoryPort = servicePricingRepositoryPort;
                this.bookingDepositRepository = bookingDepositRepository;
                this.bookingPaymentTransactionRepository = bookingPaymentTransactionRepository;
                this.timeSlotBookingRepository = timeSlotBookingRepository;
                this.emailServicePort = emailServicePort;
                this.dashboardService = dashboardService;
                this.payosGatewayAdapter = payosGatewayAdapter;
        }

        @Override
        public List<AdminBookingListItemResponse> getAll() {
                return bookingRepository.findAll().stream()
                                .sorted(Comparator
                                                .comparing(Booking::getCreatedAt,
                                                                Comparator.nullsLast(Comparator.naturalOrder()))
                                                .reversed())
                                .map(this::toListItem)
                                .toList();
        }

        @Override
        public AdminBookingListItemResponse getBookingBasic(Long id) {
                Booking booking = getBookingOrThrow(id);
                return toListItem(booking);
        }

        @Override
        public List<AdminBookingPetResponse> getPets(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                return booking.getPets().stream()
                                .map(pet -> new AdminBookingPetResponse(
                                                pet.getId(),
                                                booking.getId(),
                                                pet.getPetName(),
                                                pet.getPetType(),
                                                pet.getEmergencyContactName(),
                                                pet.getEmergencyContactPhone(),
                                                pet.getWeightAtBooking(),
                                                pet.getPetConditionNotes(),
                                                pet.getHealthIssues(),
                                                pet.getArrivalCondition(),
                                                pet.getDepartureCondition(),
                                                pet.getArrivalPhotos(),
                                                pet.getDeparturePhotos(),
                                                pet.getBelongingPhotos(),
                                                pet.getFoodBrought(),
                                                null,
                                                null,
                                                pet.getFoodItems().stream()
                                                                .map(f -> new AdminPetFoodBroughtResponse(
                                                                                f.getId(),
                                                                                f.getFoodBroughtType(),
                                                                                f.getFoodBrand(),
                                                                                f.getQuantity(),
                                                                                f.getFeedingInstructions()))
                                                                .toList(),
                                                pet.getServices().stream()
                                                                .map(this::toServiceResponse)
                                                                .toList()))
                                .toList();
        }

        @Override
        public AdminBookingPetResponse getPetDetail(Long bookingId, Long petId) {
                return getPets(bookingId).stream()
                                .filter(p -> p.id().equals(petId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy thú cưng trong booking."));
        }

        @Override
        @Transactional(readOnly = true)
        public AdminBookingPetServiceResponse getServiceDetail(Long bookingId, Long petId, Long serviceId) {
                AdminBookingPetResponse pet = getPetDetail(bookingId, petId);
                return pet.services().stream()
                                .filter(s -> s.id().equals(serviceId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy dịch vụ trong booking."));
        }

        @Override
        @Transactional
        public AdminBookingPetServiceItemResponse addChargeItem(Long bookingId, Long petId, Long bookingPetServiceId,
                        AddChargeItemRequest request) {
                BookingPetService bps = getBookingPetServiceOrThrow(bookingId, petId, bookingPetServiceId);
                fpt.teddypet.domain.entity.Service itemService = serviceRepositoryPort.findById(request.itemServiceId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy dịch vụ với id: " + request.itemServiceId()));
                if (!Boolean.TRUE.equals(itemService.getIsAdditionalCharge())) {
                        throw new IllegalArgumentException(
                                        "Dịch vụ này không phải additional charge. Chỉ được thêm dịch vụ có isAdditionalCharge=true.");
                }
                BookingPetServiceItem item = new BookingPetServiceItem();
                item.setBookingPetService(bps);
                item.setParentServiceId(bps.getService() != null ? bps.getService().getId() : null);
                item.setItemService(itemService);
                item.setItemType("CHARGE");
                item.setChargeReason(request.chargeReason());
                item.setChargeEvidence(request.chargeEvidence());
                item.setChargedBy(request.chargedBy());
                bps.getItems().add(item);
                item = bookingPetServiceItemRepository.save(item);
                return toItemResponse(item);
        }

        @Override
        @Transactional
        public AdminBookingPetServiceItemResponse approveChargeItem(Long bookingId, Long petId,
                        Long bookingPetServiceId, Long itemId, ApproveChargeItemRequest request) {
                BookingPetService bps = getBookingPetServiceOrThrow(bookingId, petId, bookingPetServiceId);
                BookingPetServiceItem item = bps.getItems().stream()
                                .filter(i -> i.getId().equals(itemId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy item với id: " + itemId));
                item.setChargeApprovedBy(request.chargeApprovedBy());
                item.setChargeApprovedAt(LocalDateTime.now());
                item = bookingPetServiceItemRepository.save(item);
                return toItemResponse(item);
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse approveOrRejectCancelRequest(Long bookingId, ApproveBookingCancelRequest request) {
                if (request == null || request.approved() == null) {
                        throw new IllegalArgumentException("approved là bắt buộc.");
                }

                Booking booking = getBookingOrThrow(bookingId);
                if (!Boolean.TRUE.equals(booking.getCancelRequested())) {
                        throw new IllegalStateException("Booking không có yêu cầu hủy đang chờ xử lý.");
                }

                // Only allow cancelling bookings that are still pending
                if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Chỉ có thể hủy đơn đang ở trạng thái PENDING.");
                }

                if (Boolean.TRUE.equals(request.approved())) {
                        booking.setStatus("CANCELLED");
                        booking.setCancelRequested(false);
                        // Optional: lưu ghi chú nội bộ từ staff khi duyệt hủy
                        if (request.staffNotes() != null && !request.staffNotes().isBlank()) {
                                booking.setInternalNotes(request.staffNotes().trim());
                        }
                        // Cancel all associated pet services and pets
                        for (var pet : booking.getPets()) {
                                pet.setStatus("CANCELLED");
                                for (var svc : pet.getServices()) {
                                        svc.setStatus("CANCELLED");
                                }
                        }
                        // Nếu có refundProof từ nhân viên, lưu vào booking_deposits (bản ghi đã thanh toán gần nhất)
                        if (request.refundProof() != null && !request.refundProof().isBlank()) {
                                bookingDepositRepository.findByBookingId(booking.getId()).stream()
                                                .filter(d -> Boolean.TRUE.equals(d.getDepositPaid()))
                                                .sorted((a, b) -> b.getDepositPaidAt()
                                                                .compareTo(a.getDepositPaidAt()))
                                                .findFirst()
                                                .ifPresent(d -> {
                                                        d.setRefundProof(request.refundProof());
                                                        bookingDepositRepository.save(d);
                                                });
                        }
                        // Cancel pending deposits
                        bookingDepositRepository.findByBookingId(booking.getId()).forEach(deposit -> {
                                if ("PENDING".equalsIgnoreCase(deposit.getStatus())) {
                                        deposit.setStatus("CANCELLED");
                                        bookingDepositRepository.save(deposit);
                                }
                        });

                        // Xóa TimeSlotBooking records
                        timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());

                        // Send refund approved email to customer
                        if (booking.getRefundAmount() != null && booking.getRefundAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                            if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                                try {
                                    String refundAmountFormatted = String.format("%,.0f VND", booking.getRefundAmount());
                                    emailServicePort.sendBookingRefundApprovedEmail(
                                            booking.getCustomerEmail(), booking.getBookingCode(), refundAmountFormatted, null);
                                } catch (Exception emailEx) {
                                        System.out.println("Failed to send refund-approved email for booking " + booking.getBookingCode() + ": " + emailEx);
                                }
                            }
                        }
                } else {
                        // Reject cancel request: keep client reason for feedback,
                        // store staff note for client to read, and revert booking state.
                        booking.setStatus("CONFIRMED");
                        booking.setCancelRequested(false);
                        if (request.staffNotes() != null && !request.staffNotes().isBlank()) {
                                booking.setInternalNotes(request.staffNotes().trim());
                        }
                }

                bookingRepository.save(booking);
                dashboardService.sendDashboardUpdate();
                return toListItem(booking);
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse confirmReadyToWork(Long bookingId, fpt.teddypet.application.dto.request.bookings.ConfirmBookingReadyRequest request) {
                Booking booking = getBookingOrThrow(bookingId);

                // Allow ONLY if booking is PENDING or CONFIRMED (adjust logic if needed, but it should be beforeREADY_TO_WORK)
                // Let's assume as long as it's not CANCELLED or COMPLETED, we can set it to READY_TO_WORK
                if ("CANCELLED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Không thể cập nhật trạng thái READY cho đơn đã Cancelled hoặc Completed.");
                }

                // Update each pet's info
                for (fpt.teddypet.application.dto.request.bookings.ConfirmBookingReadyRequest.PetConfirmInfo petInfo : request.pets()) {
                        fpt.teddypet.domain.entity.BookingPet pet = booking.getPets().stream()
                                        .filter(p -> p.getId().equals(petInfo.petId()))
                                        .findFirst()
                                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thú cưng với id: " + petInfo.petId() + " trong booking này."));

                        pet.setPetType(petInfo.petType());
                        pet.setWeightAtBooking(petInfo.weightAtBooking());
                }

                // Update booking status
                booking.setStatus("READY");

                // Also update all booking_pet_service statuses to READY
                for (var pet : booking.getPets()) {
                        for (var service : pet.getServices()) {
                                service.setStatus("READY");
                        }
                }

                bookingRepository.save(booking);

                return toListItem(booking);
        }

        private BookingPetService getBookingPetServiceOrThrow(Long bookingId, Long petId, Long bookingPetServiceId) {
                Booking booking = getBookingOrThrow(bookingId);
                BookingPetService bps = booking.getPets().stream()
                                .filter(p -> p.getId().equals(petId))
                                .flatMap(p -> p.getServices().stream())
                                .filter(s -> s.getId().equals(bookingPetServiceId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy booking_pet_service tương ứng."));
                return bps;
        }

        private AdminBookingPetServiceItemResponse toItemResponse(BookingPetServiceItem i) {
                return new AdminBookingPetServiceItemResponse(
                                i.getId(),
                                i.getItemService() != null ? i.getItemService().getId() : null,
                                i.getItemService() != null ? i.getItemService().getServiceName() : null,
                                i.getItemType(),
                                i.isActive(),
                                i.getCancelledReason(),
                                i.getCancelledBy(),
                                i.getCancelledAt(),
                                i.getChargeReason(),
                                i.getChargeEvidence(),
                                i.getChargedBy(),
                                i.getChargeApprovedBy(),
                                i.getChargeApprovedAt(),
                                i.getNotes(),
                                i.getStaffNotes());
        }

        private AdminBookingListItemResponse toListItem(Booking booking) {
                boolean depositPaid = false;
                List<fpt.teddypet.domain.entity.BookingDeposit> deposits = bookingDepositRepository
                                .findByBookingId(booking.getId());
                java.math.BigDecimal depositAmount = java.math.BigDecimal.ZERO;
                if (!deposits.isEmpty()) {
                        depositPaid = deposits.get(0).getDepositPaid() != null ? deposits.get(0).getDepositPaid()
                                        : false;
                }
                // Prefer latest PAID deposit amount; fallback to first row amount
                if (!deposits.isEmpty()) {
                        var paidLatest = deposits.stream()
                                        .filter(d -> Boolean.TRUE.equals(d.getDepositPaid()))
                                        .filter(d -> d.getDepositPaidAt() != null)
                                        .max(Comparator.comparing(fpt.teddypet.domain.entity.BookingDeposit::getDepositPaidAt))
                                        .orElse(null);
                        if (paidLatest != null && paidLatest.getDepositAmount() != null) {
                                depositAmount = paidLatest.getDepositAmount();
                        } else if (deposits.get(0).getDepositAmount() != null) {
                                depositAmount = deposits.get(0).getDepositAmount();
                        }
                }

                boolean cancelRequested = Boolean.TRUE.equals(booking.getCancelRequested());

                return new AdminBookingListItemResponse(
                                booking.getId() != null ? booking.getId().toString() : null,
                                booking.getBookingCode(),
                                booking.getCustomerName(),
                                booking.getCustomerEmail(),
                                booking.getCustomerPhone(),
                                booking.getCustomerPhone(), // FE hiện chưa dùng customerAddress nhiều; có thể thay bằng
                                                            // field address sau
                                booking.getBookingType() != null ? booking.getBookingType().name() : null,
                                booking.getTotalAmount(),
                                booking.getPaidAmount(),
                                booking.getRemainingAmount(),
                                booking.getCreditToRefund(),
                                depositAmount,
                                depositPaid,
                                booking.getPaymentStatus(),
                                formatPaymentMethodForDisplay(booking.getPaymentMethod()),
                                booking.getStatus(),
                                cancelRequested,
                                booking.getCancelledBy(),
                                booking.getCancelledReason(),
                                booking.getCancelledAt(),
                                booking.getInternalNotes(),
                                booking.getBookingDateFrom(),
                                booking.getBookingCheckInDate(),
                                booking.getBookingCheckOutDate(),
                                booking.getCreatedAt(),
                                booking.getUpdatedAt());
        }

        private AdminBookingPetServiceResponse toServiceResponse(fpt.teddypet.domain.entity.BookingPetService svc) {
                List<AdminBookingPetServiceItemResponse> items = (svc.getItems() != null ? svc.getItems()
                                : Collections.<BookingPetServiceItem>emptyList()).stream()
                                .map(this::toItemResponse)
                                .toList();
                List<Long> assignedStaffIds = List.of();
                String assignedStaffNames = null;
                if (svc.getAssignedStaff() != null && !svc.getAssignedStaff().isEmpty()) {
                        assignedStaffIds = svc.getAssignedStaff().stream()
                                        .sorted(Comparator.comparing(StaffProfile::getId,
                                                        Comparator.nullsLast(Long::compareTo)))
                                        .map(StaffProfile::getId)
                                        .toList();
                        assignedStaffNames = svc.getAssignedStaff().stream()
                                        .sorted(Comparator.comparing(StaffProfile::getId,
                                                        Comparator.nullsLast(Long::compareTo)))
                                        .map(StaffProfile::getFullName)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.joining(", "));
                }
                Boolean isRequiredRoom = svc.getService() != null ? svc.getService().getIsRequiredRoom() : null;
                boolean isOverCheckOutDue = computeIsOverCheckOutDue(isRequiredRoom, svc.getEstimatedCheckOutDate(),
                                svc.getActualCheckOutDate());
                return new AdminBookingPetServiceResponse(
                                svc.getId(),
                                svc.getBookingPet() != null ? svc.getBookingPet().getId() : null,
                                assignedStaffIds,
                                assignedStaffNames,
                                svc.getService() != null ? svc.getService().getId() : null,
                                svc.getServiceCombo() != null ? svc.getServiceCombo().getId() : null,
                                svc.getService() != null ? svc.getService().getServiceName() : null,
                                svc.getTimeSlotId(),
                                svc.getRoomId(),
                                svc.getEstimatedCheckInDate(),
                                svc.getEstimatedCheckOutDate(),
                                svc.getActualCheckInDate(),
                                svc.getActualCheckOutDate(),
                                svc.getNumberOfNights(),
                                svc.getScheduledStartTime(),
                                svc.getScheduledEndTime(),
                                svc.getActualStartTime(),
                                svc.getActualEndTime(),
                                svc.getSubtotal(),
                                svc.getStatus(),
                                svc.getStaffNotes(),
                                svc.getCustomerRating(),
                                svc.getCustomerReview(),
                                svc.getDuringPhotos(),
                                svc.getAfterPhotos(),
                                svc.getBeforePhotos(),
                                svc.getVideos(),
                                isRequiredRoom,
                                isOverCheckOutDue,
                                items);
        }

        private static boolean computeIsOverCheckOutDue(Boolean isRequiredRoom, LocalDate estimatedCheckOut,
                        LocalDate actualCheckOut) {
                if (!Boolean.TRUE.equals(isRequiredRoom) || estimatedCheckOut == null || actualCheckOut != null) {
                        return false;
                }
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
                return estimatedCheckOut.isBefore(today);
        }

        private Booking getBookingOrThrow(Long id) {
                return bookingRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy booking với id: " + id));
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse updateInternalNotes(Long bookingId, fpt.teddypet.application.dto.request.bookings.UpdateBookingInternalNotesRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                String notes = request.getInternalNotes();
                booking.setInternalNotes(notes != null ? notes.trim() : null);
                booking = bookingRepository.save(booking);
                return toListItem(booking);
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse confirmFullPayment(Long bookingId, fpt.teddypet.application.dto.request.bookings.ConfirmFullPaymentRequest request) {
                if (request == null || request.paymentMethod() == null || request.paymentMethod().isBlank()) {
                        throw new IllegalArgumentException("paymentMethod là bắt buộc.");
                }
                String method = request.paymentMethod().trim().toUpperCase();
                try {
                        BookingPaymentMethodEnum.valueOf(method);
                } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Hình thức thanh toán chỉ được phép: CASH hoặc BANK_TRANSFER.");
                }

                Booking booking = getBookingOrThrow(bookingId);

                List<String> allowedStatuses = List.of("CONFIRMED", "READY", "COMPLETED");
                if (!allowedStatuses.contains(booking.getStatus().toUpperCase())) {
                        throw new IllegalStateException("Chỉ có thể xác nhận thanh toán khi booking ở trạng thái CONFIRMED, READY hoặc COMPLETED.");
                }

                BigDecimal remaining = booking.getRemainingAmount() != null ? booking.getRemainingAmount() : BigDecimal.ZERO;
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                        booking.setPaymentStatus("PAID");
                        bookingRepository.save(booking);
                        return toListItem(booking);
                }

                // Tạo một giao dịch thanh toán phần còn lại, sau đó recompute booking
                CreateBookingPaymentTransactionRequest txRequest = new CreateBookingPaymentTransactionRequest(
                                "FINAL_PAYMENT",
                                remaining,
                                method,
                                null,
                                null,
                                booking.getCustomerName(),
                                LocalDateTime.now(),
                                null,
                                "COMPLETED",
                                null
                );
                addPaymentTransaction(bookingId, txRequest);
                if (request.notes() != null && !request.notes().isBlank()) {
                        Booking b = getBookingOrThrow(bookingId);
                        b.setInternalNotes(request.notes().trim());
                        bookingRepository.save(b);
                }
                return toListItem(getBookingOrThrow(bookingId));
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse checkIn(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Không thể check-in vì booking đã bị hủy.");
                }
                booking.setStatus("IN_PROGRESS");
                for (BookingPet pet : booking.getPets()) {
                        for (BookingPetService service : pet.getServices()) {
                                if (service != null && service.isActive() && !"CANCELLED".equalsIgnoreCase(service.getStatus())) {
                                        service.setStatus("IN_PROGRESS");
                                }
                        }
                }
                LocalDateTime checkInAt = LocalDateTime.now();
                booking.setBookingCheckInDate(checkInAt);
                applyActualCheckInDateToActiveBookingPetServices(booking, checkInAt.toLocalDate());
                bookingRepository.save(booking);
                return toListItem(booking);
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse checkOut(Long bookingId, AdminCheckOutConfirmRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Không thể check-out vì booking đã bị hủy.");
                }

                Map<Long, AdminCheckOutConfirmPetInput> confirmedByPetId = new HashMap<>();
                if (request != null && request.pets() != null) {
                        for (AdminCheckOutConfirmPetInput p : request.pets()) {
                                if (p != null && p.petId() != null) confirmedByPetId.put(p.petId(), p);
                        }
                }

                for (BookingPet pet : booking.getPets()) {
                        AdminCheckOutConfirmPetInput confirmed = confirmedByPetId.get(pet.getId());
                        if (confirmed == null) continue;

                        if (confirmed.departureCondition() != null) {
                                String c = confirmed.departureCondition().trim();
                                pet.setDepartureCondition(c.isBlank() ? null : c);
                        }
                        if (confirmed.departurePhotos() != null) {
                                pet.setDeparturePhotos(serializePhotoUrls(confirmed.departurePhotos()));
                        }
                }

                LocalDateTime checkOutAt = LocalDateTime.now();
                booking.setBookingCheckOutDate(checkOutAt);
                applyActualCheckOutDateToActiveBookingPetServices(booking, checkOutAt.toLocalDate());
                bookingRepository.save(booking);
                return toListItem(booking);
        }

        @Override
        public AdminCheckInRepricePreviewResponse previewCheckInReprice(Long bookingId, AdminCheckInRepricePreviewRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                Map<Long, AdminCheckInRepricePetInput> confirmedByPetId = new HashMap<>();
                if (request != null && request.pets() != null) {
                        for (AdminCheckInRepricePetInput p : request.pets()) {
                                if (p != null && p.petId() != null) confirmedByPetId.put(p.petId(), p);
                        }
                }

                BigDecimal oldTotal = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal paid = booking.getPaidAmount() != null ? booking.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal oldRemaining = booking.getRemainingAmount() != null ? booking.getRemainingAmount() : oldTotal.subtract(paid).max(BigDecimal.ZERO);

                List<AdminCheckInRepricePreviewResponse.PetInfoDiff> petDiffs = new ArrayList<>();
                List<AdminCheckInRepricePreviewResponse.ServicePriceDiff> serviceDiffs = new ArrayList<>();
                List<AdminCheckInRepricePreviewResponse.ItemPriceDiff> itemDiffs = new ArrayList<>();

                BigDecimal newTotal = BigDecimal.ZERO;

                for (BookingPet pet : booking.getPets()) {
                        AdminCheckInRepricePetInput confirmed = confirmedByPetId.get(pet.getId());
                        String newTypeRaw = confirmed != null ? confirmed.confirmedPetType() : pet.getPetType();
                        BigDecimal newWeight = confirmed != null ? confirmed.confirmedWeight() : pet.getWeightAtBooking();

                        petDiffs.add(new AdminCheckInRepricePreviewResponse.PetInfoDiff(
                                        pet.getId(),
                                        pet.getPetName(),
                                        pet.getPetType(),
                                        newTypeRaw,
                                        pet.getWeightAtBooking(),
                                        newWeight
                        ));

                        for (BookingPetService bps : pet.getServices()) {
                                if (bps == null || !bps.isActive() || "CANCELLED".equalsIgnoreCase(bps.getStatus())) {
                                        continue;
                                }
                                BigDecimal oldUnit = bps.getBasePrice() != null ? bps.getBasePrice() : BigDecimal.ZERO;
                                BigDecimal oldSub = bps.getSubtotal() != null ? bps.getSubtotal() : BigDecimal.ZERO;

                                Long roomTypeId = resolveRoomTypeId(bps);
                                BigDecimal newUnit = resolveUnitPrice(bps.getService(), newTypeRaw, newWeight, roomTypeId);
                                SubtotalResult subRes = computeSubtotalPreview(bps, newUnit);
                                BigDecimal newSub = subRes.subtotal();
                                newTotal = newTotal.add(newSub);

                                boolean requiresRoom = subRes.requiresRoom();
                                Integer nights = subRes.numberOfNights();

                                serviceDiffs.add(new AdminCheckInRepricePreviewResponse.ServicePriceDiff(
                                                pet.getId(),
                                                pet.getPetName(),
                                                bps.getId(),
                                                bps.getService() != null ? bps.getService().getId() : null,
                                                bps.getService() != null ? bps.getService().getServiceName() : null,
                                                requiresRoom,
                                                nights,
                                                oldUnit,
                                                newUnit,
                                                oldSub,
                                                newSub,
                                                newSub.subtract(oldSub)
                                ));

                                // Add-on/charge items under this service (active only)
                                if (bps.getItems() != null) {
                                        for (BookingPetServiceItem item : bps.getItems()) {
                                                if (item == null || !item.isActive()) continue;
                                                var itemService = item.getItemService();
                                                BigDecimal oldItemUnit = resolveUnitPrice(itemService, pet.getPetType(), pet.getWeightAtBooking(), roomTypeId);
                                                BigDecimal oldItemSub = computeItemSubtotal(itemService, bps, oldItemUnit);
                                                BigDecimal newItemUnit = resolveUnitPrice(itemService, newTypeRaw, newWeight, roomTypeId);
                                                BigDecimal newItemSub = computeItemSubtotal(itemService, bps, newItemUnit);
                                                newTotal = newTotal.add(newItemSub);
                                                itemDiffs.add(new AdminCheckInRepricePreviewResponse.ItemPriceDiff(
                                                                pet.getId(),
                                                                pet.getPetName(),
                                                                bps.getId(),
                                                                item.getId(),
                                                                itemService != null ? itemService.getId() : null,
                                                                itemService != null ? itemService.getServiceName() : null,
                                                                item.getItemType(),
                                                                oldItemUnit,
                                                                newItemUnit,
                                                                oldItemSub,
                                                                newItemSub,
                                                                newItemSub.subtract(oldItemSub)
                                                ));
                                        }
                                }
                        }
                }

                BigDecimal newRemaining = newTotal.subtract(paid).max(BigDecimal.ZERO);

                return new AdminCheckInRepricePreviewResponse(
                                oldTotal,
                                newTotal,
                                paid,
                                oldRemaining,
                                newRemaining,
                                petDiffs,
                                serviceDiffs,
                                itemDiffs
                );
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse confirmCheckInWithReprice(Long bookingId, AdminCheckInConfirmRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Không thể check-in vì booking đã bị hủy.");
                }

                // Apply confirmed info + reprice
                Map<Long, AdminCheckInRepricePetInput> confirmedByPetId = new HashMap<>();
                if (request != null && request.pets() != null) {
                        for (AdminCheckInRepricePetInput p : request.pets()) {
                                if (p != null && p.petId() != null) confirmedByPetId.put(p.petId(), p);
                        }
                }

                BigDecimal newTotalServices = BigDecimal.ZERO;
                for (BookingPet pet : booking.getPets()) {
                        AdminCheckInRepricePetInput confirmed = confirmedByPetId.get(pet.getId());
                        if (confirmed != null) {
                                pet.setPetType(confirmed.confirmedPetType());
                                pet.setWeightAtBooking(confirmed.confirmedWeight());
                                pet.setConfirmedPetType(confirmed.confirmedPetType());
                                pet.setConfirmedWeight(confirmed.confirmedWeight());

                                if (confirmed.arrivalCondition() != null) {
                                        String c = confirmed.arrivalCondition().trim();
                                        pet.setArrivalCondition(c.isBlank() ? null : c);
                                }
                                if (confirmed.arrivalPhotos() != null) {
                                        pet.setArrivalPhotos(serializePhotoUrls(confirmed.arrivalPhotos()));
                                }
                                if (confirmed.belongingPhotos() != null) {
                                        pet.setBelongingPhotos(serializePhotoUrls(confirmed.belongingPhotos()));
                                }
                        }
                        String effectiveType = pet.getPetType();
                        BigDecimal effectiveWeight = pet.getWeightAtBooking();

                        for (BookingPetService bps : pet.getServices()) {
                                Long roomTypeId = resolveRoomTypeId(bps);
                                BigDecimal newUnit = resolveUnitPrice(bps.getService(), effectiveType, effectiveWeight, roomTypeId);
                                SubtotalResult subRes = computeSubtotalPreview(bps, newUnit);
                                bps.setBasePrice(newUnit);
                                bps.setSubtotal(subRes.subtotal());
                                bps.setNumberOfNights(subRes.requiresRoom() ? subRes.numberOfNights() : null);
                                if (request != null && request.staffNote() != null && !request.staffNote().isBlank()) {
                                        bps.setStaffNotes(request.staffNote().trim());
                                }
                                newTotalServices = newTotalServices.add(subRes.subtotal());
                        }
                }

                // Total = services subtotal + active items subtotal (computed by pricing rules)
                BigDecimal newItemsTotal = computeActiveItemsTotal(booking);
                booking.setTotalAmount(newTotalServices.add(newItemsTotal));
                booking.setStatus("IN_PROGRESS");
                for (BookingPet pet : booking.getPets()) {
                        for (BookingPetService service : pet.getServices()) {
                                if (service != null && service.isActive() && !"CANCELLED".equalsIgnoreCase(service.getStatus())) {
                                        service.setStatus("IN_PROGRESS");
                                }
                        }
                }
                LocalDateTime checkInAt = LocalDateTime.now();
                booking.setBookingCheckInDate(checkInAt);
                applyActualCheckInDateToActiveBookingPetServices(booking, checkInAt.toLocalDate());
                bookingRepository.save(booking);

                // recompute paid/remaining/credit based on new total (deposit stays as-is)
                recomputeBookingFromTransactionsWithCredit(bookingId);
                dashboardService.sendDashboardUpdate();
                return toListItem(getBookingOrThrow(bookingId));
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse cancelBookingPetService(Long bookingId, Long bookingPetServiceId, fpt.teddypet.application.dto.request.bookings.CancelBookingPetServiceRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                ensureMoreThanOneActiveLineItem(booking);

                BookingPetService target = booking.getPets().stream()
                                .flatMap(p -> p.getServices().stream())
                                .filter(s -> s.getId().equals(bookingPetServiceId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking_pet_service với id: " + bookingPetServiceId));

                String by = getCurrentAdminIdentity();
                String reason = request != null ? request.cancelReason().trim() : "";

                target.setStatus("CANCELLED");
                target.setCancelledAt(LocalDateTime.now());
                target.setCancelledBy(by);
                target.setCancelledReason(reason);

                // Cancel all items under this service as well
                if (target.getItems() != null) {
                        for (BookingPetServiceItem item : target.getItems()) {
                                if (item == null || !item.isActive()) continue;
                                item.setActive(false);
                                item.setCancelledAt(LocalDateTime.now());
                                item.setCancelledBy(by);
                                item.setCancelledReason(reason);
                        }
                }

                bookingRepository.save(booking);
                recomputeBookingTotalFromActiveLinesWithCredit(bookingId);
                dashboardService.sendDashboardUpdate();
                return toListItem(getBookingOrThrow(bookingId));
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse cancelBookingPetServiceItem(Long bookingId, Long itemId, fpt.teddypet.application.dto.request.bookings.CancelBookingPetServiceRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                ensureMoreThanOneActiveLineItem(booking);

                BookingPetServiceItem target = booking.getPets().stream()
                                .flatMap(p -> p.getServices().stream())
                                .flatMap(s -> (s.getItems() != null ? s.getItems().stream() : java.util.stream.Stream.<BookingPetServiceItem>empty()))
                                .filter(i -> i.getId().equals(itemId))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking_pet_service_item với id: " + itemId));

                if (!target.isActive()) {
                        throw new IllegalStateException("Item này đã bị hủy trước đó.");
                }

                String by = getCurrentAdminIdentity();
                String reason = request != null ? request.cancelReason().trim() : "";

                target.setActive(false);
                target.setCancelledAt(LocalDateTime.now());
                target.setCancelledBy(by);
                target.setCancelledReason(reason);

                bookingRepository.save(booking);
                recomputeBookingTotalFromActiveLinesWithCredit(bookingId);
                dashboardService.sendDashboardUpdate();
                return toListItem(getBookingOrThrow(bookingId));
        }

        private void ensureMoreThanOneActiveLineItem(Booking booking) {
                int active = countActiveLineItems(booking);
                if (active <= 1) {
                        throw new IllegalStateException("Không thể hủy vì booking chỉ còn 1 dịch vụ (hoặc item) đang hoạt động.");
                }
        }

        private int countActiveLineItems(Booking booking) {
                if (booking == null) return 0;
                int count = 0;
                for (BookingPet pet : booking.getPets()) {
                        for (BookingPetService svc : pet.getServices()) {
                                boolean svcActive = svc != null
                                                && svc.isActive()
                                                && !"CANCELLED".equalsIgnoreCase(svc.getStatus());
                                if (svcActive) count++;
                                if (svc != null && svc.getItems() != null) {
                                        for (BookingPetServiceItem item : svc.getItems()) {
                                                if (item != null && item.isActive()) count++;
                                        }
                                }
                        }
                }
                return count;
        }

        private String getCurrentAdminIdentity() {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                                return auth.getName();
                        }
                } catch (Exception ignored) {
                }
                return "ADMIN";
        }

        private BigDecimal computeActiveItemsTotal(Booking booking) {
                if (booking == null) return BigDecimal.ZERO;
                BigDecimal sum = BigDecimal.ZERO;
                for (BookingPet pet : booking.getPets()) {
                        String petType = pet.getPetType();
                        BigDecimal petWeight = pet.getWeightAtBooking();
                        for (BookingPetService parentSvc : pet.getServices()) {
                                if (parentSvc == null || !parentSvc.isActive() || "CANCELLED".equalsIgnoreCase(parentSvc.getStatus())) continue;
                                if (parentSvc.getItems() == null) continue;
                                for (BookingPetServiceItem item : parentSvc.getItems()) {
                                        if (item == null || !item.isActive()) continue;
                                        var itemService = item.getItemService();
                                        Long roomTypeId = resolveRoomTypeId(parentSvc);
                                        BigDecimal unit = resolveUnitPrice(itemService, petType, petWeight, roomTypeId);
                                        BigDecimal sub = computeItemSubtotal(itemService, parentSvc, unit);
                                        sum = sum.add(sub);
                                }
                        }
                }
                return sum;
        }

        private BigDecimal computeItemSubtotal(fpt.teddypet.domain.entity.Service itemService, BookingPetService parentSvc, BigDecimal unitPrice) {
                if (unitPrice == null) unitPrice = BigDecimal.ZERO;
                boolean requiredRoom = itemService != null && Boolean.TRUE.equals(itemService.getIsRequiredRoom());
                if (!requiredRoom) return unitPrice;
                // If item is per-day, align with parent service nights
                LocalDate checkIn = parentSvc.getEstimatedCheckInDate();
                LocalDate checkOut = parentSvc.getEstimatedCheckOutDate();
                if (checkIn == null || checkOut == null) return unitPrice;
                long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
                if (nights < 1) nights = 1;
                return unitPrice.multiply(BigDecimal.valueOf(nights));
        }

        private void recomputeBookingTotalFromActiveLinesWithCredit(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                BigDecimal totalServices = BigDecimal.ZERO;
                for (BookingPet pet : booking.getPets()) {
                        for (BookingPetService svc : pet.getServices()) {
                                if (svc == null || !svc.isActive()) continue;
                                if ("CANCELLED".equalsIgnoreCase(svc.getStatus())) continue;
                                totalServices = totalServices.add(svc.getSubtotal() != null ? svc.getSubtotal() : BigDecimal.ZERO);
                        }
                }
                BigDecimal itemsTotal = computeActiveItemsTotal(booking);
                booking.setTotalAmount(totalServices.add(itemsTotal));
                bookingRepository.save(booking);
                recomputeBookingFromTransactionsWithCredit(bookingId);
        }

        private void recomputeBookingFromTransactionsWithCredit(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;

                BigDecimal depositPaidAmount = BigDecimal.ZERO;
                for (fpt.teddypet.domain.entity.BookingDeposit d : bookingDepositRepository.findByBookingId(bookingId)) {
                        if (Boolean.TRUE.equals(d.getDepositPaid()) && d.getDepositAmount() != null) {
                                depositPaidAmount = depositPaidAmount.add(d.getDepositAmount());
                        }
                }

                List<BookingPaymentTransaction> completed = bookingPaymentTransactionRepository.findByBookingIdOrderByPaidAtAsc(bookingId).stream()
                                .filter(t -> "COMPLETED".equals(t.getStatus()))
                                .toList();
                BigDecimal sumTransactions = completed.stream()
                                .map(BookingPaymentTransaction::getAmount)
                                .filter(java.util.Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal paidAmount = depositPaidAmount.add(sumTransactions);
                BigDecimal remaining = total.subtract(paidAmount);
                BigDecimal credit = BigDecimal.ZERO;
                if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                        credit = remaining.abs();
                        remaining = BigDecimal.ZERO;
                }

                // Update payment methods from completed txs
                Set<String> methods = new LinkedHashSet<>();
                completed.stream()
                                .map(BookingPaymentTransaction::getPaymentMethod)
                                .filter(m -> m != null && !m.isBlank())
                                .forEach(methods::add);
                String paymentMethodJson = null;
                if (!methods.isEmpty()) {
                        try {
                                paymentMethodJson = OBJECT_MAPPER.writeValueAsString(List.copyOf(methods));
                        } catch (JsonProcessingException e) {
                                paymentMethodJson = String.join(", ", methods);
                        }
                }

                booking.setPaidAmount(paidAmount);
                booking.setRemainingAmount(remaining);
                booking.setCreditToRefund(credit);
                if (paymentMethodJson != null) {
                        booking.setPaymentMethod(paymentMethodJson);
                }
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                        booking.setPaymentStatus("PAID");
                }
                bookingRepository.save(booking);
        }

        private record SubtotalResult(BigDecimal subtotal, boolean requiresRoom, Integer numberOfNights) {}

        private SubtotalResult computeSubtotalPreview(BookingPetService bookingPetService, BigDecimal unitPrice) {
                if (unitPrice == null) unitPrice = BigDecimal.ZERO;
                boolean requiredRoom = bookingPetService.getService() != null
                                && Boolean.TRUE.equals(bookingPetService.getService().getIsRequiredRoom());
                if (!requiredRoom) {
                        return new SubtotalResult(unitPrice, false, null);
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
                if (nights < 1) nights = 1;
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(nights));
                return new SubtotalResult(subtotal, true, (int) nights);
        }

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
                        if (r == null || r.getPrice() == null) continue;
                        if (r.getEffectiveFrom() != null && r.getEffectiveFrom().isAfter(now)) continue;
                        if (r.getEffectiveTo() != null && r.getEffectiveTo().isBefore(now)) continue;
                        if (!matchesPetType(r.getSuitablePetTypes(), petTypeKey)) continue;
                        Long pricingRoomTypeId = r.getRoomType() != null ? r.getRoomType().getId() : null;
                        if (roomTypeId == null) {
                                if (pricingRoomTypeId != null) continue;
                        } else {
                                if (pricingRoomTypeId != null && !pricingRoomTypeId.equals(roomTypeId)) continue;
                        }
                        if (petWeight == null) {
                                if (r.getMinWeight() != null || r.getMaxWeight() != null) continue;
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

        private Long resolveRoomTypeId(BookingPetService bookingPetService) {
                if (bookingPetService == null || bookingPetService.getRoomId() == null) return null;
                return roomRepositoryPort.findById(bookingPetService.getRoomId())
                                .map(room -> room.getRoomType() != null ? room.getRoomType().getId() : null)
                                .orElse(null);
        }

        private Comparator<ServicePricing> bestPricingComparator() {
                return Comparator
                                .comparing((ServicePricing r) -> r.getPriority() != null ? r.getPriority() : 0)
                                .thenComparing(r -> weightSpecificityScore(r.getMinWeight(), r.getMaxWeight()),
                                                Comparator.reverseOrder())
                                .thenComparing(r -> r.getMinWeight() != null ? r.getMinWeight() : BigDecimal.valueOf(-1),
                                                Comparator.reverseOrder())
                                .thenComparing(r -> r.getMaxWeight() != null ? r.getMaxWeight() : BigDecimal.valueOf(Double.MAX_VALUE));
        }

        private int weightSpecificityScore(BigDecimal min, BigDecimal max) {
                int s = 0;
                if (min != null) s++;
                if (max != null) s++;
                return s;
        }

        private boolean matchesWeight(BigDecimal minWeight, BigDecimal maxWeight, BigDecimal petWeight) {
                if (petWeight == null) return true;
                if (minWeight != null && petWeight.compareTo(minWeight) < 0) return false;
                if (maxWeight != null && petWeight.compareTo(maxWeight) > 0) return false;
                return true;
        }

        private boolean matchesPetType(String suitablePetTypes, String petTypeKey) {
                if (petTypeKey == null || petTypeKey.isBlank()) return true;
                if (suitablePetTypes == null || suitablePetTypes.isBlank()) return true;

                String trimmed = suitablePetTypes.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                        String inner = trimmed.substring(1, trimmed.length() - 1).trim();
                        if (inner.isBlank()) return true;
                        String[] parts = inner.split(",");
                        for (String p : parts) {
                                String v = p == null ? "" : p.trim();
                                v = v.replace("\"", "").replace("'", "").trim();
                                if (v.equalsIgnoreCase(petTypeKey)) return true;
                        }
                        return false;
                }

                String[] parts = trimmed.split(",");
                for (String p : parts) {
                        String v = p == null ? "" : p.trim();
                        if (v.isEmpty()) continue;
                        if (v.equalsIgnoreCase(petTypeKey)) return true;
                }
                return false;
        }

        private String normalizePetType(String petTypeRaw) {
                if (petTypeRaw == null) return "OTHER";
                String v = petTypeRaw.trim();
                if (v.isEmpty()) return "OTHER";
                String upper = v.toUpperCase(Locale.ENGLISH);
                return switch (upper) {
                        case "DOG", "CAT", "OTHER" -> upper;
                        case "CHO" -> "DOG";
                        case "MEO" -> "CAT";
                        default -> "OTHER";
                };
        }

        @Override
        @Transactional(readOnly = true)
        public List<BookingPaymentTransactionResponse> getPaymentTransactions(Long bookingId) {
                return bookingPaymentTransactionRepository.findByBookingIdOrderByPaidAtAsc(bookingId).stream()
                                .map(this::toTransactionResponse)
                                .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public List<BookingTransactionItemResponse> getBookingTransactions(Long bookingId) {
                List<BookingTransactionItemResponse> list = new ArrayList<>();
                for (fpt.teddypet.domain.entity.BookingDeposit d : bookingDepositRepository.findByBookingId(bookingId)) {
                        if (Boolean.TRUE.equals(d.getDepositPaid()) && d.getDepositPaidAt() != null && d.getDepositAmount() != null) {
                                list.add(new BookingTransactionItemResponse(
                                                "DEPOSIT",
                                                d.getId(),
                                                d.getDepositAmount(),
                                                d.getPaymentMethod(),
                                                d.getDepositPaidAt(),
                                                "PAID",
                                                "Thanh toán cọc",
                                                null,
                                                null,
                                                d.getNotes()
                                ));
                        }
                }
                for (BookingPaymentTransaction t : bookingPaymentTransactionRepository.findByBookingIdOrderByPaidAtAsc(bookingId)) {
                        String txType = t.getTransactionType() != null ? t.getTransactionType().trim().toUpperCase() : "";
                        String label = "Thanh toán hóa đơn";
                        if ("REFUND".equals(txType) || "DEPOSIT_REFUND".equals(txType)) {
                                label = "Hoàn lại tiền đặt cọc";
                        }
                        list.add(new BookingTransactionItemResponse(
                                        "INVOICE_PAYMENT",
                                        t.getId(),
                                        t.getAmount(),
                                        t.getPaymentMethod(),
                                        t.getPaidAt(),
                                        t.getStatus(),
                                        label,
                                        t.getTransactionReference(),
                                        t.getPaidByName(),
                                        t.getNote()
                        ));
                }
                list.sort(Comparator.comparing(BookingTransactionItemResponse::paidAt, Comparator.nullsLast(Comparator.naturalOrder())));
                return list;
        }

        @Override
        @Transactional
        public BookingPaymentTransactionResponse addPaymentTransaction(Long bookingId, CreateBookingPaymentTransactionRequest request) {
                Booking booking = getBookingOrThrow(bookingId);
                List<String> allowedStatuses = List.of("PENDING", "CONFIRMED", "READY", "COMPLETED");
                if (!allowedStatuses.contains(booking.getStatus().toUpperCase())) {
                        throw new IllegalStateException("Chỉ có thể thêm giao dịch thanh toán khi booking ở trạng thái PENDING, CONFIRMED, READY hoặc COMPLETED.");
                }

                String method = request.paymentMethod().trim().toUpperCase();
                if (!List.of("CASH", "BANK_TRANSFER", "VIETQR").contains(method)) {
                        throw new IllegalArgumentException("paymentMethod chỉ được phép: CASH, BANK_TRANSFER, VIETQR.");
                }
                String txStatus = (request.status() != null && !request.status().isBlank()) ? request.status().trim().toUpperCase() : "PENDING";
                if (!List.of("PENDING", "COMPLETED", "FAILED", "CANCELLED").contains(txStatus)) {
                        txStatus = "PENDING";
                }

                String noteValue = request.note() != null && !request.note().isBlank() ? request.note().trim() : null;
                BookingPaymentTransaction tx = BookingPaymentTransaction.builder()
                                .bookingId(bookingId)
                                .transactionType(request.transactionType().trim().toUpperCase())
                                .amount(request.amount())
                                .paymentMethod(method)
                                .transactionReference(request.transactionReference())
                                .paidBy(request.paidBy())
                                .paidByName(request.paidByName())
                                .paidAt(request.paidAt())
                                .receivedBy(request.receivedBy())
                                .status(txStatus)
                                .note(noteValue)
                                .build();
                tx = bookingPaymentTransactionRepository.save(tx);

                if ("COMPLETED".equals(txStatus)) {
                        recomputeBookingFromTransactions(bookingId);
                }
                return toTransactionResponse(tx);
        }

        @Override
        public String createPayosPaymentLink(Long bookingId, String returnUrl) {
                Booking booking = getBookingOrThrow(bookingId);
                BigDecimal remaining = booking.getRemainingAmount() != null ? booking.getRemainingAmount() : BigDecimal.ZERO;
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new IllegalStateException("Booking đã thanh toán đủ, không cần tạo link PayOS.");
                }

                // Dùng dải mã riêng cho booking invoice payment (khác deposit 900...).
                long payosOrderCode = 800_000_000_000L + bookingId;
                String description = "Thanh toan " + (booking.getBookingCode() != null ? booking.getBookingCode() : ("BK" + bookingId));
                String effectiveReturnUrl = (returnUrl != null && !returnUrl.isBlank()) ? returnUrl : frontendUrl;
                return payosGatewayAdapter.buildPaymentUrlByOrderCode(
                        payosOrderCode,
                        remaining.longValue(),
                        description,
                        effectiveReturnUrl
                );
        }

        /** Cập nhật booking: paid_amount = tổng COMPLETED transactions (+ deposit đã trả), remaining_amount, payment_method = JSON array, payment_status = PAID khi remaining = 0. */
        private void recomputeBookingFromTransactions(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;

                // Đã thanh toán từ cọc (deposit) — lấy tổng cọc đã trả
                BigDecimal depositPaidAmount = BigDecimal.ZERO;
                for (fpt.teddypet.domain.entity.BookingDeposit d : bookingDepositRepository.findByBookingId(bookingId)) {
                        if (Boolean.TRUE.equals(d.getDepositPaid()) && d.getDepositAmount() != null) {
                                depositPaidAmount = depositPaidAmount.add(d.getDepositAmount());
                        }
                }

                List<BookingPaymentTransaction> completed = bookingPaymentTransactionRepository.findByBookingIdOrderByPaidAtAsc(bookingId).stream()
                                .filter(t -> "COMPLETED".equals(t.getStatus()))
                                .toList();
                BigDecimal sumTransactions = completed.stream()
                                .map(BookingPaymentTransaction::getAmount)
                                .filter(java.util.Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal paidAmount = depositPaidAmount.add(sumTransactions);
                BigDecimal remaining = total.subtract(paidAmount).max(BigDecimal.ZERO);

                Set<String> methods = new LinkedHashSet<>();
                completed.stream()
                                .map(BookingPaymentTransaction::getPaymentMethod)
                                .filter(m -> m != null && !m.isBlank())
                                .forEach(methods::add);
                String paymentMethodJson = null;
                if (!methods.isEmpty()) {
                        try {
                                paymentMethodJson = OBJECT_MAPPER.writeValueAsString(List.copyOf(methods));
                        } catch (JsonProcessingException e) {
                                paymentMethodJson = String.join(", ", methods);
                        }
                }

                booking.setPaidAmount(paidAmount);
                booking.setRemainingAmount(remaining);
                if (paymentMethodJson != null) {
                        booking.setPaymentMethod(paymentMethodJson);
                }
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                        booking.setPaymentStatus("PAID");
                        booking.setPaidAmount(total);
                        booking.setRemainingAmount(BigDecimal.ZERO);
                }
                bookingRepository.save(booking);
        }

        private BookingPaymentTransactionResponse toTransactionResponse(BookingPaymentTransaction t) {
                return new BookingPaymentTransactionResponse(
                                t.getId(),
                                t.getBookingId(),
                                t.getTransactionType(),
                                t.getAmount(),
                                t.getPaymentMethod(),
                                t.getTransactionReference(),
                                t.getPaidBy(),
                                t.getPaidByName(),
                                t.getPaidAt(),
                                t.getReceivedBy(),
                                t.getStatus(),
                                t.getCreatedAt(),
                                t.getNote()
                );
        }

        /** Trả về payment_method để hiển thị: nếu là JSON array thì parse và join ", "; không thì trả về nguyên. */
        private String formatPaymentMethodForDisplay(String paymentMethod) {
                if (paymentMethod == null || paymentMethod.isBlank()) return paymentMethod;
                String s = paymentMethod.trim();
                if (!s.startsWith("[")) return s;
                try {
                        List<String> list = OBJECT_MAPPER.readValue(s, new TypeReference<>() {});
                        return list != null ? String.join(", ", list) : s;
                } catch (JsonProcessingException e) {
                        return s;
                }
        }

        private String serializePhotoUrls(List<String> urls) {
                if (urls == null) return null;
                try {
                        return OBJECT_MAPPER.writeValueAsString(urls);
                } catch (JsonProcessingException e) {
                        throw new IllegalStateException("Không thể serialize danh sách ảnh.", e);
                }
        }

        /** Ghi nhận ngày check-in thực tế trên từng booking_pet_service còn hiệu lực. */
        private void applyActualCheckInDateToActiveBookingPetServices(Booking booking, LocalDate checkInDate) {
                if (booking.getPets() == null) return;
                for (BookingPet pet : booking.getPets()) {
                        if (pet == null || pet.getServices() == null) continue;
                        for (BookingPetService bps : pet.getServices()) {
                                if (bps == null || !bps.isActive() || "CANCELLED".equalsIgnoreCase(bps.getStatus())) continue;
                                bps.setActualCheckInDate(checkInDate);
                        }
                }
        }

        /** Ghi nhận ngày check-out thực tế trên từng booking_pet_service còn hiệu lực. */
        private void applyActualCheckOutDateToActiveBookingPetServices(Booking booking, LocalDate checkOutDate) {
                if (booking.getPets() == null) return;
                for (BookingPet pet : booking.getPets()) {
                        if (pet == null || pet.getServices() == null) continue;
                        for (BookingPetService bps : pet.getServices()) {
                                if (bps == null || !bps.isActive() || "CANCELLED".equalsIgnoreCase(bps.getStatus())) continue;
                                bps.setActualCheckOutDate(checkOutDate);
                        }
                }
        }
}
