package fpt.teddypet.infrastructure.adapter.blogs;

import fpt.teddypet.application.port.output.blogs.BlogCommentRepositoryPort;
import fpt.teddypet.domain.entity.BlogComment;
import fpt.teddypet.infrastructure.persistence.postgres.repository.blogs.BlogCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BlogCommentRepositoryAdapter implements BlogCommentRepositoryPort {

    private final BlogCommentRepository blogCommentRepository;

    @Override
    public BlogComment save(BlogComment comment) {
        return blogCommentRepository.save(comment);
    }

    @Override
    public Optional<BlogComment> findById(Long id) {
        return blogCommentRepository.findById(id);
    }

    @Override
    public List<BlogComment> findByBlogPostIdAndParentIdIsNullOrderByCreatedAtDesc(Long blogPostId) {
        return blogCommentRepository.findByBlogPostIdAndParentIsNullOrderByCreatedAtDesc(blogPostId);
    }

    @Override
    public void delete(BlogComment comment) {
        blogCommentRepository.delete(comment);
    }
}
