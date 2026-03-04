package fpt.teddypet.presentation.controller.amenity;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.amenity.AmenityCategoryUpsertRequest;
import fpt.teddypet.application.dto.request.amenity.AmenityUpsertRequest;
import fpt.teddypet.application.dto.response.amenity.AmenityCategoryResponse;
import fpt.teddypet.application.dto.response.amenity.AmenityCategoryWithAmenitiesResponse;
import fpt.teddypet.application.dto.response.amenity.AmenityListItemResponse;
import fpt.teddypet.application.dto.response.amenity.AmenityResponse;
import fpt.teddypet.domain.entity.Amenity;
import fpt.teddypet.domain.entity.AmenityCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.amenity.AmenityCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.amenity.AmenityRepository;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Tag(name = "Amenity", description = "APIs for amenities and categories (dropdown + admin CRUD)")
public class AmenityController {

    private final AmenityCategoryRepository amenityCategoryRepository;
    private final AmenityRepository amenityRepository;

    // ---------- Dropdown / public (active only) ----------
    @GetMapping(ApiConstants.API_AMENITIES)
    @Operation(summary = "List amenities (flat) for multi-select; use forAdmin=true for admin list")
    public ResponseEntity<ApiResponse<?>> listAmenities(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean forAdmin) {
        List<Amenity> list;
        if (Boolean.TRUE.equals(forAdmin)) {
            list = categoryId != null
                    ? amenityRepository.findByCategory_IdAndIsDeletedFalseOrderByDisplayOrderAsc(categoryId)
                    : amenityRepository.findByIsDeletedFalseOrderByCategory_IdAscDisplayOrderAsc();
            List<AmenityResponse> dtos = list.stream().map(AmenityController::toAmenityResponse).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        }
        list = categoryId != null
                ? amenityRepository.findByCategoryIdAndIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc(categoryId)
                : amenityRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
        List<AmenityListItemResponse> dtos = list.stream()
                .map(a -> new AmenityListItemResponse(
                        a.getId(),
                        a.getDescription(),
                        a.getIcon(),
                        a.getCategory().getId(),
                        a.getCategory().getCategoryName(),
                        a.getDisplayOrder(),
                        a.isActive()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping(ApiConstants.API_AMENITY_CATEGORIES)
    @Operation(summary = "List categories (with nested amenities if not forAdmin); use forAdmin=true for admin list")
    public ResponseEntity<ApiResponse<?>> listCategories(
            @RequestParam(required = false) Boolean forAdmin) {
        if (Boolean.TRUE.equals(forAdmin)) {
            List<AmenityCategory> categories = amenityCategoryRepository.findByIsDeletedFalseOrderByDisplayOrderAsc();
            List<AmenityCategoryResponse> result = categories.stream()
                    .map(c -> new AmenityCategoryResponse(
                            c.getId(),
                            c.getCategoryName(),
                            c.getDescription(),
                            c.getDisplayOrder(),
                            c.getIcon(),
                            c.isActive(),
                            c.isDeleted(),
                            c.getCreatedAt(),
                            c.getUpdatedAt()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        List<AmenityCategory> categories = amenityCategoryRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
        List<AmenityCategoryWithAmenitiesResponse> result = new ArrayList<>();
        for (AmenityCategory cat : categories) {
            List<Amenity> amenities = amenityRepository.findByCategoryIdAndIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc(cat.getId());
            List<AmenityListItemResponse> items = amenities.stream()
                    .map(a -> new AmenityListItemResponse(
                            a.getId(),
                            a.getDescription(),
                            a.getIcon(),
                            cat.getId(),
                            cat.getCategoryName(),
                            a.getDisplayOrder(),
                            a.isActive()))
                    .collect(Collectors.toList());
            result.add(new AmenityCategoryWithAmenitiesResponse(
                    cat.getId(),
                    cat.getCategoryName(),
                    cat.getDisplayOrder(),
                    items));
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ---------- Admin CRUD: Amenity Category ----------
    @GetMapping(ApiConstants.API_AMENITY_CATEGORIES + "/{id}")
    @Operation(summary = "Get category by id")
    public ResponseEntity<ApiResponse<AmenityCategoryResponse>> getCategoryById(@PathVariable Long id) {
        return amenityCategoryRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .map(c -> ResponseEntity.ok(ApiResponse.success(new AmenityCategoryResponse(
                        c.getId(),
                        c.getCategoryName(),
                        c.getDescription(),
                        c.getDisplayOrder(),
                        c.getIcon(),
                        c.isActive(),
                        c.isDeleted(),
                        c.getCreatedAt(),
                        c.getUpdatedAt()))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy danh mục")));
    }

    @PostMapping(ApiConstants.API_AMENITY_CATEGORIES)
    @Operation(summary = "Create category")
    public ResponseEntity<ApiResponse<AmenityCategoryResponse>> createCategory(@Valid @RequestBody AmenityCategoryUpsertRequest request) {
        AmenityCategory entity = AmenityCategory.builder()
                .categoryName(request.categoryName().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .icon(request.icon() != null ? request.icon().trim() : null)
                .isDeleted(false)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .build();
        entity = amenityCategoryRepository.save(entity);
        AmenityCategoryResponse res = new AmenityCategoryResponse(
                entity.getId(),
                entity.getCategoryName(),
                entity.getDescription(),
                entity.getDisplayOrder(),
                entity.getIcon(),
                entity.isActive(),
                entity.isDeleted(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo danh mục tiện nghi thành công.", res));
    }

    @PutMapping(ApiConstants.API_AMENITY_CATEGORIES + "/{id}")
    @Operation(summary = "Update category")
    public ResponseEntity<ApiResponse<AmenityCategoryResponse>> updateCategory(@PathVariable Long id, @Valid @RequestBody AmenityCategoryUpsertRequest request) {
        AmenityCategory entity = amenityCategoryRepository.findById(id).orElse(null);
        if (entity == null || entity.isDeleted())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy danh mục"));
        entity.setCategoryName(request.categoryName().trim());
        entity.setDescription(request.description() != null ? request.description().trim() : null);
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        entity.setIcon(request.icon() != null ? request.icon().trim() : null);
        if (request.isActive() != null) entity.setActive(request.isActive());
        entity = amenityCategoryRepository.save(entity);
        AmenityCategoryResponse res = new AmenityCategoryResponse(
                entity.getId(),
                entity.getCategoryName(),
                entity.getDescription(),
                entity.getDisplayOrder(),
                entity.getIcon(),
                entity.isActive(),
                entity.isDeleted(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục tiện nghi thành công.", res));
    }

    @DeleteMapping(ApiConstants.API_AMENITY_CATEGORIES + "/{id}")
    @Operation(summary = "Soft delete category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        AmenityCategory entity = amenityCategoryRepository.findById(id).orElse(null);
        if (entity == null || entity.isDeleted())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy danh mục"));
        entity.setDeleted(true);
        entity.setActive(false);
        amenityCategoryRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa danh mục tiện nghi."));
    }

    // ---------- Admin CRUD: Amenity ----------
    @GetMapping(ApiConstants.API_AMENITIES + "/{id}")
    @Operation(summary = "Get amenity by id")
    public ResponseEntity<ApiResponse<AmenityResponse>> getAmenityById(@PathVariable Long id) {
        return amenityRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .map(a -> ResponseEntity.ok(ApiResponse.success(toAmenityResponse(a))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy tiện nghi")));
    }

    @PostMapping(ApiConstants.API_AMENITIES)
    @Operation(summary = "Create amenity")
    public ResponseEntity<ApiResponse<AmenityResponse>> createAmenity(@Valid @RequestBody AmenityUpsertRequest request) {
        AmenityCategory category = amenityCategoryRepository.findById(request.categoryId()).orElse(null);
        if (category == null || category.isDeleted())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Danh mục không tồn tại"));
        Amenity entity = Amenity.builder()
                .category(category)
                .description(request.description() != null ? request.description().trim() : null)
                .icon(request.icon() != null ? request.icon().trim() : null)
                .image(request.image() != null ? request.image().trim() : null)
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .isDeleted(false)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .build();
        entity = amenityRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo tiện nghi thành công.", toAmenityResponse(entity)));
    }

    @PutMapping(ApiConstants.API_AMENITIES + "/{id}")
    @Operation(summary = "Update amenity")
    public ResponseEntity<ApiResponse<AmenityResponse>> updateAmenity(@PathVariable Long id, @Valid @RequestBody AmenityUpsertRequest request) {
        Amenity entity = amenityRepository.findById(id).orElse(null);
        if (entity == null || entity.isDeleted())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy tiện nghi"));
        AmenityCategory category = amenityCategoryRepository.findById(request.categoryId()).orElse(null);
        if (category == null || category.isDeleted())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Danh mục không tồn tại"));
        entity.setCategory(category);
        entity.setDescription(request.description() != null ? request.description().trim() : null);
        entity.setIcon(request.icon() != null ? request.icon().trim() : null);
        entity.setImage(request.image() != null ? request.image().trim() : null);
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        if (request.isActive() != null) entity.setActive(request.isActive());
        entity = amenityRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiện nghi thành công.", toAmenityResponse(entity)));
    }

    @DeleteMapping(ApiConstants.API_AMENITIES + "/{id}")
    @Operation(summary = "Soft delete amenity")
    public ResponseEntity<ApiResponse<Void>> deleteAmenity(@PathVariable Long id) {
        Amenity entity = amenityRepository.findById(id).orElse(null);
        if (entity == null || entity.isDeleted())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy tiện nghi"));
        entity.setDeleted(true);
        entity.setActive(false);
        amenityRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tiện nghi."));
    }

    private static AmenityResponse toAmenityResponse(Amenity a) {
        return new AmenityResponse(
                a.getId(),
                a.getCategory().getId(),
                a.getCategory().getCategoryName(),
                a.getDescription(),
                a.getIcon(),
                a.getImage(),
                a.getDisplayOrder(),
                a.isActive(),
                a.isDeleted(),
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
