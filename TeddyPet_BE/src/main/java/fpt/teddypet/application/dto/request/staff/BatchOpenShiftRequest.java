package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request tạo nhiều ca trống cùng lúc (cho tính năng "Tạo ca tự động theo tuần chuẩn").
 * Admin vẫn có thể chỉnh sửa hoặc xóa từng ca sau khi tạo (vd: ngày Tết đóng cửa sớm).
 */
public record BatchOpenShiftRequest(
        @NotEmpty(message = "Danh sách ca không được rỗng")
        @Size(max = 50, message = "Tối đa 50 ca mỗi lần tạo")
        List<@Valid OpenShiftRequest> shifts
) {
}
