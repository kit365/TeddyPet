package fpt.teddypet.presentation.validation;

import fpt.teddypet.domain.enums.PetTypeEnum;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class RequestParamParser {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE; // yyyy-MM-dd
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME; // yyyy-MM-ddTHH:mm:ss

    private RequestParamParser() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static List<Long> parseLongList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .toList();
        } catch (NumberFormatException e) {
            return new ArrayList<>();
        }
    }

    public static List<PetTypeEnum> parsePetTypeList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(PetTypeEnum::valueOf)
                    .toList();
        } catch (IllegalArgumentException e) {
            return new ArrayList<>();
        }
    }


    public static LocalDateTime parseLocalDateTime(String value, boolean isToDate) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String trimmedValue = value.trim();
        try {
            //datetime format(yyyy-MM-ddTHH:mm:ss)
            if (trimmedValue.contains("T")) {
                return LocalDateTime.parse(trimmedValue, DATETIME_FORMATTER);
            }
            //date format (yyyy-MM-dd)
            LocalDate date = LocalDate.parse(trimmedValue, DATE_FORMATTER);
            // Set time: 00:00:00 for "from", 23:59:59 for "to"
            return isToDate ? date.atTime(23, 59, 59) : date.atStartOfDay();
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}

