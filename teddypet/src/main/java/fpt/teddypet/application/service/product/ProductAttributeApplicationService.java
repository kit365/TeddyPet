package fpt.teddypet.application.service.product;

import fpt.teddypet.application.constants.products.productattribute.ProductAttributeLogMessages;
import fpt.teddypet.application.constants.products.productattribute.ProductAttributeMessages;
import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeRequest;
import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeValueItemRequest;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeInfo;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeResponse;
import fpt.teddypet.application.mapper.ProductAttributeMapper;
import fpt.teddypet.application.port.input.ProductAttributeService;
import fpt.teddypet.application.port.output.ProductAttributeRepositoryPort;
import fpt.teddypet.application.util.DisplayOrderUtil;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAttributeApplicationService implements ProductAttributeService {

    private final ProductAttributeRepositoryPort productAttributeRepositoryPort;
    private final ProductAttributeMapper productAttributeMapper;

    @Override
    @Transactional
    public ProductAttributeResponse create(ProductAttributeRequest request) {
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_CREATE_START, request.name());

        List<ProductAttribute> existingAttributes = productAttributeRepositoryPort.findAllActive();

        validateNameDuplicate(request.name(), null);
        validateValueDuplicates(request.values());

        ProductAttribute attribute = ProductAttribute.builder()
                .name(request.name())
                .displayType(request.displayType())
                .build();

        int displayOrder = request.displayOrder() != null
                ? request.displayOrder()
                : DisplayOrderUtil.getNextDisplayOrder(existingAttributes, ProductAttribute::getDisplayOrder);
        attribute.setDisplayOrder(displayOrder);
        attribute.setActive(true);
        attribute.setDeleted(false);
        attribute.setSupportedUnits(request.supportedUnits());

        if (request.values() != null && !request.values().isEmpty()) {
            attribute.getValues().addAll(buildValuesForCreate(attribute, request.values()));
        }

        ProductAttribute savedAttribute = productAttributeRepositoryPort.save(attribute);
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_CREATE_SUCCESS, savedAttribute.getAttributeId());
        return toResponse(savedAttribute);
    }

    @Override
    @Transactional
    public ProductAttributeResponse update(Long attributeId, ProductAttributeRequest request) {
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_UPDATE_START, attributeId);
        ProductAttribute attribute = getActiveAttribute(attributeId);

        validateNameDuplicate(request.name(), attributeId);
        validateValueDuplicates(request.values());

        attribute.setName(request.name());
        attribute.setDisplayType(request.displayType());
        attribute.setSupportedUnits(request.supportedUnits());

        if (request.displayOrder() != null) {
            attribute.setDisplayOrder(request.displayOrder());
        }

        syncAttributeValues(attribute, request.values());

        ProductAttribute saved = productAttributeRepositoryPort.save(attribute);
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_UPDATE_SUCCESS, attributeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductAttributeResponse getById(Long attributeId) {
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_GET_BY_ID, attributeId);
        ProductAttribute attribute = getActiveAttribute(attributeId);
        return toResponse(attribute);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductAttributeResponse> getAll() {
        List<ProductAttribute> attributes = productAttributeRepositoryPort.findAllActive();
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_GET_ALL, attributes.size());
        return attributes.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long attributeId) {
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_DELETE_START, attributeId);
        ProductAttribute attribute = getActiveAttribute(attributeId);
        attribute.setDeleted(true);
        attribute.setActive(false);
        attribute.getValues().forEach(value -> {
            value.setDeleted(true);
            value.setActive(false);
        });
        productAttributeRepositoryPort.save(attribute);
        
        // Normalize remaining attributes' displayOrder
        List<ProductAttribute> remainingAttributes = productAttributeRepositoryPort.findAllActive();
        if (DisplayOrderUtil.hasGaps(remainingAttributes, ProductAttribute::getDisplayOrder)) {
            DisplayOrderUtil.normalizeDisplayOrders(
                remainingAttributes,
                ProductAttribute::getDisplayOrder,
                ProductAttribute::setDisplayOrder
            );
            productAttributeRepositoryPort.saveAll(remainingAttributes);
        }
        
        log.info(ProductAttributeLogMessages.LOG_PRODUCT_ATTRIBUTE_DELETE_SUCCESS, attributeId);
    }

    @Override
    public List<ProductAttribute> getAllByIdsAndActiveAndDeleted(List<Long> ids, boolean active, boolean deleted) {
        if (fpt.teddypet.application.util.ListUtil.isNullOrEmpty(ids)) {
            return new ArrayList<>();
        }
        return productAttributeRepositoryPort.findAllByIdsAndActiveAndDeleted(ids, active, deleted);
    }

    @Override
    public List<fpt.teddypet.domain.enums.UnitEnum> getSupportedUnits(Long attributeId) {
        ProductAttribute attribute = getActiveAttribute(attributeId);
        return attribute.getSupportedUnits();
    }

    private ProductAttribute getActiveAttribute(Long attributeId) {
        return productAttributeRepositoryPort.findById(attributeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_NOT_FOUND, attributeId)
                ));
    }

    private List<ProductAttributeValue> buildValuesForCreate(ProductAttribute attribute,
                                                            List<ProductAttributeValueItemRequest> valueRequests) {
        List<ProductAttributeValue> values = new ArrayList<>();

        log.info("Building {} values for create attribute: {}", valueRequests.size(), attribute.getName());
        
        for (int i = 0; i < valueRequests.size(); i++) {
            ProductAttributeValueItemRequest valueRequest = valueRequests.get(i);
            
            // Auto-assign displayOrder if not provided
            int displayOrder = valueRequest.displayOrder() != null
                    ? valueRequest.displayOrder()
                    : i; // Use index as displayOrder

            ProductAttributeValue value = ProductAttributeValue.builder()
                    .attribute(attribute)
                    .value(valueRequest.value())
                    .displayOrder(displayOrder)
                    .build();
            value.setActive(true);
            value.setDeleted(false);
            values.add(value);
        }
        
        // Normalize displayOrders if any gaps exist
        DisplayOrderUtil.normalizeDisplayOrders(
            values,
            ProductAttributeValue::getDisplayOrder,
            ProductAttributeValue::setDisplayOrder
        );
        
        log.info("Built {} values successfully", values.size());
        return values;
    }

    private void syncAttributeValues(ProductAttribute attribute, List<ProductAttributeValueItemRequest> valueRequests) {
        List<ProductAttributeValue> existingValues = attribute.getValues();
        Map<Long, ProductAttributeValue> existingById = existingValues.stream()
                .filter(value -> value.getValueId() != null)
                .collect(Collectors.toMap(ProductAttributeValue::getValueId, value -> value));

        List<ProductAttributeValue> reusableValues = existingValues.stream()
                .filter(value -> !value.isDeleted())
                .collect(Collectors.toCollection(ArrayList::new));

        Set<Long> processedIds = new HashSet<>();

        if (fpt.teddypet.application.util.ListUtil.isNullOrEmpty(valueRequests)) {
            log.info("No value requests provided, marking all existing values as deleted");
            reusableValues.forEach(value -> {
                value.setDeleted(true);
                value.setActive(false);
            });
            return;
        }

        log.info("Syncing {} value requests with {} existing values", valueRequests.size(), existingValues.size());

        for (int index = 0; index < valueRequests.size(); index++) {
            ProductAttributeValueItemRequest valueRequest = valueRequests.get(index);
            Integer requestedOrder = valueRequest.displayOrder() != null
                    ? valueRequest.displayOrder()
                    : index; // Use index as default displayOrder

            ProductAttributeValue targetValue;

            if (valueRequest.valueId() != null && existingById.containsKey(valueRequest.valueId())) {
                targetValue = existingById.get(valueRequest.valueId());
            } else {
                targetValue = reusableValues.stream()
                        .filter(value -> !value.isDeleted())
                        .filter(value -> !processedIds.contains(value.getValueId()))
                        .filter(value -> value.getValue().equalsIgnoreCase(valueRequest.value()))
                        .findFirst()
                        .orElse(null);
            }

            if (targetValue != null) {
                targetValue.setValue(valueRequest.value());
                targetValue.setDisplayOrder(requestedOrder);
                targetValue.setDeleted(false);
                targetValue.setActive(true);
                if (targetValue.getValueId() != null) {
                    processedIds.add(targetValue.getValueId());
                }
            } else {
                ProductAttributeValue newValue = ProductAttributeValue.builder()
                        .attribute(attribute)
                        .value(valueRequest.value())
                        .displayOrder(requestedOrder)
                        .build();
                newValue.setDeleted(false);
                newValue.setActive(true);
                attribute.getValues().add(newValue);
            }
        }

        // Mark unused values as deleted
        attribute.getValues().stream()
                .filter(value -> value.getValueId() != null)
                .filter(value -> !processedIds.contains(value.getValueId()))
                .forEach(value -> {
                    value.setDeleted(true);
                    value.setActive(false);
                });
        
        // Normalize displayOrders after sync to remove gaps
        List<ProductAttributeValue> activeValues = attribute.getValues().stream()
                .filter(v -> !v.isDeleted())
                .collect(Collectors.toList());
        
        DisplayOrderUtil.normalizeDisplayOrders(
            activeValues,
            ProductAttributeValue::getDisplayOrder,
            ProductAttributeValue::setDisplayOrder
        );
    }

    @Override
    public ProductAttributeResponse toResponse(ProductAttribute attribute) {
            return toResponse(attribute, false);
    }

    @Override
    public ProductAttributeResponse toResponse(ProductAttribute attribute, boolean isDeleted) {

        if (attribute == null) {
            return null;
        }

        if (!isDeleted && attribute.isDeleted()) {
            return null;
        }

        List<ProductAttributeValue> values = attribute.getValues().stream()
                .filter(val -> isDeleted || !val.isDeleted())
                .sorted(Comparator.comparing(ProductAttributeValue::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        return productAttributeMapper.toResponse(attribute, values);
    }

    @Override
    public ProductAttributeInfo toInfo(ProductAttribute attribute) {
        return toInfo(attribute, false, true);
    }

    @Override
    public ProductAttributeInfo toInfo(ProductAttribute attribute, boolean includeDeleted) {
        return toInfo(attribute, includeDeleted, false);
    }

    @Override
    public ProductAttributeInfo toInfo(ProductAttribute attribute, boolean includeDeleted, boolean onlyActive) {
        if (attribute == null) {
            return null;
        }

        if (!includeDeleted && attribute.isDeleted()) {
            return null;
        }
        if (onlyActive && !attribute.isActive()) {
            return null;
        }

        return productAttributeMapper.toInfo(attribute, new ProductAttributeMapper.MappingContext(includeDeleted, onlyActive));
    }

    @Override
    public List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes) {
        return toInfos(attributes, false, true);
    }

    @Override
    public List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes, boolean includeDeleted) {
        return toInfos(attributes, includeDeleted, false);
    }

    @Override
    public List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes, boolean includeDeleted, boolean onlyActive) {
        return fpt.teddypet.application.util.ListUtil.safe(attributes).stream()
                .filter(attr -> includeDeleted || !attr.isDeleted())
                .filter(attr -> !onlyActive || attr.isActive())
                .sorted(Comparator.comparing(ProductAttribute::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(attr -> toInfo(attr, includeDeleted, onlyActive))
                .toList();
    }

    private void validateNameDuplicate(String name, Long currentAttributeId) {
        if (name == null) {
            return;
        }
        String normalizedName = name.trim();
        productAttributeRepositoryPort.findByNameIgnoreCase(normalizedName)
                .ifPresent(existing -> {
                    if (currentAttributeId == null) {
                        throw new IllegalArgumentException(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_NAME_DUPLICATE);
                    }
                });
    }

    private void validateValueDuplicates(List<ProductAttributeValueItemRequest> valueRequests) {
        if (ListUtil.isNullOrEmpty(valueRequests)) {
            return;
        }
        Set<String> seen = new HashSet<>();
        for (ProductAttributeValueItemRequest valueRequest : valueRequests) {
            if (valueRequest.value() == null) {
                continue;
            }
            String normalized = valueRequest.value().trim().toLowerCase();
            if (!seen.add(normalized)) {
                throw new IllegalArgumentException(String.format(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_VALUE_DUPLICATE, valueRequest.value()));
            }
        }
    }
}

