package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.Brand;
import fpt.teddypet.infrastructure.persistence.postgres.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Data initializer for Brand entity
 */
@Slf4j
@Component
@Order(4)
@RequiredArgsConstructor
public class BrandDataInit implements CommandLineRunner {

    private final BrandRepository brandRepository;

    @Override
    public void run(String... args) {
        initializeBrands();
    }

    private void initializeBrands() {
        // Royal Canin
        createBrandIfNotExists("Royal Canin", 
                "Thương hiệu thức ăn cho thú cưng hàng đầu thế giới", 
                "https://example.com/brands/royal-canin-logo.png",
                "https://www.royalcanin.com");

        // Pedigree
        createBrandIfNotExists("Pedigree", 
                "Thức ăn cho chó với công thức dinh dưỡng cân bằng", 
                "https://example.com/brands/pedigree-logo.png",
                "https://www.pedigree.com");

        // Whiskas
        createBrandIfNotExists("Whiskas", 
                "Thức ăn cho mèo được yêu thích", 
                "https://example.com/brands/whiskas-logo.png",
                "https://www.whiskas.com");

        // SmartHeart
        createBrandIfNotExists("SmartHeart", 
                "Thương hiệu thức ăn thú cưng giá tốt", 
                "https://example.com/brands/smartheart-logo.png",
                null);

        // Ganador
        createBrandIfNotExists("Ganador", 
                "Thức ăn cho chó mèo chất lượng cao", 
                "https://example.com/brands/ganador-logo.png",
                null);
    }

    private void createBrandIfNotExists(String name, String description, String logoUrl, String websiteUrl) {
        if (!brandRepository.existsByName(name)) {
            Brand brand = Brand.builder()
                    .name(name)
                    .description(description)
                    .logoUrl(logoUrl)
                    .websiteUrl(websiteUrl)
                    .build();
            brandRepository.save(brand);
            log.info("✅ Created Brand: {}", name);
        } else {
            log.debug("Brand {} already exists, skipping", name);
        }
    }
}

