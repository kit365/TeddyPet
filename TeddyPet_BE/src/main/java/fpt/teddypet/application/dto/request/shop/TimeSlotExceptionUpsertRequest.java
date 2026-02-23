package fpt.teddypet.application.dto.request.shop;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TimeSlotExceptionUpsertRequest(
        Long id,
        Long serviceId,
        @NotBlank(message = "Tên ngoại lệ là bắt buộc")
        @Size(max = 255)
        String timeExceptionName,
        @NotNull(message = "Ngày bắt đầu là bắt buộc")
        LocalDate startDate,
        @NotNull(message = "Ngày kết thúc là bắt buộc")
        LocalDate endDate,
        @Size(max = 50)
        String scope,
        @Size(max = 50)
        String exceptionType,
        String reason,
        Boolean isRecurring,
        @Size(max = 50)
        String recurrencePattern
) {
}
