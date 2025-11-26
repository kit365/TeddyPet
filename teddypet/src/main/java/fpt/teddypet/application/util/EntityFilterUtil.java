package fpt.teddypet.application.util;

import java.util.function.Function;
import java.util.function.Predicate;


public final class EntityFilterUtil {

    private EntityFilterUtil() {

    }

    public static <T, R> R filterAndMap(
            T entity,
            boolean includeDeleted,
            boolean onlyActive,
            Predicate<T> isDeleted,
            Predicate<T> isActive,
            Function<T, R> mapper) {

        if (entity == null) {
            return null;
        }

        if (!includeDeleted && isDeleted.test(entity)) {
            return null;
        }

        if (onlyActive && !isActive.test(entity)) {
            return null;
        }

        return mapper.apply(entity);
    }
}
