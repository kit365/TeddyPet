package fpt.teddypet.application.service.orders;

import fpt.teddypet.application.dto.response.orders.cart.CartItemResponse;
import fpt.teddypet.application.mapper.orders.cart.CartItemMapper;
import fpt.teddypet.application.port.input.orders.cart.CartItemService;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.infrastructure.persistence.mongodb.document.CartItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartItemApplicationService implements CartItemService {

    private final CartItemMapper cartItemMapper;

    @Override
    public CartItemResponse toResponse(CartItem cartItem, ProductVariant variant) {
        if (cartItem == null) {
            return null;
        }

        return cartItemMapper.toResponse(
                cartItem.getVariantId(),
                extractSku(variant),
                extractProductName(variant),
                extractVariantName(variant),
                extractFeaturedImageUrl(variant),
                extractAltImage(variant),
                extractPrice(variant),
                extractSalePrice(variant),
                calculateFinalPrice(variant),
                cartItem.getQuantity(),
                calculateSubTotal(variant, cartItem.getQuantity()),
                extractStockQuantity(variant),
                checkAvailability(variant)
        );
    }

    @Override
    public List<CartItemResponse> toResponses(List<CartItem> cartItems, List<ProductVariant> variants) {
        if (cartItems == null || cartItems.isEmpty()) {
            return List.of();
        }

        Map<Long, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getVariantId, v -> v));

        return cartItems.stream()
                .map(cartItem -> {
                    ProductVariant variant = variantMap.get(cartItem.getVariantId());
                    return toResponse(cartItem, variant);
                })
                .filter(Objects::nonNull)
                .toList();
    }



    private String extractSku(ProductVariant variant) {
        return variant != null && variant.getSku() != null ? variant.getSku().getValue() : null;
    }

    private String extractProductName(ProductVariant variant) {
        return variant != null && variant.getProduct() != null ? variant.getProduct().getName() : null;
    }

    private String extractVariantName(ProductVariant variant) {
        return variant != null ? variant.getName() : null;
    }

    private String extractFeaturedImageUrl(ProductVariant variant) {
        return variant != null && variant.getFeaturedImage() != null 
                ? variant.getFeaturedImage().getImageUrl() : null;
    }

    private String extractAltImage(ProductVariant variant) {
        return variant != null && variant.getFeaturedImage() != null 
                ? variant.getFeaturedImage().getAltText() : null;
    }

    private BigDecimal extractPrice(ProductVariant variant) {
        return variant != null && variant.getPrice() != null 
                ? variant.getPrice().getAmount() : BigDecimal.ZERO;
    }

    private BigDecimal extractSalePrice(ProductVariant variant) {
        return variant != null && variant.getPrice() != null 
                ? variant.getPrice().getSaleAmount() : null;
    }

    private BigDecimal calculateFinalPrice(ProductVariant variant) {
        if (variant == null || variant.getPrice() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal salePrice = variant.getPrice().getSaleAmount();
        return salePrice != null ? salePrice : variant.getPrice().getAmount();
    }

    private BigDecimal calculateSubTotal(ProductVariant variant, Integer quantity) {
        BigDecimal finalPrice = calculateFinalPrice(variant);
        return finalPrice.multiply(BigDecimal.valueOf(quantity != null ? quantity : 0));
    }

    private Integer extractStockQuantity(ProductVariant variant) {
        return variant != null && variant.getStockQuantity() != null 
                ? variant.getStockQuantity().getValue() : 0;
    }

    private boolean checkAvailability(ProductVariant variant) {
        return variant != null
                && variant.isActive()
                && !variant.isDeleted()
                && variant.getStockQuantity() != null
                && variant.getStockQuantity().getValue() > 0;
    }
}
