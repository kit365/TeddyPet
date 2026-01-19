import { ListHeader } from "../../components/ui/ListHeader";
import { Search } from "../../components/ui/Search";
import { Box } from "@mui/material";
import { prefixAdmin } from "../../constants/routes";
import { BlogCategoryList } from "./sections/BlogCategoryList";
import { useTranslation } from "react-i18next";

export const BlogCategoryListPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <ListHeader
                title={t("admin.blog.title.category")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.blog.title.category"), to: `/${prefixAdmin}/blog-category/list` },
                    { label: t("admin.common.list") }
                ]}
                addButtonLabel={t("admin.blog.title.category_create")}
                addButtonPath={`/${prefixAdmin}/blog-category/create`}
            />

            <Box sx={{ mb: '40px' }}>
                <Search maxWidth={400} placeholder="Tìm kiếm danh mục bài viết..." />
            </Box>

            <BlogCategoryList />
        </>
    )
}
