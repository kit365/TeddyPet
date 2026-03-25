package fpt.teddypet.application.port.output.blogs;

import fpt.teddypet.domain.entity.BlogComment;
import java.util.List;
import java.util.Optional;

public interface BlogCommentRepositoryPort {
    BlogComment save(BlogComment comment);
    Optional<BlogComment> findById(Long id);
    List<BlogComment> findByBlogPostIdAndParentIdIsNullOrderByCreatedAtDesc(Long blogPostId);
    List<BlogComment> findAllByParentIdIsNullOrderByCreatedAtDesc();
    void delete(BlogComment comment);
}
