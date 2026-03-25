package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blog_posts")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BlogPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "excerpt", length = 500)
    private String excerpt; // Đoạn tóm tắt ngắn

    @Column(name = "featured_image", length = 500)
    private String featuredImage;
    
    @Column(name = "alt_image", length = 255)
    private String altImage; // SEO alt text for featured image
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0; // For featured/pinned posts ordering

    @Column(name = "meta_title", length = 255)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private BlogPostStatusEnum status = BlogPostStatusEnum.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BlogCategory category;

    // Phân cấp - Bài viết cha (nếu là series)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private BlogPost parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BlogPost> children = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "blog_post_tags",
        joinColumns = @JoinColumn(name = "blog_post_id"),
        inverseJoinColumns = @JoinColumn(name = "blog_tag_id")
    )
    @Builder.Default
    private List<BlogTag> tags = new ArrayList<>();

    /**
     * Check if this blog post is a root post (no parent)
     */
    public boolean isRoot() {
        return parent == null;
    }
}

