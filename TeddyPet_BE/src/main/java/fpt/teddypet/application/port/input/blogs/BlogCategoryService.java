package fpt.teddypet.application.port.input.blogs;

import fpt.teddypet.application.dto.request.blogs.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryInfo;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryNestedResponse;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.domain.entity.BlogCategory;

import java.util.List;

public interface BlogCategoryService {
    void upsert(BlogCategoryUpsertRequest request);
    
    BlogCategoryResponse getCategoryDetail(Long id);
    
    BlogCategory getById(Long id);
    
    List<BlogCategoryResponse> getAll();
    
    List<BlogCategoryResponse> getRootCategories();
    
    List<BlogCategoryResponse> getChildCategories(Long parentId);
    
    List<BlogCategoryNestedResponse> getNestedCategories();
    
    void delete(Long id);
    
    BlogCategoryInfo toInfo(BlogCategory category);
    
    List<BlogCategoryInfo> toInfos(List<BlogCategory> categories);
}
