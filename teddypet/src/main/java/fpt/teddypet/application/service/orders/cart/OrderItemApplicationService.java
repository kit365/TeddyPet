package fpt.teddypet.application.service.orders.cart;
import fpt.teddypet.application.constants.orders.order.OrderLogMessages;
import fpt.teddypet.application.dto.request.orders.order.OrderItemRequest;
import fpt.teddypet.application.mapper.orders.order.OrderItemMapper;
import fpt.teddypet.application.port.input.orders.order.OrderItemService;
import fpt.teddypet.application.port.input.products.ProductVariantService;
import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.ProductVariant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderItemApplicationService implements OrderItemService {

    private final ProductVariantService productVariantService;
    private final OrderItemMapper orderItemMapper;

    @Override
    public OrderItem createOrderItemFromRequest(OrderItemRequest request) {
        log.info(OrderLogMessages.LOG_ORDER_VALIDATE_VARIANT, request.variantId());

        ProductVariant variant = productVariantService.getByIdForCart(request.variantId());

        if (variant.isDeleted() || !variant.isActive()) {
            String variantName = variant.getName() != null
                    ? variant.getName()
                    : variant.getProduct().getName();
            throw new IllegalStateException(
                    String.format("Sản phẩm %s không khả dụng.", variantName));
        }


        int availableStock = variant.getStockQuantity().getValue();
        String variantName = variant.getName() != null
                ? variant.getName()
                : variant.getProduct().getName();

        log.info(OrderLogMessages.LOG_ORDER_VALIDATE_STOCK,
                variant.getVariantId(), availableStock, request.quantity());

        if (availableStock <= 0) {
            throw new IllegalStateException(
                    String.format("Sản phẩm %s không đủ hàng. Còn lại: %d", variantName, 0));
        }

        if (request.quantity() > availableStock) {
            throw new IllegalStateException(
                    String.format("Sản phẩm %s không đủ hàng. Còn lại: %d", variantName, availableStock));
        }


        OrderItem orderItem = orderItemMapper.toEntity(request, variant);


        BigDecimal unitPrice = variant.getPrice().getAmount();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));
        orderItem.setUnitPrice(unitPrice);
        orderItem.setTotalPrice(totalPrice);
        orderItem.setProductName(variant.getProduct().getName());
        orderItem.setVariantName(variant.getName());
        orderItem.setSku(variant.getSku().getValue());
        orderItem.setImageUrl(variant.getFeaturedImage() != null ? variant.getFeaturedImage().getImageUrl() : null);
        orderItem.setAltImage(variant.getFeaturedImage() != null ? variant.getFeaturedImage().getAltText() : null);
        return orderItem;
    }

    @Override
    public List<OrderItem> createOrderItemsFromRequests(List<OrderItemRequest> requests) {
        return requests.stream()
                .map(this::createOrderItemFromRequest)
                .toList();
    }
}
