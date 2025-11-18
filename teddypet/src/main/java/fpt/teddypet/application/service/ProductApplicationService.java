package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.product.ProductMessages;
import fpt.teddypet.application.port.input.ProductService;
import fpt.teddypet.application.port.output.ProductRepositoryPort;
import fpt.teddypet.domain.entity.Product;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductApplicationService implements ProductService {

    private final ProductRepositoryPort productRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public Product getById(Long productId) {
        return productRepositoryPort.findByIdAndIsActiveTrueAndIsDeletedFalse(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_ID, productId)));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getByIdAndIsDeletedFalse(Long productId) {
        return productRepositoryPort.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_ID, productId)));
    }
}

