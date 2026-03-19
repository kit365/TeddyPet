package fpt.teddypet.application.service.staff;

import lombok.Getter;

@Getter
public enum StaffExcelColumn {
    ID(0, "ID\n(Trống nếu tạo mới)", 10),
    FULL_NAME(1, "Họ và Tên *", 25),
    EMAIL(2, "Email\n(Dùng để cấp tài khoản)", 30),
    PHONE(3, "Số Điện Thoại", 15),
    CITIZEN_ID(4, "CCCD/CMND", 20),
    DOB(5, "Ngày Sinh\n(YYYY-MM-DD)", 15),
    GENDER(6, "Giới Tính\n(MALE/FEMALE)", 15),
    ADDRESS(7, "Địa Chỉ", 40),
    BANK_ACCOUNT(8, "Số Tài Khoản", 20),
    BANK_NAME(9, "Tên Ngân Hàng", 25),
    EMPLOYMENT_TYPE(10, "Loại Hình\n(FULL_TIME/PART_TIME)", 20),
    POSITION(11, "Chức Vụ", 25),
    ROLE(12, "Quyền Hạn\n(ADMIN/STAFF)", 20);

    private final int index;
    private final String header;
    private final int width;

    StaffExcelColumn(int index, String header, int width) {
        this.index = index;
        this.header = header;
        this.width = width;
    }
}
