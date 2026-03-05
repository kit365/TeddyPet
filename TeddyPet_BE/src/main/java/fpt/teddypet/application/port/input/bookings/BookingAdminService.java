package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;

import java.util.List;

public interface BookingAdminService {

    List<AdminBookingListItemResponse> getAll();

    AdminBookingListItemResponse getBookingBasic(Long id);

    List<AdminBookingPetResponse> getPets(Long bookingId);

    AdminBookingPetResponse getPetDetail(Long bookingId, Long petId);

    AdminBookingPetServiceResponse getServiceDetail(Long bookingId, Long petId, Long serviceId);
}

