package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.constants.settings.AppSettingsConstants;
import fpt.teddypet.application.port.input.AppSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(10) // Run after core data
@RequiredArgsConstructor
public class AppSettingDataInit implements CommandLineRunner {

    private final AppSettingService appSettingService;

    @Override
    public void run(String... args) {
        initializeSettings();
    }

    private void initializeSettings() {
        log.info("🌱 Initializing App Settings...");

        ensureSetting(AppSettingsConstants.SHOP_ADDRESS,
                AppSettingsConstants.DEFAULT_SHOP_ADDRESS,
                AppSettingsConstants.DESC_SHOP_ADDRESS);

        ensureSetting(AppSettingsConstants.SHOP_LAT,
                AppSettingsConstants.DEFAULT_SHOP_LAT,
                AppSettingsConstants.DESC_SHOP_LAT);

        ensureSetting(AppSettingsConstants.SHOP_LNG,
                AppSettingsConstants.DEFAULT_SHOP_LNG,
                AppSettingsConstants.DESC_SHOP_LNG);

        ensureSetting(AppSettingsConstants.SHOP_PHONE,
                AppSettingsConstants.DEFAULT_SHOP_PHONE,
                AppSettingsConstants.DESC_SHOP_PHONE);

        ensureSetting(AppSettingsConstants.SHOP_EMAIL,
                AppSettingsConstants.DEFAULT_SHOP_EMAIL,
                AppSettingsConstants.DESC_SHOP_EMAIL);

        log.info("✅ App Settings initialized.");
    }

    private void ensureSetting(String key, String defaultValue, String description) {
        // Check if exists
        String current = appSettingService.getSetting(key, null);
        if (current == null) {
            appSettingService.saveSetting(key, defaultValue, description);
            log.info("  + Set default for {}: {}", key, defaultValue);
        }
    }
}
