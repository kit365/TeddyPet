package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blog_categories")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BlogCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "slug", nullable = false, unique = true, length = 255)
    private String slug;

    @Column(name = "image_url", length = 255)
    private String imageUrl;
    
    @Column(name = "alt_image", length = 255)
    private String altImage; // SEO alt text for image
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0; // For ordering categories

    // Phân cấp - Danh mục cha
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private BlogCategory parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BlogCategory> children = new ArrayList<>();

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @Builder.Default
    private List<BlogPost> blogPosts = new ArrayList<>();

    /**
     * Check if this category is a root category (no parent)
     */
    public boolean isRoot() {
        return parent == null;
    }
}

