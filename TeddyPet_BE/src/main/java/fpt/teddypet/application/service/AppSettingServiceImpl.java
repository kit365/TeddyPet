package fpt.teddypet.application.service;

import fpt.teddypet.application.port.input.AppSettingService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository;
import fpt.teddypet.domain.entity.AppSetting;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppSettingServiceImpl implements AppSettingService {

    private final AppSettingRepository appSettingRepository;

    @Override
    public String getSetting(String key, String defaultValue) {
        return appSettingRepository.findBySettingKey(key)
                .map(AppSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    @Transactional
    public void saveSetting(String key, String value, String description) {
        AppSetting setting = appSettingRepository.findBySettingKey(key)
                .orElse(AppSetting.builder().settingKey(key).build());

        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }
        appSettingRepository.save(setting);
    }
}
