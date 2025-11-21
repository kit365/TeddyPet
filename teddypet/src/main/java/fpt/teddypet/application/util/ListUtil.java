package fpt.teddypet.application.util;

import java.util.Collections;
import java.util.List;

//Util trả về default an toàn, check != null | empty
public final class ListUtil {

    private ListUtil() {

    }

 
    public static <T> List<T> safe(List<T> list) {
        return list == null ? Collections.emptyList() : list;
    }

   
    public static boolean isNullOrEmpty(List<?> list) {
        return list == null || list.isEmpty();
    }
}
