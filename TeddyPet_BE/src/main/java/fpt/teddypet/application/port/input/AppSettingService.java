package fpt.teddypet.application.port.input;

public interface AppSettingService {
    String getSetting(String key, String defaultValue);

    void saveSetting(String key, String value, String description);
}
