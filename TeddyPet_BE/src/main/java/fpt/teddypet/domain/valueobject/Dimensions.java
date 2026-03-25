package fpt.teddypet.domain.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Dimensions {
    private Integer weight;
    private Integer length;
    private Integer width;
    private Integer height;

    public static Dimensions of(Integer weight, Integer length, Integer width, Integer height) {
        return new Dimensions(
                weight != null && weight >= 0 ? weight : 0,
                length != null && length >= 0 ? length : 0,
                width != null && width >= 0 ? width : 0,
                height != null && height >= 0 ? height : 0
        );
    }

    public static Dimensions empty() {
        return new Dimensions(0, 0, 0, 0);
    }
}

