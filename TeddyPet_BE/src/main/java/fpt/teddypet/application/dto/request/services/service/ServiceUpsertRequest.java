package fpt.teddypet.application.dto.request.services.service;

import jakarta.validation.constraints.*;
import fpt.teddypet.domain.enums.PetTypeEnum;
import java.math.BigDecimal;
import java.util.List;

public record ServiceUpsertRequest(
        Long serviceId,
        @NotNull(message = "Danh mục dịch vụ là bắt buộc")
        Long serviceCategoryId,
        @NotBlank(message = "Mã dịch vụ là bắt buộc")
        @Size(max = 50)
        String code,
        @NotBlank(message = "Tên dịch vụ là bắt buộc")
        @Size(max = 255)
        String serviceName,
        List<PetTypeEnum> suitablePetTypes,
        String slug,
        @Size(max = 500)
        String shortDescription,
        String description,
        @NotNull(message = "Thời lượng là bắt buộc")
        @Min(1)
        Integer duration,
        Integer bufferTime,
        BigDecimal basePrice,
        Integer maxPetsPerSession,
        Integer advanceBookingHours,
        Integer cancellationDeadlineHours,
        @Size(max = 255)
        String imageURL,
        List<String> galleryImages,
        Integer requiredStaffCount,
        String requiredCertifications,
        Boolean requiresVaccination,
        Integer displayOrder,
        Boolean isPopular,
        Boolean isAddon,
        Boolean isCritical,
        @Size(max = 50)
        String addonType,
        @Size(max = 255)
        String metaTitle,
        @Size(max = 500)
        String metaDescription,
        Boolean isActive
) {
}
