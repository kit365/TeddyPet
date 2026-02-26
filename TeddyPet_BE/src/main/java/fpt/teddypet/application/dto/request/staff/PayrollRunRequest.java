package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PayrollRunRequest(
        @NotNull
        @Min(1)
        @Max(12)
        Integer month,

        @NotNull
        Integer year,

        Long staffId // tùy chọn: null = chạy cho tất cả nhân viên
) {
}

