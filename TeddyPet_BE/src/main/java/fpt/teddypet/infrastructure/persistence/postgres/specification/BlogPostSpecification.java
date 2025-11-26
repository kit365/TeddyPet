package fpt.teddypet.infrastructure.persistence.postgres.specification;

import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class BlogPostSpecification {

    private BlogPostSpecification() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static Specification<BlogPost> buildKeywordSearchSpecification(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            String likePattern = "%" + keyword.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get(BlogPost_.title)), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get(BlogPost_.content)), likePattern)
            );
        };
    }

    public static Specification<BlogPost> buildCategoryFilterSpecification(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get(BlogPost_.category).get(BlogCategory_.id), categoryId);
    }

    public static Specification<BlogPost> buildTagFilterSpecification(Long tagId) {
        if (tagId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<BlogPost, BlogTag> tagJoin = root.join(BlogPost_.tags);
            return criteriaBuilder.equal(tagJoin.get(BlogTag_.id), tagId);
        };
    }

    public static Specification<BlogPost> buildStatusFilterSpecification(BlogPostStatusEnum status) {
        if (status == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get(BlogPost_.status), status);
    }

    public static Specification<BlogPost> buildDateRangeFilterSpecification(LocalDateTime from, LocalDateTime to) {
        if (from == null && to == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get(BaseEntity_.createdAt), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get(BaseEntity_.createdAt), to));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<BlogPost> buildNotDeletedSpecification() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get(BaseEntity_.isDeleted), false);
    }

    public static Specification<BlogPost> combineAll(List<Specification<BlogPost>> specifications) {
        return specifications.stream()
                .filter(Objects::nonNull)
                .reduce(Specification::and)
                .orElse(null);
    }
}
