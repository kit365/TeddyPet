package fpt.teddypet.application.dto.internal;

import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.infrastructure.persistence.mongodb.document.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO to combine CartItem with ProductVariant
 * Used for passing data between service layers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemWithVariant {
    private CartItem cartItem;
    private ProductVariant variant;
}
