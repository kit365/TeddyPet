//package fpt.teddypet.presentation.controller.banks;
//
//import fpt.teddypet.application.dto.common.ApiResponse;
//import fpt.teddypet.application.dto.response.banks.BankOptionResponse;
//import fpt.teddypet.domain.enums.banks.VietnamBankEnum;
//import fpt.teddypet.presentation.constants.ApiConstants;
//import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.tags.Tag;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.List;
//
//@RestController
//@RequestMapping(ApiConstants.API_BANKS)
//@Tag(name = "Banks", description = "Danh sách ngân hàng (Vietnam)")
//public class BankController {
//
//    @GetMapping
//    @Operation(summary = "Danh sách ngân hàng")
//    public ResponseEntity<ApiResponse<List<BankOptionResponse>>> getAll() {
//        List<BankOptionResponse> list = VietnamBankEnum.valuesList().stream()
//                .map(b -> new BankOptionResponse(b.getBankCode(), b.getBankName()))
//                .toList();
//        return ResponseEntity.ok(ApiResponse.success(list));
//    }
//}
//
