package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.BlogTagRepositoryPort;
import fpt.teddypet.domain.entity.BlogTag;
import fpt.teddypet.infrastructure.persistence.postgres.repository.BlogTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BlogTagRepositoryAdapter implements BlogTagRepositoryPort {

    private final BlogTagRepository blogTagRepository;

    @Override
    public BlogTag save(BlogTag blogTag) {
        return blogTagRepository.save(blogTag);
    }

    @Override
    public void saveAll(List<BlogTag> blogTags) {
        blogTagRepository.saveAll(blogTags);
    }

    @Override
    public Optional<BlogTag> findById(Long id) {
        return blogTagRepository.findById(id);
    }

    @Override
    public Optional<BlogTag> findBySlug(String slug) {
        return blogTagRepository.findBySlug(slug);
    }

    @Override
    public Optional<BlogTag> findByName(String name) {
        return blogTagRepository.findByName(name);
    }

    @Override
    public List<BlogTag> findAll() {
        return blogTagRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Override
    public boolean existsBySlug(String slug) {
        return blogTagRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return blogTagRepository.existsBySlugAndIdNot(slug, id);
    }

    @Override
    public boolean existsByName(String name) {
        return blogTagRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long id) {
        return blogTagRepository.existsByNameAndIdNot(name, id);
    }

    @Override
    public void delete(BlogTag blogTag) {
        blogTagRepository.delete(blogTag);
    }
}
