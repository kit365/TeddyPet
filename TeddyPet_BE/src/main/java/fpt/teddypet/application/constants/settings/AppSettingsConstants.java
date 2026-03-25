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
    public static final String SOCIAL_FACEBOOK = AppSettingEnum.SOCIAL_FACEBOOK.getKey();
    public static final String SOCIAL_INSTAGRAM = AppSettingEnum.SOCIAL_INSTAGRAM.getKey();
    public static final String SOCIAL_APPLE_STORE = AppSettingEnum.SOCIAL_APPLE_STORE.getKey();
    public static final String SOCIAL_PLAY_STORE = AppSettingEnum.SOCIAL_PLAY_STORE.getKey();
    public static final String SHOP_WEBSITE = AppSettingEnum.SHOP_WEBSITE.getKey();

    public static final String DEFAULT_SHOP_ADDRESS = "43 Số 51, Bình Thuận, Quận 7, Ho Chi Minh City, Vietnam";
    public static final String DEFAULT_SHOP_LAT = "10.7410";
    public static final String DEFAULT_SHOP_LNG = "106.7145";
    public static final String DEFAULT_SHOP_PHONE = "0987 654 321";
    public static final String DEFAULT_SHOP_EMAIL = "teddypetfpt@gmail.com";
    public static final String DEFAULT_SOCIAL_FACEBOOK = "https://www.facebook.com/share/18EBcGi5ow/?mibextid=wwXIfr";
    public static final String DEFAULT_SOCIAL_INSTAGRAM = "https://www.instagram.com/teddypetvietnam?igsh=YWd4MXRra2dyZWJm";
    public static final String DEFAULT_SOCIAL_APPLE_STORE = "https://apps.apple.com";
    public static final String DEFAULT_SOCIAL_PLAY_STORE = "https://play.google.com";
    public static final String DEFAULT_SHOP_WEBSITE = "https://teddypet.fpt.edu.vn";

    public static final String DESC_SHOP_ADDRESS = AppSettingEnum.SHOP_ADDRESS.getDescription();
    public static final String DESC_SHOP_LAT = AppSettingEnum.SHOP_LAT.getDescription();
    public static final String DESC_SHOP_LNG = AppSettingEnum.SHOP_LNG.getDescription();
    public static final String DESC_SHOP_PHONE = AppSettingEnum.SHOP_PHONE.getDescription();
    public static final String DESC_SHOP_EMAIL = AppSettingEnum.SHOP_EMAIL.getDescription();
    public static final String DESC_SOCIAL_FACEBOOK = AppSettingEnum.SOCIAL_FACEBOOK.getDescription();
    public static final String DESC_SOCIAL_INSTAGRAM = AppSettingEnum.SOCIAL_INSTAGRAM.getDescription();
    public static final String DESC_SOCIAL_APPLE_STORE = AppSettingEnum.SOCIAL_APPLE_STORE.getDescription();
    public static final String DESC_SOCIAL_PLAY_STORE = AppSettingEnum.SOCIAL_PLAY_STORE.getDescription();
    public static final String DESC_SHOP_WEBSITE = AppSettingEnum.SHOP_WEBSITE.getDescription();
}
