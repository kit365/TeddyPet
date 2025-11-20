package fpt.teddypet.infrastructure.persistence.mongodb.document;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Field("variant_id")
    private Long variantId; // Chỉ cần ID này

    @Field("quantity")
    private Integer quantity;
}

