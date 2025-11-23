package fpt.teddypet.application.dto.request.blogs.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogTagUpsertRequest(
        Long tagId, // Null when creating new
        @NotBlank(message = "Tên tag là bắt buộc")
        @Size(max = 100, message = "Tên tag không được vượt quá 100 ký tự")
        String name,
        
        Integer displayOrder // Optional
) {
}
