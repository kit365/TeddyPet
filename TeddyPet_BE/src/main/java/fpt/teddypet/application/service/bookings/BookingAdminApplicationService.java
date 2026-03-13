package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveBookingCancelRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminPetFoodBroughtResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceItemRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import org.springframework.context.annotation.Lazy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import fpt.teddypet.application.service.dashboard.DashboardService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class BookingAdminApplicationService implements BookingAdminService {

        private final BookingRepository bookingRepository;
        private final BookingPetServiceItemRepository bookingPetServiceItemRepository;
        private final ServiceRepositoryPort serviceRepositoryPort;
        private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository;
        private final TimeSlotBookingRepository timeSlotBookingRepository;
        private final EmailServicePort emailServicePort;
        private final DashboardService dashboardService;

        public BookingAdminApplicationService(
                        BookingRepository bookingRepository,
                        BookingPetServiceItemRepository bookingPetServiceItemRepository,
                        ServiceRepositoryPort serviceRepositoryPort,
                        fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository,
                        TimeSlotBookingRepository timeSlotBookingRepository,
                        EmailServicePort emailServicePort,
                        @Lazy DashboardService dashboardService) {
                this.bookingRepository = bookingRepository;
                this.bookingPetServiceItemRepository = bookingPetServiceItemRepository;
                this.serviceRepositoryPort = serviceRepositoryPort;
                this.bookingDepositRepository = bookingDepositRepository;
                this.timeSlotBookingRepository = timeSlotBookingRepository;
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
                                booking.getPaymentMethod(),
                                booking.getStatus(),
                                cancelRequested,
                                booking.getCancelledBy(),
                                booking.getCancelledReason(),
                                booking.getCancelledAt(),
                                booking.getInternalNotes(),
                                booking.getBookingStartDate(),
                                booking.getBookingEndDate(),
                                booking.getCreatedAt(),
                                booking.getUpdatedAt());
        }

        private AdminBookingPetServiceResponse toServiceResponse(fpt.teddypet.domain.entity.BookingPetService svc) {
                List<AdminBookingPetServiceItemResponse> items = (svc.getItems() != null ? svc.getItems()
                                : Collections.<BookingPetServiceItem>emptyList()).stream()
                                .map(this::toItemResponse)
                                .toList();
                return new AdminBookingPetServiceResponse(
                                svc.getId(),
                                svc.getBookingPet() != null ? svc.getBookingPet().getId() : null,
                                svc.getAssignedStaffId(),
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
                                items);
        }

        private Booking getBookingOrThrow(Long id) {
                return bookingRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy booking với id: " + id));
        }

        @Override
        @Transactional
        public AdminBookingListItemResponse confirmFullPayment(Long bookingId, fpt.teddypet.application.dto.request.bookings.ConfirmFullPaymentRequest request) {
                if (request == null || request.paymentMethod() == null) {
                        throw new IllegalArgumentException("paymentMethod là bắt buộc.");
                }

                Booking booking = getBookingOrThrow(bookingId);

                // Only allow setting payment method when booking is COMPLETED and fully paid
                if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
                        throw new IllegalStateException("Chỉ có thể xác nhận thanh toán khi booking ở trạng thái COMPLETED.");
                }

                // Check if booking is fully paid (paidAmount >= totalAmount)
                if (booking.getPaidAmount() == null || booking.getTotalAmount() == null ||
                    booking.getPaidAmount().compareTo(booking.getTotalAmount()) < 0) {
                        throw new IllegalStateException("Booking chưa được thanh toán đầy đủ. Không thể xác nhận thanh toán.");
                }

                // Set payment method
                booking.setPaymentMethod(request.paymentMethod());
                booking.setPaymentStatus("PAID");
                if (request.notes() != null && !request.notes().isBlank()) {
                        booking.setInternalNotes(request.notes().trim());
                }

                bookingRepository.save(booking);
                return toListItem(booking);
        }
}
