package fpt.teddypet.application.dto.response.blog.tag;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BlogTagResponse(
        Long tagId,
        String name,
        String slug,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive,
        @JsonProperty("isDeleted")
        boolean isDeleted
) {
}
