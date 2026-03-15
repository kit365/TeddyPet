package fpt.teddypet.presentation.controller.settings;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.settings.AppSettingUpsertRequest;
import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.response.settings.AppSettingResponse;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;
import fpt.teddypet.application.port.input.AppSettingService;
import fpt.teddypet.application.port.input.SystemReceivingAccountService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository;
import fpt.teddypet.domain.enums.settings.AppSettingEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(ApiConstants.API_SETTINGS)
@CrossOrigin
@Tag(name = "Cài đặt", description = "API quản lý cấu hình hệ thống")
@RequiredArgsConstructor
public class AppSettingController {

    private final AppSettingService appSettingService;
    private final AppSettingRepository appSettingRepository;
    private final SystemReceivingAccountService systemReceivingAccountService;

    @GetMapping
    @Operation(summary = "Lấy tất cả cài đặt")
    public ResponseEntity<ApiResponse<List<AppSettingResponse>>> getAllSettings() {
        List<AppSettingResponse> settings = appSettingRepository.findAll().stream()
                .map(s -> new AppSettingResponse(s.getSettingKey(), s.getSettingValue(), s.getDescription()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/keys")
    @Operation(summary = "Lấy danh sách các key cài đặt khả dụng")
    public ResponseEntity<ApiResponse<List<AppSettingEnum>>> getSettingKeys() {
        return ResponseEntity.ok(ApiResponse.success(Arrays.asList(AppSettingEnum.values())));
    }

    @GetMapping("/{key}")
    @Operation(summary = "Lấy cài đặt theo key")
    public ResponseEntity<ApiResponse<String>> getSetting(@PathVariable String key) {
        String value = appSettingService.getSetting(key, null);
        return ResponseEntity.ok(ApiResponse.success(value));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Cập nhật cài đặt")
    public ResponseEntity<ApiResponse<Void>> updateSetting(@PathVariable String key,
            @RequestBody AppSettingUpsertRequest request) {
        appSettingService.saveSetting(key, request.settingValue(), request.description());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/receiving-account")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "[Admin] Lấy thông tin tài khoản nhận tiền (thanh toán online PayOS)")
    public ResponseEntity<ApiResponse<BankInformationResponse>> getReceivingAccount() {
        BankInformationResponse data = systemReceivingAccountService.getReceivingAccount();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping("/receiving-account")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "[Admin] Lưu/cập nhật tài khoản nhận tiền")
    public ResponseEntity<ApiResponse<BankInformationResponse>> saveReceivingAccount(
            @Valid @RequestBody UpsertBankInformationRequest request) {
        BankInformationResponse data = systemReceivingAccountService.saveReceivingAccount(request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
