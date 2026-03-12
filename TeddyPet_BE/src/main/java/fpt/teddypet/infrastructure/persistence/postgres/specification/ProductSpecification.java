package fpt.teddypet.infrastructure.persistence.postgres.specification;

import fpt.teddypet.domain.entity.BaseEntity_;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.Product_;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.domain.entity.ProductCategory_;
import fpt.teddypet.domain.entity.ProductBrand_;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.entity.ProductTag_;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.domain.entity.ProductAgeRange_;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.domain.entity.ProductVariant_;
import fpt.teddypet.domain.entity.ProductImage;
import fpt.teddypet.domain.entity.ProductImage_;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.valueobject.Price_;
import fpt.teddypet.domain.valueobject.Sku_;
import fpt.teddypet.domain.valueobject.StockQuantity_;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ProductSpecification {

    private ProductSpecification() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static Specification<Product> buildKeywordSearchSpecification(String keyword) {
        return (root, query, criteriaBuilder) -> {

            // Add distinct to avoid duplicate results when joining with variants
            if (query != null) {
                query.distinct(true);
            }

            if (keyword == null || keyword.trim().isEmpty()) {
                return criteriaBuilder.conjunction(); // Always true predicate
            }

            String searchKeyword = "%" + keyword.trim().toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();

            // Product.name using Metamodel
            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get(Product_.name)),
                    searchKeyword));

            // Product.id
            try {
                Long productId = Long.parseLong(keyword.trim());
                predicates.add(criteriaBuilder.equal(root.get(Product_.id), productId));
            } catch (NumberFormatException e) {
                // Not a valid number, skip
            }

            // Product.barcode
            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(
                            criteriaBuilder.coalesce(root.get(Product_.barcode), "")),
                    searchKeyword));

            // Search in ProductVariant.sku using subquery to avoid duplicates
            if (query != null) {
                Subquery<Long> variantSubquery = query.subquery(Long.class);
                Root<ProductVariant> variantRoot = variantSubquery.from(ProductVariant.class);
                // Get Product ID from ProductVariant relationship using Metamodel
                variantSubquery.select(variantRoot.get(ProductVariant_.product).get(Product_.id))
                        .where(criteriaBuilder.like(
                                criteriaBuilder.lower(variantRoot.get(ProductVariant_.sku).get(Sku_.value)),
                                searchKeyword));
                predicates.add(criteriaBuilder.in(root.get(Product_.id)).value(variantSubquery));
            }

            return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> buildBaseSpecification() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.and(
                criteriaBuilder.equal(root.get(BaseEntity_.isDeleted), false),
                criteriaBuilder.equal(root.get(BaseEntity_.isActive), true));
    }

    // A. Bộ lọc Phân tích dữ liệu

    public static Specification<Product> buildCategoryFilterSpecification(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<Product, ProductCategory> categoryJoin = root.join(Product_.categories);
            return categoryJoin.get(ProductCategory_.id).in(categoryIds);
        };
    }

    public static Specification<Product> buildBrandFilterSpecification(Long brandId) {
        if (brandId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get(Product_.brand).get(ProductBrand_.id),
                brandId);
    }

    public static Specification<Product> buildCategorySlugsFilterSpecification(List<String> categorySlugs) {
        if (categorySlugs == null || categorySlugs.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<Product, ProductCategory> categoryJoin = root.join(Product_.categories);
            return categoryJoin.get(ProductCategory_.slug).in(categorySlugs);
        };
    }

    public static Specification<Product> buildBrandSlugsFilterSpecification(List<String> brandSlugs) {
        if (brandSlugs == null || brandSlugs.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            return root.get(Product_.brand).get(ProductBrand_.slug).in(brandSlugs);
        };
    }

    public static Specification<Product> buildExcludeProductIdSpecification(Long productId) {
        if (productId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.notEqual(root.get(Product_.id), productId);
    }

    public static Specification<Product> buildTagSlugsFilterSpecification(List<String> tagSlugs) {
        if (tagSlugs == null || tagSlugs.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<Product, ProductTag> tagJoin = root.join(Product_.tags);
            return tagJoin.get(ProductTag_.slug).in(tagSlugs);
        };
    }

    public static Specification<Product> buildPriceRangeSpecification(Double minPrice, Double maxPrice) {
        if (minPrice == null && maxPrice == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }

            Subquery<Long> variantSubquery = query.subquery(Long.class);
            Root<ProductVariant> variantRoot = variantSubquery.from(ProductVariant.class);
            variantSubquery.select(variantRoot.get(ProductVariant_.product).get(Product_.id));

            List<Predicate> pricePredicates = new ArrayList<>();

            // For price range, we check both amount and saleAmount.
            // If saleAmount is set, it's the effective price.

            Expression<BigDecimal> effectivePrice = criteriaBuilder.coalesce(
                    variantRoot.get(ProductVariant_.price).get(Price_.saleAmount),
                    variantRoot.get(ProductVariant_.price).get(Price_.amount));

            if (minPrice != null) {
                pricePredicates.add(criteriaBuilder.greaterThanOrEqualTo(effectivePrice, BigDecimal.valueOf(minPrice)));
            }
            if (maxPrice != null) {
                pricePredicates.add(criteriaBuilder.lessThanOrEqualTo(effectivePrice, BigDecimal.valueOf(maxPrice)));
            }

            variantSubquery.where(criteriaBuilder.and(pricePredicates.toArray(new Predicate[0])));

            return criteriaBuilder.in(root.get(Product_.id)).value(variantSubquery);
        };
    }

    public static Specification<Product> buildPetTypeFilterSpecification(List<PetTypeEnum> petTypes) {
        if (petTypes == null || petTypes.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            // petTypes is ElementCollection, use member() for collection queries
            // For ElementCollection, we need to check if any petType in the collection
            // matches
            List<Predicate> petTypePredicates = new ArrayList<>();
            for (PetTypeEnum petType : petTypes) {
                petTypePredicates.add(criteriaBuilder.isMember(petType, root.get(Product_.petTypes)));
            }
            return criteriaBuilder.or(petTypePredicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> buildAgeRangeFilterSpecification(List<Long> ageRangeIds) {
        if (ageRangeIds == null || ageRangeIds.isEmpty()) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<Product, ProductAgeRange> ageRangeJoin = root.join(Product_.ageRanges);
            return ageRangeJoin.get(ProductAgeRange_.id).in(ageRangeIds);
        };
    }

    // B. Bộ lọc Trạng thái & Vận hành

    public static Specification<Product> buildStatusFilterSpecification(ProductStatusEnum status) {
        if (status == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get(Product_.status), status);
    }

    public static Specification<Product> buildStockFilterSpecification(
            fpt.teddypet.domain.enums.StockStatusEnum stockStatus, Integer threshold,
            Boolean includeDeleted) {
        if (stockStatus == null) {
            return null;
        }

        return (root, query, criteriaBuilder) -> {
            if (query == null) {
                return criteriaBuilder.conjunction();
            }

            query.distinct(true);

            Subquery<Long> variantSubquery = query.subquery(Long.class);
            Root<ProductVariant> variantRoot = variantSubquery.from(ProductVariant.class);
            variantSubquery.select(variantRoot.get(ProductVariant_.product).get(Product_.id));

            List<Predicate> variantPredicates = buildStockStatusPredicates(
                    variantRoot, criteriaBuilder, stockStatus, threshold);

            addDeletedFilterIfNeeded(variantRoot, criteriaBuilder, includeDeleted, variantPredicates);

            if (!variantPredicates.isEmpty()) {
                variantSubquery.where(criteriaBuilder.and(variantPredicates.toArray(new Predicate[0])));
            }

            return criteriaBuilder.in(root.get(Product_.id)).value(variantSubquery);
        };
    }

    private static List<Predicate> buildStockStatusPredicates(
            Root<ProductVariant> variantRoot,
            CriteriaBuilder criteriaBuilder,
            fpt.teddypet.domain.enums.StockStatusEnum stockStatus,
            Integer threshold) {
        List<Predicate> predicates = new ArrayList<>();

        Expression<Integer> stockValue = variantRoot.get(ProductVariant_.stockQuantity).get(StockQuantity_.value);

        int stockThresholdValue = (threshold != null && threshold > 0) ? threshold : 10;

        switch (stockStatus) {
            case OUT_OF_STOCK:
                predicates.add(criteriaBuilder.lessThanOrEqualTo(stockValue, 0));
                break;
            case LOW_STOCK:
                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.greaterThan(stockValue, 0),
                        criteriaBuilder.lessThanOrEqualTo(stockValue, stockThresholdValue)));
                break;
            case IN_STOCK:
                predicates.add(criteriaBuilder.greaterThan(stockValue, stockThresholdValue));
                break;
        }

        return predicates;
    }

    private static void addDeletedFilterIfNeeded(
            Root<ProductVariant> variantRoot,
            CriteriaBuilder criteriaBuilder,
            Boolean includeDeleted,
            List<Predicate> variantPredicates) {
        if (includeDeleted == null || !includeDeleted) {
            variantPredicates.add(
                    criteriaBuilder.equal(variantRoot.get(BaseEntity_.isDeleted), false));
        }
    }

    // C. Bộ lọc Kiểm toán & Chất lượng

    public static Specification<Product> buildDateRangeFilterSpecification(LocalDateTime from, LocalDateTime to) {
        if (from == null && to == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            List<Predicate> datePredicates = new ArrayList<>();
            if (from != null) {
                datePredicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get(BaseEntity_.createdAt), from));
            }
            if (to != null) {
                datePredicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get(BaseEntity_.createdAt), to));
            }
            if (datePredicates.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.and(datePredicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> buildMissingFeaturedImageFilterSpecification(Boolean missingImage) {
        if (missingImage == null || !missingImage) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query == null) {
                return criteriaBuilder.conjunction();
            }
            // Create subquery to get Product IDs that have active images
            Subquery<Long> imageExistsSubquery = query.subquery(Long.class);
            Root<ProductImage> imageRoot = imageExistsSubquery.from(ProductImage.class);
            imageExistsSubquery.select(imageRoot.get(ProductImage_.product).get(Product_.id))
                    .where(criteriaBuilder.equal(imageRoot.get(BaseEntity_.isDeleted), false));

            // Return products that DO NOT have any active images
            return criteriaBuilder.not(criteriaBuilder.in(root.get(Product_.id)).value(imageExistsSubquery));
        };
    }

    public static Specification<Product> buildMissingDescriptionFilterSpecification(Boolean missingDescription) {
        if (missingDescription == null || !missingDescription) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.isNull(root.get(Product_.description)),
                criteriaBuilder.equal(root.get(Product_.description), ""));
    }

    public static Specification<Product> combine(Specification<Product> spec1, Specification<Product> spec2) {
        if (spec1 == null) {
            return spec2;
        }
        if (spec2 == null) {
            return spec1;
        }
        return spec1.and(spec2);
    }

    public static Specification<Product> combineAll(List<Specification<Product>> specifications) {
        return specifications.stream()
                .filter(Objects::nonNull)
                .reduce(Specification::and)
                .orElse(null);
    }
}
