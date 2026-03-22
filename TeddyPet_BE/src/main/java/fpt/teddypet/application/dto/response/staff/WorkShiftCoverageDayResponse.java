package fpt.teddypet.application.dto.response.staff;

/**
 * Phủ ca làm theo nửa ngày (VN): sáng [00:00–12:00), chiều [12:00–24:00).
 * Dùng cho form đặt lịch — ẩn ngày trả khi cả sáng và chiều đều không có ca.
 */
public record WorkShiftCoverageDayResponse(String date, boolean morning, boolean afternoon) {
}
