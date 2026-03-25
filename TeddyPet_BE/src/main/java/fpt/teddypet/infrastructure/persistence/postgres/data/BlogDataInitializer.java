package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.dto.request.blogs.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blogs.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.application.service.blogs.BlogCategoryApplicationService;
import fpt.teddypet.application.service.blogs.BlogPostApplicationService;
import fpt.teddypet.application.service.blogs.BlogTagApplicationService;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@org.springframework.context.annotation.Profile("!prod")
@Order(2) // Run after DataInitializer
@RequiredArgsConstructor
public class BlogDataInitializer implements CommandLineRunner {

    private final BlogCategoryApplicationService blogCategoryService;
    private final BlogTagApplicationService blogTagService;
    private final BlogPostApplicationService blogPostService;
    private final fpt.teddypet.application.port.output.blogs.BlogPostRepositoryPort blogPostRepository;

    @Override
    public void run(String... args) {
        initializeBlogCategories();
        initializeBlogTags();
        initializeBlogPosts();
    }

    private void initializeBlogCategories() {
        if (!blogCategoryService.getAll().isEmpty()) {
            return;
        }

        log.info("🌱 Seeding Blog Categories...");

        // 1. Root Categories
        createCategory("News", "Latest news and updates", null, 1);
        createCategory("Pet Care Tips", "Useful tips for pet owners", null, 2);

        BlogCategoryResponse tips = blogCategoryService.getAll().stream()
                .filter(c -> c.name().equals("Pet Care Tips"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Category 'Pet Care Tips' not found after seeding"));

        // 2. Child Categories for Tips
        createCategory("Dog Care", "Tips specifically for dogs", tips.categoryId(), 1);
        createCategory("Cat Care", "Tips specifically for cats", tips.categoryId(), 2);
        createCategory("Nutrition", "Feeding and nutrition advice", tips.categoryId(), 3);

        log.info("✅ Blog Categories seeded.");
    }

    private void createCategory(String name, String description, Long parentId, Integer order) {
        blogCategoryService.upsert(new BlogCategoryUpsertRequest(
                null, name, description, null, true, parentId, order));
    }

    private void initializeBlogTags() {
        if (!blogTagService.getAll().isEmpty()) {
            return;
        }

        log.info("🌱 Seeding Blog Tags...");

        createTag("Puppy", "For young dogs", 1);
        createTag("Kitten", "For young cats", 2);
        createTag("Training", "Behavior and training", 3);
        createTag("Health", "Medical and health topics", 4);
        createTag("Food", "Diet and food", 5);
        createTag("Fun", "Fun activities", 6);

        log.info("✅ Blog Tags seeded.");
    }

    private void createTag(String name, String description, Integer order) {

        blogTagService.upsert(new BlogTagUpsertRequest(
                null, name, order));
    }

    private void initializeBlogPosts() {
        // Get IDs for linking
        List<BlogCategoryResponse> categories = blogCategoryService.getAll();
        if (categories.isEmpty())
            return;

        Long newsId = categories.stream().filter(c -> c.name().equals("News")).findFirst()
                .map(BlogCategoryResponse::categoryId).orElse(null);
        Long tipsId = categories.stream().filter(c -> c.name().equals("Pet Care Tips")).findFirst()
                .map(BlogCategoryResponse::categoryId).orElse(null);

        List<BlogTagResponse> tags = blogTagService.getAll();
        List<Long> tagIds = tags.stream().map(BlogTagResponse::tagId).limit(3).toList();

        log.info("🌱 Checking/Seeding Blog Posts...");

        // Post 1
        createPostIfNotExists(
                "Welcome to TeddyPet Blog",
                "We are excited to launch our new blog! Here you will find...",
                "This is the full content of the welcome post. We cover everything from...",
                newsId,
                tagIds,
                BlogPostStatusEnum.PUBLISHED,
                1);

        // Post 2
        createPostIfNotExists(
                "Top 10 Dog Training Tips",
                "Train your dog like a pro with these simple tips.",
                "Training a dog can be challenging. Here are 10 tips...",
                tipsId,
                tagIds,
                BlogPostStatusEnum.PUBLISHED,
                2);

        // Post 3 (Draft)
        createPostIfNotExists(
                "Upcoming Pet Fair 2023",
                "Join us for the biggest pet event of the year.",
                "Details coming soon...",
                newsId,
                null,
                BlogPostStatusEnum.DRAFT,
                3);
    }

    private void createPostIfNotExists(String title, String excerpt, String content, Long categoryId, List<Long> tagIds,
            BlogPostStatusEnum status, Integer order) {
        String slug = fpt.teddypet.application.util.SlugUtil.toSlug(title);
        if (blogPostRepository.existsBySlug(slug)) {
            log.debug("Blog post with slug '{}' already exists, skipping.", slug);
            return;
        }

        BlogPostCreateRequest request = new BlogPostCreateRequest(
                title,
                content,
                excerpt,
                null, // featuredImage
                categoryId,
                tagIds,
                null, // parentId
                status,
                null, // metaTitle
                null, // metaDescription
                order);
        blogPostService.create(request);
        log.info("✅ Created Blog Post: {}", title);
    }
}
