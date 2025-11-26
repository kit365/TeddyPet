package fpt.teddypet.application.dto.response.orders.order;
import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        Long variantId,
        String productName,
        String variantName,
        String imageUrl,
        String altImage,
        Integer quantity,
        BigDecimal unitPrice, // Giá lúc mua
        BigDecimal totalPrice // Tổng tiền dòng này

) {
}
