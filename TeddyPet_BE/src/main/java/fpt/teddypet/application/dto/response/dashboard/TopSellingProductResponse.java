package fpt.teddypet.application.dto.response.dashboard;

import fpt.teddypet.application.dto.response.product.product.ProductResponse;

/**
 * Sản phẩm bán chạy: thông tin sản phẩm + số lượng đã bán.
 */
public record TopSellingProductResponse(
        ProductResponse product,
        long quantitySold
) {}
