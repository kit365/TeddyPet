package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.util.List;

public record AdminCheckInRepricePreviewResponse(
        BigDecimal oldTotal,
        BigDecimal newTotal,
        BigDecimal paidAmount,
        BigDecimal oldRemaining,
        BigDecimal newRemaining,
        List<PetInfoDiff> petDiffs,
        List<ServicePriceDiff> serviceDiffs,
        List<ItemPriceDiff> itemDiffs
) {
    public record PetInfoDiff(
            Long petId,
            String petName,
            String oldPetType,
            String newPetType,
            BigDecimal oldWeight,
            BigDecimal newWeight
    ) {
    }

    public record ServicePriceDiff(
            Long petId,
            String petName,
            Long bookingPetServiceId,
            Long serviceId,
            String serviceName,
            boolean requiresRoom,
            Integer numberOfNights,
            BigDecimal oldUnitPrice,
            BigDecimal newUnitPrice,
            BigDecimal oldSubtotal,
            BigDecimal newSubtotal,
            BigDecimal delta
    ) {
    }

    public record ItemPriceDiff(
            Long petId,
            String petName,
            Long bookingPetServiceId,
            Long itemId,
            Long itemServiceId,
            String itemServiceName,
            String itemType,
            BigDecimal oldUnitPrice,
            BigDecimal newUnitPrice,
            BigDecimal oldSubtotal,
            BigDecimal newSubtotal,
            BigDecimal delta
    ) {
    }
}

