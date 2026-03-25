package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import java.util.List;

public interface BookingDepositRefundPolicyClientService {
    List<BookingDepositRefundPolicyResponse> getAllActivePolicies();
}
