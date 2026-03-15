package fpt.teddypet.application.service.settings;

import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.SystemReceivingAccountService;
import fpt.teddypet.domain.entity.BankInformation;
import fpt.teddypet.domain.enums.banks.VietnamBankEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemReceivingAccountServiceImpl implements SystemReceivingAccountService {

    public static final String ACCOUNT_TYPE_SYSTEM_RECEIVING = "SYSTEM_RECEIVING";
    private static final String VIETQR_IMAGE_BASE = "https://img.vietqr.io/image/";

    /** Mã ngân hàng VietQR 8 chữ số (Napas) để build URL ảnh QR */
    private static final java.util.Map<String, String> BANK_CODE_TO_VIETQR_ID = java.util.Map.ofEntries(
            java.util.Map.entry("VCB", "970436"), java.util.Map.entry("BIDV", "970418"), java.util.Map.entry("CTG", "970415"),
            java.util.Map.entry("ACB", "970416"), java.util.Map.entry("TCB", "970407"), java.util.Map.entry("MBB", "970422"),
            java.util.Map.entry("VPB", "970432"), java.util.Map.entry("TPB", "970423"), java.util.Map.entry("SHB", "970443"),
            java.util.Map.entry("STB", "970403"), java.util.Map.entry("VIB", "970441"), java.util.Map.entry("HDB", "970437"),
            java.util.Map.entry("EIB", "970431"), java.util.Map.entry("OCB", "970448"), java.util.Map.entry("MSB", "970426"),
            java.util.Map.entry("SCB", "970429"), java.util.Map.entry("SGB", "970400"), java.util.Map.entry("BVB", "970438"),
            java.util.Map.entry("KLB", "970452"), java.util.Map.entry("ABB", "970425"), java.util.Map.entry("SEAB", "970440"),
            java.util.Map.entry("PGB", "970430"), java.util.Map.entry("NCB", "970419"), java.util.Map.entry("IVB", "970434"),
            java.util.Map.entry("VRB", "970427"), java.util.Map.entry("UOB", "970458"), java.util.Map.entry("HSBC", "970442"),
            java.util.Map.entry("SCVN", "970410"));

    private final BankInformationRepository bankInformationRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public BankInformationResponse getReceivingAccount() {
        return bankInformationRepository.findByAccountTypeAndIsDeletedFalse(ACCOUNT_TYPE_SYSTEM_RECEIVING)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public BankInformationResponse saveReceivingAccount(UpsertBankInformationRequest request) {
        VietnamBankEnum bank = VietnamBankEnum.fromCode(request.bankCode())
                .orElseThrow(() -> new IllegalArgumentException("bankCode không hợp lệ."));

        BankInformation entity = bankInformationRepository.findByAccountTypeAndIsDeletedFalse(ACCOUNT_TYPE_SYSTEM_RECEIVING)
                .orElseGet(() -> BankInformation.builder()
                        .userId(null)
                        .bookingId(null)
                        .accountType(ACCOUNT_TYPE_SYSTEM_RECEIVING)
                        .isVerify(true)
                        .isDefault(false)
                        .isActive(true)
                        .isDeleted(false)
                        .build());

        entity.setAccountNumber(request.accountNumber().trim());
        entity.setAccountHolderName(request.accountHolderName().trim());
        entity.setBankCode(bank.getBankCode());
        entity.setBankName(bank.getBankName());
        entity.setNote(request.note());
        entity.setUserId(authService.getCurrentUser().getId());

        String vietqrUrl = buildVietqrImageUrl(bank.getBankCode(), entity.getAccountNumber(), entity.getAccountHolderName());
        entity.setVietqrImageUrl(vietqrUrl);

        entity = bankInformationRepository.save(entity);
        return toResponse(entity);
    }

    private static String buildVietqrImageUrl(String bankCode, String accountNumber, String accountHolderName) {
        if (bankCode == null || accountNumber == null || accountHolderName == null) return null;
        String bankId = BANK_CODE_TO_VIETQR_ID.get(bankCode.trim().toUpperCase());
        if (bankId == null) return null;
        String encoded = URLEncoder.encode(accountHolderName.trim(), StandardCharsets.UTF_8);
        return VIETQR_IMAGE_BASE + bankId + "-" + accountNumber.trim() + "-compact2.jpg?accountName=" + encoded;
    }

    private BankInformationResponse toResponse(BankInformation b) {
        return new BankInformationResponse(
                b.getId(),
                b.getAccountNumber(),
                b.getAccountHolderName(),
                b.getBankCode(),
                b.getBankName(),
                b.isVerify(),
                b.isDefault(),
                b.getNote(),
                b.getBookingId(),
                b.getUserId() != null ? b.getUserId().toString() : null,
                b.getVietqrImageUrl(),
                b.getCreatedAt(),
                b.getUpdatedAt());
    }
}
