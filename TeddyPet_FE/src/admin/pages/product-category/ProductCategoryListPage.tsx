import { useNavigate } from "react-router-dom";
import { ProductCategoryList } from "./sections/ProductCategoryList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";

export const ProductCategoryListPage = () => {
    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Danh mục sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Danh mục sản phẩm" }
                ]}
                addButtonLabel="Thêm danh mục"
                addButtonPath={`/${prefixAdmin}/product-category/create`}
            />

            <ProductCategoryList />
        </div>
    );
};