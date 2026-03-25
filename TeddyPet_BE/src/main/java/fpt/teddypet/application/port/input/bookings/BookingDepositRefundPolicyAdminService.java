package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.UpsertBookingDepositRefundPolicyRequest;
import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;

import java.util.List;

public interface BookingDepositRefundPolicyAdminService {
    List<BookingDepositRefundPolicyResponse> getAll();

    BookingDepositRefundPolicyResponse create(UpsertBookingDepositRefundPolicyRequest request);

    BookingDepositRefundPolicyResponse update(Long id, UpsertBookingDepositRefundPolicyRequest request);

    void delete(Long id);
}

