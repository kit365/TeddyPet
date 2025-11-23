package fpt.teddypet.application.service.carts;

import fpt.teddypet.application.constants.orders.cart.CartLogMessages;
import fpt.teddypet.application.constants.orders.cart.CartMessages;
import fpt.teddypet.application.dto.request.orders.cart.AddToCartRequest;
import fpt.teddypet.application.dto.request.orders.cart.UpdateCartItemRequest;
import fpt.teddypet.application.dto.response.orders.CartItemResponse;
import fpt.teddypet.application.dto.response.orders.CartResponse;
import fpt.teddypet.application.mapper.orders.CartMapper;
import fpt.teddypet.application.port.input.orders.CartItemService;
import fpt.teddypet.application.port.input.orders.CartService;
import fpt.teddypet.application.port.input.products.ProductVariantService;
import fpt.teddypet.application.port.output.orders.CartRepositoryPort;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.infrastructure.persistence.mongodb.document.Cart;
import fpt.teddypet.infrastructure.persistence.mongodb.document.CartItem;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;


@Slf4j
@Service
@RequiredArgsConstructor
public class CartApplicationService implements CartService {

    private final CartRepositoryPort cartRepositoryPort;
    private final ProductVariantService productVariantService;
    private final CartItemService cartItemService;
    private final CartMapper cartMapper;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartResponse() {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info(CartLogMessages.LOG_CART_GET_START, userId);

        Cart cart = getOrCreateCart(userId);

        List<ProductVariant> variants = loadVariantsForCart(cart);

        List<CartItemResponse> itemResponses = cartItemService.toResponses(cart.getItems(), variants);
        

        BigDecimal totalAmount = calculateTotalAmount(itemResponses);
        int totalItems = calculateTotalItems(cart.getItems());
        
        CartResponse response = cartMapper.toResponse(cart, itemResponses, totalAmount, totalItems);
        log.info(CartLogMessages.LOG_CART_GET_SUCCESS, totalItems);
        
        return response;
    }

    @Override
    @Transactional
    public void addItemToCart(AddToCartRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info(CartLogMessages.LOG_CART_ADD_START, request.variantId(), request.quantity());

        // Validate variant exists and is available
        ProductVariant variant = validateAndGetVariant(request.variantId());
        validateStock(variant, request.quantity());

        Cart cart = getOrCreateCart(userId);

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getVariantId().equals(request.variantId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Merge quantity
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.quantity();
            validateStock(variant, newQuantity);
            item.setQuantity(newQuantity);
            log.info(CartLogMessages.LOG_CART_ADD_MERGED, request.variantId(), newQuantity);
        } else {
            // Add new item
            CartItem newItem = CartItem.builder()
                    .variantId(request.variantId())
                    .quantity(request.quantity())
                    .build();
            cart.getItems().add(newItem);
        }

        cartRepositoryPort.save(cart);
        log.info(CartLogMessages.LOG_CART_ADD_SUCCESS, request.variantId());
    }

    @Override
    @Transactional
    public void updateCartItemQuantity(UpdateCartItemRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info(CartLogMessages.LOG_CART_UPDATE_START, request.variantId());

        // Validate variant and stock
        ProductVariant variant = validateAndGetVariant(request.variantId());
        validateStock(variant, request.quantity());

        Cart cart = getOrCreateCart(userId);

        // Find and update item
        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getVariantId().equals(request.variantId()))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException(CartMessages.MESSAGE_CART_ITEM_NOT_FOUND));

        item.setQuantity(request.quantity());
        cartRepositoryPort.save(cart);
        
        log.info(CartLogMessages.LOG_CART_UPDATE_SUCCESS, request.variantId(), request.quantity());
    }

    @Override
    @Transactional
    public void removeItemFromCart(Long variantId) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info(CartLogMessages.LOG_CART_REMOVE_START, variantId);

        Cart cart = getOrCreateCart(userId);

        boolean removed = cart.getItems().removeIf(item -> item.getVariantId().equals(variantId));

        if (!removed) {
            log.warn(CartLogMessages.LOG_CART_REMOVE_NOT_FOUND, variantId);
            throw new EntityNotFoundException(CartMessages.MESSAGE_CART_ITEM_NOT_FOUND);
        }

        cartRepositoryPort.save(cart);
        log.info(CartLogMessages.LOG_CART_REMOVE_SUCCESS, variantId);
    }

    @Override
    @Transactional
    public void clearCart() {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info(CartLogMessages.LOG_CART_CLEAR_START, userId);

        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepositoryPort.save(cart);

        log.info(CartLogMessages.LOG_CART_CLEAR_SUCCESS);
    }

    private Cart getOrCreateCart(Long userId) {
        Optional<Cart> existingCart = cartRepositoryPort.findByUserId(userId);
        
        if (existingCart.isPresent()) {
            return existingCart.get();
        }

        log.info(CartLogMessages.LOG_CART_GET_CREATED_NEW, userId);
        Cart newCart = Cart.builder()
                .userId(String.valueOf(userId))
                .items(new ArrayList<>())
                .build();
        return cartRepositoryPort.save(newCart);
    }

    private List<ProductVariant> loadVariantsForCart(Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return List.of();
        }

        List<Long> variantIds = cart.getItems().stream()
                .map(CartItem::getVariantId)
                .distinct()
                .toList();

        return variantIds.stream()
                .map(id -> {
                    try {
                        return productVariantService.getByIdForCart(id);
                    } catch (Exception e) {
                        log.warn(CartLogMessages.LOG_CART_VARIANT_LOAD_FAILED, id, e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private BigDecimal calculateTotalAmount(List<CartItemResponse> itemResponses) {
        if (itemResponses == null || itemResponses.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return itemResponses.stream()
                .map(CartItemResponse::subTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int calculateTotalItems(List<CartItem> cartItems) {
        if (cartItems == null) {
            return 0;
        }
        return cartItems.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private ProductVariant validateAndGetVariant(Long variantId) {
        log.info(CartLogMessages.LOG_CART_VALIDATE_VARIANT, variantId);
        
        try {
            ProductVariant variant = productVariantService.getByIdForCart(variantId);
            
            if (variant.isDeleted() || !variant.isActive()) {
                log.warn(CartLogMessages.LOG_CART_VALIDATE_FAILED, "Product not available");
                throw new IllegalStateException(CartMessages.MESSAGE_CART_PRODUCT_NOT_AVAILABLE);
            }
            
            return variant;
        } catch (EntityNotFoundException e) {
            throw new EntityNotFoundException(
                    String.format(CartMessages.MESSAGE_CART_VARIANT_NOT_FOUND, variantId));
        }
    }

    private void validateStock(ProductVariant variant, int requestedQuantity) {
        int availableStock = variant.getStockQuantity().getValue();
        log.info(CartLogMessages.LOG_CART_VALIDATE_STOCK, 
                variant.getVariantId(), availableStock, requestedQuantity);

        if (availableStock <= 0) {
            log.warn(CartLogMessages.LOG_CART_VALIDATE_FAILED, "Out of stock");
            throw new IllegalStateException(CartMessages.MESSAGE_CART_OUT_OF_STOCK);
        }

        if (requestedQuantity > availableStock) {
            log.warn(CartLogMessages.LOG_CART_VALIDATE_FAILED, 
                    String.format("Insufficient stock: requested %d, available %d", 
                            requestedQuantity, availableStock));
            throw new IllegalStateException(
                    String.format(CartMessages.MESSAGE_CART_INSUFFICIENT_STOCK, availableStock));
        }
    }
}
