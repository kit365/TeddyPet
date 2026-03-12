package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;

import java.util.List;

public interface BookingAdminService {

    List<AdminBookingListItemResponse> getAll();

    AdminBookingListItemResponse getBookingBasic(Long id);

    List<AdminBookingPetResponse> getPets(Long bookingId);

    AdminBookingPetResponse getPetDetail(Long bookingId, Long petId);

    AdminBookingPetServiceResponse getServiceDetail(Long bookingId, Long petId, Long serviceId);

    AdminBookingPetServiceItemResponse addChargeItem(Long bookingId, Long petId, Long bookingPetServiceId, AddChargeItemRequest request);

    AdminBookingPetServiceItemResponse approveChargeItem(Long bookingId, Long petId, Long bookingPetServiceId, Long itemId, ApproveChargeItemRequest request);

    AdminBookingListItemResponse approveOrRejectCancelRequest(Long bookingId, fpt.teddypet.application.dto.request.bookings.ApproveBookingCancelRequest request);
}

