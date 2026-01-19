import { ListHeader } from "../../components/ui/ListHeader";
import { Search } from "../../components/ui/Search";
import { Box } from "@mui/material";
import { prefixAdmin } from "../../constants/routes";
import { BrandList } from "./sections/BrandList";

export const BrandListPage = () => {
    return (
        <>
            <ListHeader
                title="Thương hiệu"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Thương hiệu", to: `/${prefixAdmin}/brand/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Thêm thương hiệu"
                addButtonPath={`/${prefixAdmin}/brand/create`}
            />

            <Box sx={{ mb: '40px' }}>
                <Search maxWidth={400} placeholder="Tìm kiếm thương hiệu..." />
            </Box>

            <BrandList />
        </>
    )
}
