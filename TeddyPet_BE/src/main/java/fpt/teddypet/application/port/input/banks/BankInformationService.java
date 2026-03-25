package fpt.teddypet.application.port.input.banks;

import fpt.teddypet.application.dto.request.banks.SetDefaultBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.VerifyBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;

import java.util.List;

public interface BankInformationService {
    List<BankInformationResponse> getMyBanks();

    BankInformationResponse createMyBank(UpsertBankInformationRequest request);

    BankInformationResponse updateMyBank(Long id, UpsertBankInformationRequest request);

    BankInformationResponse setMyDefault(Long bankInfoId, SetDefaultBankInformationRequest request);

    BankInformationResponse verifyBank(Long bankInfoId, VerifyBankInformationRequest request);

    BankInformationResponse createGuestBankForBookingCode(String bookingCode, UpsertBankInformationRequest request);

    BankInformationResponse createGuestBankForOrderCode(String orderCode, UpsertBankInformationRequest request);

    BankInformationResponse getBankForBookingCode(String bookingCode);

    /** Lấy thông tin chuyển khoản đã lưu theo email khách (guest) để pre-fill khi order/booking với cùng email */
    BankInformationResponse getBankByGuestEmail(String email);

    /** Lấy bank info liên quan đến 1 đơn hàng (order_id) nếu có */
    BankInformationResponse getBankForOrderId(String orderId);

    List<BankInformationResponse> getAllForVerify(Boolean verifiedOnly);
}

