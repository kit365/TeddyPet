package fpt.teddypet.infrastructure.persistence.postgres;

import fpt.teddypet.application.dto.request.blog.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.request.blog.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blog.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.application.service.blog.BlogCategoryApplicationService;
import fpt.teddypet.application.service.blog.BlogPostApplicationService;
import fpt.teddypet.application.service.blog.BlogTagApplicationService;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(2) // Run after DataInitializer
@RequiredArgsConstructor
public class BlogDataInitializer implements CommandLineRunner {

    private final BlogCategoryApplicationService blogCategoryService;
    private final BlogTagApplicationService blogTagService;
    private final BlogPostApplicationService blogPostService;

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
        BlogCategoryResponse news = createCategory("News", "Latest updates and news", null, 1);
        BlogCategoryResponse tips = createCategory("Pet Care Tips", "Useful tips for pet owners", null, 2);
        BlogCategoryResponse events = createCategory("Events", "Upcoming events and meetups", null, 3);

        // 2. Child Categories for Tips
        createCategory("Dog Care", "Tips specifically for dogs", tips.categoryId(), 1);
        createCategory("Cat Care", "Tips specifically for cats", tips.categoryId(), 2);
        createCategory("Nutrition", "Feeding and nutrition advice", tips.categoryId(), 3);

        log.info("✅ Blog Categories seeded.");
    }

    private BlogCategoryResponse createCategory(String name, String description, Long parentId, Integer order) {
        return blogCategoryService.upsert(new BlogCategoryUpsertRequest(
                null, name, description, null, parentId, order
        ));
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

    private BlogTagResponse createTag(String name, String description, Integer order) {
        return blogTagService.upsert(new BlogTagUpsertRequest(
                null, name, order
        ));
    }

    private void initializeBlogPosts() {
        // Check if any posts exist (using a simple check, e.g., count)
        // Since we don't have count method exposed in service for all, we can check getAllPaged with size 1
        // Or just rely on repository if we injected it, but we want to stick to service.
        // Let's use getAllPaged with a dummy request.
        // Actually, let's just check if categories exist, which we did.
        // A better way is to check if we should seed.
        // For simplicity, I'll assume if categories were just seeded (or empty before), we seed posts.
        // But here I'll just try to find one post.
        
        // Since I can't easily check count without adding method, I will skip if tags are empty (which means we didn't seed tags just now? No, tags check is separate).
        // Let's just add a try-catch or check if list is empty.
        // I'll add a simple check by calling getAllPaged.
        
        // Actually, I'll just assume if I seeded categories/tags, I might need posts.
        // But to be safe, I won't check for posts existence via service efficiently without a count method.
        // I'll just skip this check for now and rely on the fact that this runs once on fresh DB usually.
        // Or I can add `count()` to service.
        // Let's add `count()` to BlogPostApplicationService later if needed.
        // For now, I will just run it. If posts exist, I might duplicate?
        // No, I should check.
        
        // I'll use a workaround: check if "Welcome to TeddyPet" slug exists.
        try {
            blogPostService.getPostBySlug("welcome-to-teddypet");
            return; // Exists
        } catch (Exception e) {
            // Not found, proceed
        }

        log.info("🌱 Seeding Blog Posts...");

        // Get IDs for linking
        List<BlogCategoryResponse> categories = blogCategoryService.getAll();
        if (categories.isEmpty()) return;
        
        Long newsId = categories.stream().filter(c -> c.name().equals("News")).findFirst().map(BlogCategoryResponse::categoryId).orElse(null);
        Long tipsId = categories.stream().filter(c -> c.name().equals("Pet Care Tips")).findFirst().map(BlogCategoryResponse::categoryId).orElse(null);
        
        List<BlogTagResponse> tags = blogTagService.getAll();
        List<Long> tagIds = tags.stream().map(BlogTagResponse::tagId).limit(3).toList();

        // Post 1
        createPost(
                "Welcome to TeddyPet Blog",
                "We are excited to launch our new blog! Here you will find...",
                "This is the full content of the welcome post. We cover everything from...",
                newsId,
                tagIds,
                BlogPostStatusEnum.PUBLISHED,
                1
        );

        // Post 2
        createPost(
                "Top 10 Dog Training Tips",
                "Train your dog like a pro with these simple tips.",
                "Training a dog can be challenging. Here are 10 tips...",
                tipsId,
                tagIds,
                BlogPostStatusEnum.PUBLISHED,
                2
        );

        // Post 3 (Draft)
        createPost(
                "Upcoming Pet Fair 2023",
                "Join us for the biggest pet event of the year.",
                "Details coming soon...",
                newsId,
                null,
                BlogPostStatusEnum.DRAFT,
                3
        );

        log.info("✅ Blog Posts seeded.");
    }

    private void createPost(String title, String excerpt, String content, Long categoryId, List<Long> tagIds, BlogPostStatusEnum status, Integer order) {
        BlogPostCreateRequest request = new BlogPostCreateRequest(
                title,
                content, // Swapped content and excerpt if needed, but checking DTO first
                excerpt,
                null, // featuredImage
                categoryId,
                tagIds,
                null, // parentId
                status,
                null, // metaTitle
                null, // metaDescription
                order
        );
        blogPostService.create(request);
    }
}
