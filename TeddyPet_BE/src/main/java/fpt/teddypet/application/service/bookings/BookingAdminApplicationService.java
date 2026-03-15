package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveBookingCancelRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPaymentTransactionRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminPetFoodBroughtResponse;
import fpt.teddypet.application.dto.response.bookings.BookingPaymentTransactionResponse;
import fpt.teddypet.application.dto.response.bookings.BookingTransactionItemResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.domain.enums.bookings.BookingPaymentMethodEnum;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPaymentTransaction;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPaymentTransactionRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceItemRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffProfileRepository;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import fpt.teddypet.application.service.dashboard.DashboardService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class BookingAdminApplicationService implements BookingAdminService {

        private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

        private final BookingRepository bookingRepository;
        private final BookingPetServiceItemRepository bookingPetServiceItemRepository;
        private final ServiceRepositoryPort serviceRepositoryPort;
        private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository;
        private final BookingPaymentTransactionRepository bookingPaymentTransactionRepository;
        private final TimeSlotBookingRepository timeSlotBookingRepository;
        private final StaffProfileRepository staffProfileRepository;
        private final EmailServicePort emailServicePort;
        private final DashboardService dashboardService;

        public BookingAdminApplicationService(
                        BookingRepository bookingRepository,
                        BookingPetServiceItemRepository bookingPetServiceItemRepository,
                        ServiceRepositoryPort serviceRepositoryPort,
                        fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository,
                        BookingPaymentTransactionRepository bookingPaymentTransactionRepository,
                        TimeSlotBookingRepository timeSlotBookingRepository,
                        StaffProfileRepository staffProfileRepository,
                        EmailServicePort emailServicePort,
                        @Lazy DashboardService dashboardService) {
                this.bookingRepository = bookingRepository;
                this.bookingPetServiceItemRepository = bookingPetServiceItemRepository;
                this.serviceRepositoryPort = serviceRepositoryPort;
                this.bookingDepositRepository = bookingDepositRepository;
                this.bookingPaymentTransactionRepository = bookingPaymentTransactionRepository;
                this.timeSlotBookingRepository = timeSlotBookingRepository;
                this.staffProfileRepository = staffProfileRepository;
                this.emailServicePort = emailServicePort;
                this.dashboardService = dashboardService;
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
                                                null, // petType chưa có trong entity
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
                                            booking.getCustomerEmail(), booking.getBookingCode(), refundAmountFormatted);
                                } catch (Exception emailEx) {
                                        System.out.println("Failed to send refund-approved email for booking " + booking.getBookingCode() + ": " + emailEx);
                                }
                            }
                        }
                } else {
                        // Reject cancel request: revert to PENDING and clear cancel fields
                        booking.setStatus("PENDING");
                        booking.setCancelRequested(false);
                        booking.setCancelledAt(null);
                        booking.setCancelledBy(null);
                        booking.setCancelledReason(null);
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
                String assignedStaffName = null;
                if (svc.getAssignedStaffId() != null) {
                        assignedStaffName = staffProfileRepository.findById(svc.getAssignedStaffId())
                                        .map(fpt.teddypet.domain.entity.staff.StaffProfile::getFullName)
                                        .orElse(null);
                }
                return new AdminBookingPetServiceResponse(
                                svc.getId(),
                                svc.getBookingPet() != null ? svc.getBookingPet().getId() : null,
                                svc.getAssignedStaffId(),
                                assignedStaffName,
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
                                svc.getService() != null ? svc.getService().getIsRequiredRoom() : null,
                                items);
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
                booking.setBookingCheckInDate(LocalDateTime.now());
                bookingRepository.save(booking);
                return toListItem(booking);
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse checkOut(Long bookingId) {
                Booking booking = getBookingOrThrow(bookingId);
                booking.setBookingCheckOutDate(LocalDateTime.now());
                bookingRepository.save(booking);
                return toListItem(booking);
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
                        list.add(new BookingTransactionItemResponse(
                                        "INVOICE_PAYMENT",
                                        t.getId(),
                                        t.getAmount(),
                                        t.getPaymentMethod(),
                                        t.getPaidAt(),
                                        t.getStatus(),
                                        "Thanh toán hóa đơn",
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
}
