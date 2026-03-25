package fpt.teddypet.application.port.input.services;

import fpt.teddypet.application.dto.request.services.category.ServiceCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryInfo;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryNestedResponse;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryResponse;
import fpt.teddypet.domain.entity.ServiceCategory;

import java.util.List;

public interface ServiceCategoryService {

    void upsert(ServiceCategoryUpsertRequest request);

    ServiceCategoryResponse getCategoryDetail(Long id);

    ServiceCategory getById(Long id);

    List<ServiceCategoryResponse> getAll();

    List<ServiceCategoryResponse> getRootCategories();

    List<ServiceCategoryResponse> getChildCategories(Long parentId);

    List<ServiceCategoryNestedResponse> getNestedCategories();

    void delete(Long id);

    ServiceCategoryInfo toInfo(ServiceCategory category);

    List<ServiceCategoryInfo> toInfos(List<ServiceCategory> categories);
}
