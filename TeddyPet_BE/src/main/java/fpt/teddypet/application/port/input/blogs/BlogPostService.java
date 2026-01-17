package fpt.teddypet.application.port.input.blogs;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostSearchRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostUpdateRequest;
import fpt.teddypet.application.dto.response.blog.post.BlogPostListResponse;
import fpt.teddypet.application.dto.response.blog.post.BlogPostResponse;
import fpt.teddypet.domain.entity.BlogPost;

public interface BlogPostService {
    void create(BlogPostCreateRequest request);
    
    void update(Long id, BlogPostUpdateRequest request);
    
    BlogPost getById(Long id);
    
    BlogPostResponse getPostDetail(Long id);
    
    BlogPostResponse getPostBySlug(String slug);
    
    PageResponse<BlogPostListResponse> getAllPaged(BlogPostSearchRequest request);
    
    void delete(Long id);
    
    void incrementViewCount(Long id);
}
