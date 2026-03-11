package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAttributeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class ProductAttributeDataInit implements CommandLineRunner {

    private final ProductAttributeRepository productAttributeRepository;

    @Override
    public void run(String... args) {
        initializeAttributes();
    }

    private void initializeAttributes() {
        // Remove unwanted attributes if they exist
        List<String> unwanted = Arrays.asList("Mã sản phẩm", "SKU");
        for (String name : unwanted) {
            productAttributeRepository.findByName(name).ifPresent(attr -> {
                attr.setDeleted(true);
                attr.setActive(false);
                productAttributeRepository.save(attr);
                log.info("🗑️ Removed unwanted product attribute: {}", name);
            });
        }

        List<String> attributeNames = Arrays.asList("Màu sắc", "Hương vị", "Kích thước", "Chất liệu");

        for (String name : attributeNames) {
            if (!productAttributeRepository.existsByName(name)) {
                ProductAttribute attribute = ProductAttribute.builder()
                        .name(name)
                        .displayType(AttributeDisplayType.SELECT)
                        .displayOrder(0)
                        .isActive(true)
                        .isDeleted(false)
                        .build();
                productAttributeRepository.save(attribute);
                log.info("✅ Created product attribute: {}", name);
            }
        }
    }
}
