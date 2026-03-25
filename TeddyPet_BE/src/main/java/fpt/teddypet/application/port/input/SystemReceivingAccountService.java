package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;

/**
 * Tài khoản nhận tiền khi thanh toán online (PayOS) - một bản ghi duy nhất trong bank_information (account_type = SYSTEM_RECEIVING).
 */
public interface SystemReceivingAccountService {

    /**
     * Lấy thông tin tài khoản nhận tiền hệ thống (có thể null nếu chưa cấu hình).
     */
    BankInformationResponse getReceivingAccount();

    /**
     * Lưu/cập nhật tài khoản nhận tiền (tạo mới nếu chưa có, cập nhật nếu đã có).
     */
    BankInformationResponse saveReceivingAccount(UpsertBankInformationRequest request);
}
