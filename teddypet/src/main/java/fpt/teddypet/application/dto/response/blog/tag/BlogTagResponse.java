package fpt.teddypet.application.dto.response.blog.tag;

public record BlogTagResponse(
        Long tagId,
        String name,
        String slug,
        Integer displayOrder
) {
}
