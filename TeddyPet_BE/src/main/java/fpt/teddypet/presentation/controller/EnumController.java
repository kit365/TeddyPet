package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/enums")
public class EnumController {

    @GetMapping("/pet-types")
    public ResponseEntity<ApiResponse<PetTypeEnum[]>> getPetTypes() {
        return ResponseEntity.ok(ApiResponse.success(PetTypeEnum.values()));
    }

    @GetMapping("/product-statuses")
    public ResponseEntity<ApiResponse<ProductStatusEnum[]>> getProductStatuses() {
        return ResponseEntity.ok(ApiResponse.success(ProductStatusEnum.values()));
    }

    @GetMapping("/product-types")
    public ResponseEntity<ApiResponse<ProductTypeEnum[]>> getProductTypes() {
        return ResponseEntity.ok(ApiResponse.success(ProductTypeEnum.values()));
    }
}
