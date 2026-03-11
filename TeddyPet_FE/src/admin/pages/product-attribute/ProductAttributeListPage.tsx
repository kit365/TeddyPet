import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ProductAttributeList } from "./sections/ProductAttributeList";

export const ProductAttributeListPage = () => {
    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Thuộc tính sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Thuộc tính sản phẩm" }
                ]}
                addButtonLabel="Thêm thuộc tính"
                addButtonPath={`/${prefixAdmin}/product-attribute/create`}
            />

            <ProductAttributeList />
        </div>
    )
}
