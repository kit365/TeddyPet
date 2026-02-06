package fpt.teddypet.application.mapper.feedback;

import fpt.teddypet.application.dto.response.feedback.FeedbackItemResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackResponse;
import fpt.teddypet.domain.entity.Feedback;
import fpt.teddypet.domain.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface FeedbackMapper {

    @Mapping(target = "userName", source = "user.username")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productSlug", source = "product.slug")
    @Mapping(target = "productImage", expression = "java(feedback.getVariant() != null && feedback.getVariant().getFeaturedImage() != null ? feedback.getVariant().getFeaturedImage().getImageUrl() : (feedback.getProduct().getImages() != null && !feedback.getProduct().getImages().isEmpty() ? feedback.getProduct().getImages().get(0).getImageUrl() : null))")
    @Mapping(target = "variantId", source = "variant.variantId")
    @Mapping(target = "variantName", source = "variant.name")
    @Mapping(target = "isEdited", source = "edited")
    @Mapping(target = "isPurchased", source = "purchased")
    FeedbackResponse toResponse(Feedback feedback);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "variantId", source = "variant.variantId")
    @Mapping(target = "productName", source = "productName")
    @Mapping(target = "variantName", source = "variantName")
    @Mapping(target = "imageUrl", source = "imageUrl")
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "comment", ignore = true)
    @Mapping(target = "isSubmitted", ignore = true)
    FeedbackItemResponse toItemResponse(OrderItem orderItem);
}
