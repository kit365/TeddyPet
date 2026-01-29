import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { BlogCategoryList } from "./sections/BlogCategoryList";
import { useTranslation } from "react-i18next";

export const BlogCategoryListPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <ListHeader
                title={t("admin.blog_category.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.blog_category.title.list"), to: `/${prefixAdmin}/blog-category/list` },
                    { label: t("admin.common.list") }
                ]}
                addButtonLabel={t("admin.blog_category.title.create")}
                addButtonPath={`/${prefixAdmin}/blog-category/create`}
            />

            <BlogCategoryList />
        </>
    )
}
