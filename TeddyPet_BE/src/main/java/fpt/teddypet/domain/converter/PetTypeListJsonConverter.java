package fpt.teddypet.domain.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.domain.enums.PetTypeEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Persists List&lt;PetTypeEnum&gt; as JSON array in a TEXT column.
 * Backward compatible: if existing DB values are non-JSON, attempts to parse comma-separated values.
 */
@Converter
public class PetTypeListJsonConverter implements AttributeConverter<List<PetTypeEnum>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_STRING = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<PetTypeEnum> attribute) {
        if (attribute == null) return null;
        try {
            List<String> values = attribute.stream().map(Enum::name).toList();
            return MAPPER.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize suitablePetTypes to JSON", e);
        }
    }

    @Override
    public List<PetTypeEnum> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        String trimmed = dbData.trim();
        try {
            // JSON array format: ["DOG","CAT"]
            if (trimmed.startsWith("[")) {
                List<String> raw = MAPPER.readValue(trimmed, LIST_STRING);
                return toEnums(raw);
            }
        } catch (Exception ignored) {
            // fall through to legacy parsing
        }

        // Legacy: comma-separated string (e.g. "DOG,CAT")
        String[] parts = trimmed.split(",");
        List<String> raw = new ArrayList<>();
        for (String p : parts) {
            String v = p == null ? "" : p.trim();
            if (!v.isEmpty()) raw.add(v);
        }
        return toEnums(raw);
    }

    private List<PetTypeEnum> toEnums(List<String> raw) {
        List<PetTypeEnum> result = new ArrayList<>();
        for (String v : raw) {
            if (v == null) continue;
            String key = v.trim().toUpperCase(Locale.ENGLISH);
            if (key.isEmpty()) continue;
            try {
                result.add(PetTypeEnum.valueOf(key));
            } catch (IllegalArgumentException ignored) {
                // ignore unknown values
            }
        }
        return result;
    }
}

