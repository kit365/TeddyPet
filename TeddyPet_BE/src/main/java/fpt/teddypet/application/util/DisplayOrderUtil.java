package fpt.teddypet.application.util;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Advanced utility class for managing displayOrder fields across entities.
 * Provides comprehensive functionality for:
 * - Auto-increment display orders
 * - Reordering entities
 * - Gap filling and normalization
 * - Bulk operations
 * - Validation
 */
public final class DisplayOrderUtil {

    private DisplayOrderUtil() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Get next displayOrder value based on existing entities.
     * 
     * @param existingEntities List of existing entities
     * @param displayOrderGetter Function to extract displayOrder from entity
     * @param <T> Entity type
     * @return Next displayOrder (max + 1), or 0 if list is empty
     */
    public static <T> int getNextDisplayOrder(List<T> existingEntities, Function<T, Integer> displayOrderGetter) {
        if (existingEntities == null || existingEntities.isEmpty()) {
            return 0;
        }
        
        int maxDisplayOrder = existingEntities.stream()
                .map(displayOrderGetter)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(-1);
        
        return maxDisplayOrder + 1;
    }

    /**
     * Get next displayOrder from max value.
     * 
     * @param maxDisplayOrder Current max displayOrder
     * @return Next displayOrder (max + 1), or 0 if max < 0
     */
    public static int getNextDisplayOrder(int maxDisplayOrder) {
        return maxDisplayOrder < 0 ? 0 : maxDisplayOrder + 1;
    }

    /**
     * Normalize displayOrder values to remove gaps and start from 0.
     * Useful after deletions or reordering.
     * 
     * @param entities List of entities to normalize
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     */
    public static <T> void normalizeDisplayOrders(
            List<T> entities,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        if (entities == null || entities.isEmpty()) {
            return;
        }

        // Sort by current displayOrder, then assign sequential values starting from 0
        List<T> sortedEntities = entities.stream()
                .sorted(Comparator.comparing(displayOrderGetter, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        for (int i = 0; i < sortedEntities.size(); i++) {
            displayOrderSetter.accept(sortedEntities.get(i), i);
        }
    }

    /**
     * Reorder an entity to a new position.
     * Automatically shifts other entities to maintain sequential order.
     * 
     * @param entities All entities in the collection
     * @param targetEntity Entity to move
     * @param newPosition New position (0-indexed)
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     */
    public static <T> void reorderEntity(
            List<T> entities,
            T targetEntity,
            int newPosition,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        if (entities == null || entities.isEmpty() || targetEntity == null) {
            return;
        }

        ValidationUtils.ensure(
            newPosition >= 0 && newPosition < entities.size(),
            String.format("Invalid position: %d. Must be between 0 and %d", newPosition, entities.size() - 1)
        );

        // Get sorted list
        List<T> sortedEntities = entities.stream()
                .sorted(Comparator.comparing(displayOrderGetter, Comparator.nullsLast(Integer::compareTo)))
                .collect(Collectors.toList());

        // Remove target entity
        sortedEntities.remove(targetEntity);

        // Insert at new position
        sortedEntities.add(newPosition, targetEntity);

        // Reassign displayOrders
        for (int i = 0; i < sortedEntities.size(); i++) {
            displayOrderSetter.accept(sortedEntities.get(i), i);
        }
    }

    /**
     * Reorder multiple entities based on a list of IDs.
     * 
     * @param entities List of entities
     * @param orderedIds List of entity IDs in desired order
     * @param idGetter Function to get ID from entity
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     * @param <ID> ID type
     */
    public static <T, ID> void reorderByIds(
            List<T> entities,
            List<ID> orderedIds,
            Function<T, ID> idGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        if (entities == null || entities.isEmpty() || orderedIds == null) {
            return;
        }

        // Create a map of ID to displayOrder
        for (int i = 0; i < orderedIds.size(); i++) {
            final int displayOrder = i;
            final ID targetId = orderedIds.get(i);
            
            entities.stream()
                    .filter(entity -> Objects.equals(idGetter.apply(entity), targetId))
                    .findFirst()
                    .ifPresent(entity -> displayOrderSetter.accept(entity, displayOrder));
        }
    }

    /**
     * Check if displayOrder values have gaps.
     * 
     * @param entities List of entities
     * @param displayOrderGetter Function to get displayOrder
     * @param <T> Entity type
     * @return true if there are gaps in displayOrder sequence
     */
    public static <T> boolean hasGaps(List<T> entities, Function<T, Integer> displayOrderGetter) {
        if (entities == null || entities.isEmpty()) {
            return false;
        }

        List<Integer> orders = entities.stream()
                .map(displayOrderGetter)
                .filter(Objects::nonNull)
                .sorted()
                .distinct()
                .toList();

        if (orders.isEmpty()) {
            return false;
        }

        // Check if sequence is 0, 1, 2, 3...
        return !IntStream.range(0, orders.size())
                .allMatch(i -> i == orders.get(i));
    }

    /**
     * Set default displayOrder for entities that don't have one.
     * 
     * @param entities List of entities
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     */
    public static <T> void setDefaultDisplayOrders(
            List<T> entities,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        if (entities == null || entities.isEmpty()) {
            return;
        }

        int nextOrder = getNextDisplayOrder(entities, displayOrderGetter);
        
        for (T entity : entities) {
            if (displayOrderGetter.apply(entity) == null) {
                displayOrderSetter.accept(entity, nextOrder++);
            }
        }
    }

    /**
     * Sort entities by displayOrder (nulls last).
     * 
     * @param entities List of entities to sort
     * @param displayOrderGetter Function to get displayOrder
     * @param <T> Entity type
     * @return Sorted list
     */
    public static <T> List<T> sortByDisplayOrder(List<T> entities, Function<T, Integer> displayOrderGetter) {
        if (entities == null || entities.isEmpty()) {
            return new ArrayList<>();
        }

        return entities.stream()
                .sorted(Comparator.comparing(displayOrderGetter, Comparator.nullsLast(Integer::compareTo)))
                .toList();
    }

    /**
     * Move entity up by one position (decrease displayOrder).
     * 
     * @param entities All entities
     * @param targetEntity Entity to move up
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     * @return true if moved successfully, false if already at top
     */
    public static <T> boolean moveUp(
            List<T> entities,
            T targetEntity,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        List<T> sorted = sortByDisplayOrder(entities, displayOrderGetter);
        int currentIndex = sorted.indexOf(targetEntity);
        
        if (currentIndex <= 0) {
            return false; // Already at top or not found
        }

        reorderEntity(entities, targetEntity, currentIndex - 1, displayOrderGetter, displayOrderSetter);
        return true;
    }

    /**
     * Move entity down by one position (increase displayOrder).
     * 
     * @param entities All entities
     * @param targetEntity Entity to move down
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     * @return true if moved successfully, false if already at bottom
     */
    public static <T> boolean moveDown(
            List<T> entities,
            T targetEntity,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        List<T> sorted = sortByDisplayOrder(entities, displayOrderGetter);
        int currentIndex = sorted.indexOf(targetEntity);
        
        if (currentIndex < 0 || currentIndex >= sorted.size() - 1) {
            return false; // Already at bottom or not found
        }

        reorderEntity(entities, targetEntity, currentIndex + 1, displayOrderGetter, displayOrderSetter);
        return true;
    }

    /**
     * Move entity to top (displayOrder = 0).
     * 
     * @param entities All entities
     * @param targetEntity Entity to move to top
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     */
    public static <T> void moveToTop(
            List<T> entities,
            T targetEntity,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        reorderEntity(entities, targetEntity, 0, displayOrderGetter, displayOrderSetter);
    }

    /**
     * Move entity to bottom (last position).
     * 
     * @param entities All entities
     * @param targetEntity Entity to move to bottom
     * @param displayOrderGetter Function to get displayOrder
     * @param displayOrderSetter Consumer to set displayOrder
     * @param <T> Entity type
     */
    public static <T> void moveToBottom(
            List<T> entities,
            T targetEntity,
            Function<T, Integer> displayOrderGetter,
            BiConsumer<T, Integer> displayOrderSetter) {
        
        if (entities == null || entities.isEmpty()) {
            return;
        }
        
        reorderEntity(entities, targetEntity, entities.size() - 1, displayOrderGetter, displayOrderSetter);
    }
}
