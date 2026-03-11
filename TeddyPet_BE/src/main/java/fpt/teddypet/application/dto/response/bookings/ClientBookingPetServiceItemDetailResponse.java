package fpt.teddypet.application.dto.response.bookings;

public record ClientBookingPetServiceItemDetailResponse(
        Long id,
        String itemName,
        Integer quantity,
        java.math.BigDecimal price,
        java.math.BigDecimal subtotal) {
}
