package fpt.teddypet.application.service.products.wishlist;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.wishlist.WishlistResponse;
import fpt.teddypet.application.port.input.products.wishlist.WishlistService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.Wishlist;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.WishlistRepository;
import fpt.teddypet.application.mapper.products.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepositoryPort userRepositoryPort;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WishlistResponse> getMyWishlist(int page, int size) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Page<Wishlist> wishlistPage = wishlistRepository.findByUserId(currentUserId, pageable);

        List<WishlistResponse> responses = wishlistPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                responses,
                wishlistPage.getNumber() + 1,
                wishlistPage.getSize(),
                wishlistPage.getTotalElements(),
                wishlistPage.getTotalPages(),
                wishlistPage.isFirst(),
                wishlistPage.isLast());
    }

    @Override
    @Transactional
    public void toggleWishlist(Long productId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        if (wishlistRepository.existsByUserIdAndProductId(currentUserId, productId)) {
            wishlistRepository.deleteByUserIdAndProductId(currentUserId, productId);
        } else {
            User user = userRepositoryPort.getById(currentUserId);
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .build();

            wishlistRepository.save(wishlist);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkWishlist(Long productId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        return wishlistRepository.existsByUserIdAndProductId(currentUserId, productId);
    }

    private WishlistResponse mapToResponse(Wishlist wishlist) {
        Product product = wishlist.getProduct();

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .productId(product.getId())
                .addedAt(wishlist.getCreatedAt())
                .product(productMapper.toResponse(product))
                .build();
    }
}
