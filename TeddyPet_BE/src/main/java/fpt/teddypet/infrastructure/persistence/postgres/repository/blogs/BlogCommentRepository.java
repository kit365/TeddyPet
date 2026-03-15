package fpt.teddypet.infrastructure.persistence.postgres.repository.blogs;

import fpt.teddypet.domain.entity.BlogComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {
    List<BlogComment> findByBlogPostIdAndParentIsNullOrderByCreatedAtDesc(Long blogPostId);
}
