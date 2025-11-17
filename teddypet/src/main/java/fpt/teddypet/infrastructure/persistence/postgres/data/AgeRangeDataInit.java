package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.AgeRange;
import fpt.teddypet.domain.enums.AgeRangeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.AgeRangeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;


@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class AgeRangeDataInit implements CommandLineRunner {

    private final AgeRangeRepository ageRangeRepository;

    // Mapping AgeRangeEnum to Vietnamese descriptions
    private static final Map<AgeRangeEnum, String> AGE_RANGE_DESCRIPTIONS = new EnumMap<>(AgeRangeEnum.class);
    static {
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.ALL, "Mọi lứa tuổi");
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.UNDER_1_YEAR, "Dưới 1 năm");
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.OVER_1_YEAR, "Trên 1 năm");
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.PUPPY, "Chó con");
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.ADULT, "Trưởng thành");
        AGE_RANGE_DESCRIPTIONS.put(AgeRangeEnum.SENIOR, "Già");
    }

    @Override
    public void run(String... args) {
        initializeAgeRanges();
    }

    private void initializeAgeRanges() {
        for (AgeRangeEnum ageRangeEnum : AgeRangeEnum.values()) {
            if (!ageRangeRepository.existsByName(ageRangeEnum.name())) {
                AgeRange ageRange = AgeRange.builder()
                        .name(ageRangeEnum.name())
                        .description(AGE_RANGE_DESCRIPTIONS.get(ageRangeEnum))
                        .build();
                ageRangeRepository.save(ageRange);
                log.info("✅ Created AgeRange: {} - {}", ageRangeEnum.name(), AGE_RANGE_DESCRIPTIONS.get(ageRangeEnum));
            } else {
                log.debug("AgeRange {} already exists, skipping", ageRangeEnum.name());
            }
        }
    }
}

