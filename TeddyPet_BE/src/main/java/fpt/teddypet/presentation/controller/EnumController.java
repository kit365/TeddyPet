package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/enums")
public class EnumController {

    @GetMapping("/pet-types")
    public ResponseEntity<ApiResponse<List<String>>> getPetTypes() {
        // Only expose Dog/Cat for UI selection (exclude OTHER).
        List<String> values = List.of(PetTypeEnum.DOG.name(), PetTypeEnum.CAT.name());
        return ResponseEntity.ok(ApiResponse.success(values));
    }
}

