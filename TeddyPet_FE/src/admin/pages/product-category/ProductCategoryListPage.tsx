import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ProductCategoryList } from "./sections/ProductCategoryList";

export const ProductCategoryListPage = () => {
    return (
        <>
            <ListHeader
                title="Danh mục sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Danh mục sản phẩm", to: `/${prefixAdmin}/product-category/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Thêm danh mục"
                addButtonPath={`/${prefixAdmin}/product-category/create`}
            />

            <ProductCategoryList />
        </>
    )
}