package fpt.teddypet.application.dto.response.service.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.PetTypeEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceResponse(
                Long serviceId,
                Long serviceCategoryId,
                Long skillId,
                String skillName,
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
                String imageURL,
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
                String addonType,
                Integer cancellationDeadlineHours,
                */
                String metaTitle,
                String metaDescription,
                @JsonProperty("isActive") boolean isActive,
                Boolean isRequiredRoom,
                /*
                // Refund Policy
                BigDecimal beforeDeadlineRefundPct,
                BigDecimal afterDeadlineRefundPct,
                BigDecimal noShowRefundPct,
                BigDecimal noShowPenalty,
                Boolean allowReschedule,
                Integer rescheduleDeadlineHours,
                Integer rescheduleLimit,
                Boolean allowForceMajeure,
                BigDecimal forceMajeureRefundPct,
                */
                boolean isDeleted,
                /** Cấu hình No-Show đang gán (null = chưa gán). */
                Long noShowConfigId,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                String createdBy,
                String updatedBy) {
}
