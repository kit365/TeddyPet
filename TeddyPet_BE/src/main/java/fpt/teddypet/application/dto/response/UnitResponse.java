package fpt.teddypet.application.dto.response;

import fpt.teddypet.domain.enums.UnitEnum;

public record UnitResponse(String code, String label, String symbol, UnitEnum.UnitCategory category) {}
