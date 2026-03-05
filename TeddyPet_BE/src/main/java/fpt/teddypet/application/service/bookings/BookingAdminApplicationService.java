package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminPetFoodBroughtResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingAdminApplicationService implements BookingAdminService {

    private final BookingRepository bookingRepository;

    @Override
    public List<AdminBookingListItemResponse> getAll() {
        return bookingRepository.findAll().stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
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
                                        f.getFeedingInstructions()
                                ))
                                .toList(),
                        pet.getServices().stream()
                                .map(this::toServiceResponse)
                                .toList()
                ))
                .toList();
    }

    @Override
    public AdminBookingPetResponse getPetDetail(Long bookingId, Long petId) {
        return getPets(bookingId).stream()
                .filter(p -> p.id().equals(petId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thú cưng trong booking."));
    }

    @Override
    public AdminBookingPetServiceResponse getServiceDetail(Long bookingId, Long petId, Long serviceId) {
        AdminBookingPetResponse pet = getPetDetail(bookingId, petId);
        return pet.services().stream()
                .filter(s -> s.id().equals(serviceId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ trong booking."));
    }

    private AdminBookingListItemResponse toListItem(Booking booking) {
        return new AdminBookingListItemResponse(
                booking.getId() != null ? booking.getId().toString() : null,
                booking.getBookingCode(),
                booking.getCustomerName(),
                booking.getCustomerEmail(),
                booking.getCustomerPhone(),
                booking.getCustomerPhone(), // FE hiện chưa dùng customerAddress nhiều; có thể thay bằng field address sau
                booking.getBookingType(),
                booking.getTotalAmount(),
                booking.getPaidAmount(),
                booking.getRemainingAmount(),
                booking.getDeposit(),
                booking.getPaymentStatus(),
                booking.getPaymentMethod(),
                booking.getStatus(),
                booking.getInternalNotes(),
                booking.getBookingStartDate(),
                booking.getBookingEndDate(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }

    private AdminBookingPetServiceResponse toServiceResponse(fpt.teddypet.domain.entity.BookingPetService svc) {
        return new AdminBookingPetServiceResponse(
                svc.getId(),
                svc.getBookingPet() != null ? svc.getBookingPet().getId() : null,
                svc.getAssignedStaffId(),
                svc.getService() != null ? svc.getService().getId() : null,
                svc.getServiceCombo() != null ? svc.getServiceCombo().getId() : null,
                svc.getService() != null ? svc.getService().getServiceName() : null,
                svc.getTimeSlotId(),
                svc.getRoomId(),
                svc.getCheckInDate(),
                svc.getCheckOutDate(),
                svc.getNumberOfNights(),
                svc.getScheduledStartTime(),
                svc.getScheduledEndTime(),
                svc.getActualStartTime(),
                svc.getActualEndTime(),
                svc.getUnitPrice(),
                svc.getSubtotal(),
                svc.getStatus(),
                svc.getStaffNotes(),
                svc.getCustomerRating(),
                svc.getCustomerReview(),
                svc.getDuringPhotos(),
                svc.getAfterPhotos(),
                svc.getBeforePhotos(),
                svc.getVideos()
        );
    }

    private Booking getBookingOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking với id: " + id));
    }
}

