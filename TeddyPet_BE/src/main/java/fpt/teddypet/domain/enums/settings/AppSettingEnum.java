package fpt.teddypet.domain.enums.settings;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AppSettingEnum {
    SHOP_ADDRESS("SHOP_ADDRESS", "Địa chỉ cửa hàng (vị trí gốc tính ship)"),
    SHOP_LAT("SHOP_LAT", "Vĩ độ cửa hàng"),
    SHOP_LNG("SHOP_LNG", "Kinh độ cửa hàng"),
    SHOP_PHONE("SHOP_PHONE", "Số điện thoại cửa hàng"),
    SHOP_EMAIL("SHOP_EMAIL", "Email liên hệ cửa hàng");

    private final String key;
    private final String description;
}
