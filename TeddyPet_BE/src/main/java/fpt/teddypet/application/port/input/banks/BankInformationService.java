package fpt.teddypet.application.port.input.banks;

import fpt.teddypet.application.dto.request.banks.SetDefaultBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.VerifyBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;

import java.util.List;

public interface BankInformationService {
    List<BankInformationResponse> getMyBanks();

    BankInformationResponse createMyBank(UpsertBankInformationRequest request);

    BankInformationResponse setMyDefault(Long bankInfoId, SetDefaultBankInformationRequest request);

    BankInformationResponse verifyBank(Long bankInfoId, VerifyBankInformationRequest request);

    BankInformationResponse createGuestBankForBookingCode(String bookingCode, UpsertBankInformationRequest request);

    BankInformationResponse getBankForBookingCode(String bookingCode);

    List<BankInformationResponse> getAllForVerify(Boolean verifiedOnly);
}

