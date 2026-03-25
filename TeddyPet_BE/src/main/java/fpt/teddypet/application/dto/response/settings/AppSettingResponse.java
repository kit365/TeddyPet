package fpt.teddypet.application.dto.response.settings;

public record AppSettingResponse(
                String settingKey,
                String settingValue,
                String description) {
}
