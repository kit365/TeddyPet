import { ListHeader } from "../../components/ui/ListHeader";
import { Search } from "../../components/ui/Search";
import { Box } from "@mui/material";
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

            <Box sx={{ mb: '40px' }}>
                <Search maxWidth={400} placeholder="Tìm kiếm danh mục..." />
            </Box>

            <ProductCategoryList />
        </>
    )
}