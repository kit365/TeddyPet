package fpt.teddypet.application.dto.response.blog.tag;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BlogTagInfo(
        Long tagId,
        String name,
        String slug,
        @JsonProperty("isActive")
        boolean isActive
) {
}
