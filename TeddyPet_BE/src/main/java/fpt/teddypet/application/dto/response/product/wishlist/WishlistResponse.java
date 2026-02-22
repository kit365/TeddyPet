package fpt.teddypet.application.dto.response.product.wishlist;

import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {
    private Long id;
    private Long productId;
    private LocalDateTime addedAt;
    private ProductResponse product;
}
