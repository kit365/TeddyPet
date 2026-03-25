package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.enums.TagEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

/**
 * Data initializer for ProductTag entity
 * Based on TagEnum for consistency
 */
@Slf4j
@Component
@org.springframework.context.annotation.Profile("!prod")
@Order(3)
@RequiredArgsConstructor
public class ProductTagDataInit implements CommandLineRunner {

    private final ProductTagRepository productTagRepository;

    // Mapping TagEnum to Vietnamese descriptions and colors
    private static final Map<TagEnum, TagInfo> TAG_INFO = new EnumMap<>(TagEnum.class);
    static {
        TAG_INFO.put(TagEnum.BEST_SELLER, new TagInfo("Sản phẩm bán chạy", "#FF6B6B"));
        TAG_INFO.put(TagEnum.NEW, new TagInfo("Sản phẩm mới", "#4ECDC4"));
        TAG_INFO.put(TagEnum.SALE, new TagInfo("Đang giảm giá", "#FFD93D"));
        TAG_INFO.put(TagEnum.HOT, new TagInfo("Sản phẩm hot", "#FF6B6B"));
        TAG_INFO.put(TagEnum.FEATURED, new TagInfo("Sản phẩm nổi bật", "#95E1D3"));
    }

    @Override
    public void run(String... args) {
        initializeTags();
    }

    private void initializeTags() {
        for (TagEnum tagEnum : TagEnum.values()) {
            if (!productTagRepository.existsByName(tagEnum.name())) {
                TagInfo info = TAG_INFO.get(tagEnum);
                ProductTag tag = ProductTag.builder()
                        .name(tagEnum.name())
                        .slug(SlugUtil.toSlug(tagEnum.name()))
                        .description(info.description)
                        .color(info.color)
                        .build();
                productTagRepository.save(tag);
                log.info("✅ Created ProductTag: {} - {}", tagEnum.name(), info.description);
            } else {
                log.debug("ProductTag {} already exists, skipping", tagEnum.name());
            }
        }
    }

    private static class TagInfo {
        final String description;
        final String color;

        TagInfo(String description, String color) {
            this.description = description;
            this.color = color;
        }
    }
}
