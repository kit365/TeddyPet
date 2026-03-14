package fpt.teddypet.application.dto.response.dashboard;

import java.util.List;

/** Lượt truy cập theo vùng (Bắc, Trung, Nam) — data từ Redis/DB khi có tracking. */
public record VisitsByRegionResponse(
        long north,
        long central,
        long south,
        List<RegionCount> regions
) {
    public static VisitsByRegionResponse empty() {
        return new VisitsByRegionResponse(0, 0, 0, List.of(
                new RegionCount("Miền Bắc", 0),
                new RegionCount("Miền Trung", 0),
                new RegionCount("Miền Nam", 0)
        ));
    }

    public record RegionCount(String label, long count) {}
}
