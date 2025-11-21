package fpt.teddypet.application.service.product;

import fpt.teddypet.application.constants.productattributevalue.ProductAttributeValueMessages;
import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeValueReorderRequest;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeValueResponse;
import fpt.teddypet.application.mapper.ProductAttributeValueMapper;
import fpt.teddypet.application.port.input.ProductAttributeValueService;
import fpt.teddypet.application.port.output.ProductAttributeValueRepositoryPort;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAttributeValueApplicationService implements ProductAttributeValueService {

    private final ProductAttributeValueRepositoryPort productAttributeValueRepositoryPort;
    private final ProductAttributeValueMapper productAttributeValueMapper;

    @Override
    @Transactional
    public void reorder(ProductAttributeValueReorderRequest request) {
        log.info("Bắt đầu thay đổi vị trí cho {} giá trị thuộc tính", request.items().size());
        
        // Tạo map từ valueId -> displayOrder để tra cứu nhanh
        Map<Long, Integer> orderMap = request.items().stream()
                .collect(Collectors.toMap(
                        ProductAttributeValueReorderRequest.ProductAttributeValueOrderItem::valueId,
                        ProductAttributeValueReorderRequest.ProductAttributeValueOrderItem::displayOrder
                ));
        
        // Lấy tất cả các valueIds từ request
        Set<Long> valueIds = orderMap.keySet();
        
        // Lấy tất cả các ProductAttributeValue từ database
        List<ProductAttributeValue> values = productAttributeValueRepositoryPort.findByIds(valueIds);
        
        // Kiểm tra xem có value nào không tồn tại không
        if (values.size() != valueIds.size()) {
            Set<Long> foundIds = values.stream()
                    .map(ProductAttributeValue::getValueId)
                    .collect(Collectors.toSet());
            Set<Long> missingIds = valueIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toSet());
            throw new EntityNotFoundException(
                    String.format(ProductAttributeValueMessages.MESSAGE_PRODUCT_ATTRIBUTE_VALUE_NOT_FOUND, missingIds));
        }
        
        // Cập nhật displayOrder cho từng value
        values.forEach(value -> {
            Integer newOrder = orderMap.get(value.getValueId());
            if (newOrder != null) {
                value.setDisplayOrder(newOrder);
            }
        });
        
        // Lưu tất cả các thay đổi
        productAttributeValueRepositoryPort.saveAll(values);
        
        log.info("Hoàn thành thay đổi vị trí cho {} giá trị thuộc tính", values.size());
    }

    // User
    @Override
    public List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> values) {
        return toResponses(values, false,  true);
    }

    // Admin
    @Override
    public List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> values, boolean includeDeleted) {
      return toResponses(values, includeDeleted, false);
    }

    //Base method
    @Override
    public List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> values, boolean includeDeleted, boolean onlyActive) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(val -> includeDeleted || !val.isDeleted())
                .filter(val -> !onlyActive || val.isActive())
                .sorted(Comparator.comparing(ProductAttributeValue::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(productAttributeValueMapper::toResponse)
                .toList();
    }
}


