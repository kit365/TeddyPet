package fpt.teddypet.application.dto.request.settings;

public record AppSettingUpsertRequest(
                String settingValue,
                String description) {
}
