package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckInConfirmRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckInRepricePreviewRequest;
import fpt.teddypet.application.dto.request.bookings.AdminCheckOutConfirmRequest;
import fpt.teddypet.application.dto.request.bookings.CancelBookingPetServiceRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPaymentTransactionRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.AdminCheckInRepricePreviewResponse;
import fpt.teddypet.application.dto.response.bookings.BookingPaymentTransactionResponse;
import fpt.teddypet.application.dto.response.bookings.BookingTransactionItemResponse;

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

    AdminBookingListItemResponse confirmReadyToWork(Long bookingId, fpt.teddypet.application.dto.request.bookings.ConfirmBookingReadyRequest request);

    AdminBookingListItemResponse confirmFullPayment(Long bookingId, fpt.teddypet.application.dto.request.bookings.ConfirmFullPaymentRequest request);

    AdminBookingListItemResponse checkIn(Long bookingId);

    AdminBookingListItemResponse checkOut(Long bookingId, AdminCheckOutConfirmRequest request);

    AdminCheckInRepricePreviewResponse previewCheckInReprice(Long bookingId, AdminCheckInRepricePreviewRequest request);

    AdminBookingListItemResponse confirmCheckInWithReprice(Long bookingId, AdminCheckInConfirmRequest request);

    AdminBookingListItemResponse cancelBookingPetService(Long bookingId, Long bookingPetServiceId, CancelBookingPetServiceRequest request);

    AdminBookingListItemResponse cancelBookingPetServiceItem(Long bookingId, Long itemId, CancelBookingPetServiceRequest request);

    BookingPaymentTransactionResponse addPaymentTransaction(Long bookingId, CreateBookingPaymentTransactionRequest request);

    List<BookingPaymentTransactionResponse> getPaymentTransactions(Long bookingId);

    /** Danh sách giao dịch chi tiết: cọc (booking_deposits) + thanh toán hóa đơn (booking_payment_transactions), sắp xếp theo thời gian. */
    List<BookingTransactionItemResponse> getBookingTransactions(Long bookingId);

    AdminBookingListItemResponse updateInternalNotes(Long bookingId, fpt.teddypet.application.dto.request.bookings.UpdateBookingInternalNotesRequest request);
}

