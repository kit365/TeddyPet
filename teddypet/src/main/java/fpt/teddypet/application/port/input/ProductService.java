package fpt.teddypet.application.port.input;

import fpt.teddypet.domain.entity.Product;

public interface ProductService {
    Product getById(Long productId);
}

