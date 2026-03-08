package fpt.teddypet.application.dto.response.service.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.PetTypeEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceResponse(
        Long serviceId,
        Long serviceCategoryId,
        String code,
        String serviceName,
        List<PetTypeEnum> suitablePetTypes,
        String slug,
        String shortDescription,
        String description,
        String priceUnit,
        Integer duration,
        Integer bufferTime,
        BigDecimal basePrice,
        Integer maxPetsPerSession,
        Integer advanceBookingHours,
        Integer cancellationDeadlineHours,
        String imageURL,
        List<String> galleryImages,
        Integer requiredStaffCount,
        String requiredCertifications,
        Boolean requiresVaccination,
        Integer displayOrder,
        Boolean isPopular,
        Boolean isAddon,
        Boolean isAdditionalCharge,
        Boolean isCritical,
        String addonType,
        String metaTitle,
        String metaDescription,
        @JsonProperty("isActive")
        boolean isActive,
        Boolean isRequiredRoom,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}
