package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetNoShowConfigServicesRequest(@NotNull(message = "Danh sách dịch vụ là bắt buộc") List<Long> serviceIds) {}
