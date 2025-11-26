package fpt.teddypet.application.dto.common;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * DTO chung cho tất cả các API phân trang (Generic)
 */
public record PageResponse<T>(
        List<T> content,
        int page, 
        int size, 
        long totalElements, 
        int totalPages, 
        boolean first, 
        boolean last 
) {
    /**
     * Hàm tiện ích để chuyển đổi từ Page của Spring sang PageResponse
     */
    public static <T> PageResponse<T> fromPage(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}

