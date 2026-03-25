package fpt.teddypet.application.dto.request.services.service;

import jakarta.validation.constraints.*;
import fpt.teddypet.domain.enums.PetTypeEnum;
import java.math.BigDecimal;
import java.util.List;

public record ServiceUpsertRequest(
                Long serviceId,
                @NotNull(message = "Danh mục dịch vụ là bắt buộc") Long serviceCategoryId,
                @NotNull(message = "Kỹ năng là bắt buộc") Long skillId,
                @NotBlank(message = "Mã dịch vụ là bắt buộc") @Size(max = 50) String code,
                @NotBlank(message = "Tên dịch vụ là bắt buộc") @Size(max = 255) String serviceName,
                List<PetTypeEnum> suitablePetTypes,
                String slug,
                @Size(max = 500) String shortDescription,
                String description,
                @NotNull(message = "Thời lượng là bắt buộc") @Min(1) Integer duration,
                Integer bufferTime,
                BigDecimal basePrice,
                Integer maxPetsPerSession,
                Integer advanceBookingHours,
                @Size(max = 255) String imageURL,
                List<String> galleryImages,
                Integer requiredStaffCount,
                String requiredCertifications,
                Boolean requiresVaccination,
                Integer displayOrder,
                Boolean isAddon,
                Boolean isAdditionalCharge,
                /*
                Boolean isPopular,
                Boolean isCritical,
                @Size(max = 50) String addonType,
                Integer cancellationDeadlineHours,
                */
                @Size(max = 255) String metaTitle,
                @Size(max = 500) String metaDescription,
                Boolean isActive,
                Boolean isRequiredRoom
                /*
                // Refund Policy
                ,BigDecimal beforeDeadlineRefundPct,
                BigDecimal afterDeadlineRefundPct,
                BigDecimal noShowRefundPct,
                BigDecimal noShowPenalty,
                Boolean allowReschedule,
                Integer rescheduleDeadlineHours,
                Integer rescheduleLimit,
                Boolean allowForceMajeure,
                BigDecimal forceMajeureRefundPct
                */
                ) {
}
