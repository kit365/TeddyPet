package fpt.teddypet.application.constants.settings;

import fpt.teddypet.domain.enums.settings.AppSettingEnum;

public final class AppSettingsConstants {
    private AppSettingsConstants() {
    }

    public static final String SHOP_ADDRESS = AppSettingEnum.SHOP_ADDRESS.getKey();
    public static final String SHOP_LAT = AppSettingEnum.SHOP_LAT.getKey();
    public static final String SHOP_LNG = AppSettingEnum.SHOP_LNG.getKey();
    public static final String SHOP_PHONE = AppSettingEnum.SHOP_PHONE.getKey();
    public static final String SHOP_EMAIL = AppSettingEnum.SHOP_EMAIL.getKey();

    public static final String DEFAULT_SHOP_ADDRESS = "43 Số 51, Bình Thuận, Quận 7, Ho Chi Minh City, Vietnam";
    public static final String DEFAULT_SHOP_LAT = "10.7410";
    public static final String DEFAULT_SHOP_LNG = "106.7145";
    public static final String DEFAULT_SHOP_PHONE = "0987 654 321";
    public static final String DEFAULT_SHOP_EMAIL = "contact@teddypet.id.vn";

    public static final String DESC_SHOP_ADDRESS = AppSettingEnum.SHOP_ADDRESS.getDescription();
    public static final String DESC_SHOP_LAT = AppSettingEnum.SHOP_LAT.getDescription();
    public static final String DESC_SHOP_LNG = AppSettingEnum.SHOP_LNG.getDescription();
    public static final String DESC_SHOP_PHONE = AppSettingEnum.SHOP_PHONE.getDescription();
    public static final String DESC_SHOP_EMAIL = AppSettingEnum.SHOP_EMAIL.getDescription();
}
