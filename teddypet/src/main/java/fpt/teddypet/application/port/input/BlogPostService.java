package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.blog.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blog.post.BlogPostSearchRequest;
import fpt.teddypet.application.dto.request.blog.post.BlogPostUpdateRequest;
import fpt.teddypet.application.dto.response.blog.post.BlogPostListResponse;
import fpt.teddypet.application.dto.response.blog.post.BlogPostResponse;
import fpt.teddypet.domain.entity.BlogPost;

public interface BlogPostService {
    BlogPostResponse create(BlogPostCreateRequest request);
    
    BlogPostResponse update(Long id, BlogPostUpdateRequest request);
    
    BlogPost getById(Long id);
    
    BlogPostResponse getPostDetail(Long id);
    
    BlogPostResponse getPostBySlug(String slug);
    
    PageResponse<BlogPostListResponse> getAllPaged(BlogPostSearchRequest request);
    
    void delete(Long id);
    
    void incrementViewCount(Long id);
}
