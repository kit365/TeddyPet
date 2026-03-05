package fpt.teddypet.infrastructure.persistence.postgres.specification;

import fpt.teddypet.domain.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class OrderSpecification {

    private OrderSpecification() {
    }

    /**
     * Search orders by keyword (orderCode, shippingName, shippingPhone)
     */
    public static Specification<Order> searchByKeyword(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            String likePattern = "%" + keyword.toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("orderCode")), likePattern));
            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("shippingName")), likePattern));
            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("shippingPhone")), likePattern));

            return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
        };
    }
}
