package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminPetFoodBroughtResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceItemRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingAdminApplicationService implements BookingAdminService {

        private final BookingRepository bookingRepository;
        private final BookingPetServiceItemRepository bookingPetServiceItemRepository;
        private final ServiceRepositoryPort serviceRepositoryPort;
        private final fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository bookingDepositRepository;

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
                if (!deposits.isEmpty()) {
                        depositPaid = deposits.get(0).getDepositPaid() != null ? deposits.get(0).getDepositPaid()
                                        : false;
                }

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
                                depositPaid,
                                booking.getPaymentStatus(),
                                booking.getPaymentMethod(),
                                booking.getStatus(),
                                booking.getInternalNotes(),
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
}
