import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { Box } from "@mui/material";
import { Search } from "../../components/ui/Search";
import { SortButton } from "../../components/ui/SortButton";
import { TabList } from "../../components/ui/TabList";
import { BlogList } from "./sections/BlogList";
import { useBlogs } from "./hooks/useBlog";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

export const BlogListPage = () => {
    const { t } = useTranslation();
    const { data: allBlogs = [], isLoading } = useBlogs();

    const [sortBy, setSortBy] = useState("latest");
    const [tabStatus, setTabStatus] = useState(0); // 0: All, 1: Published, 2: Draft, 3: Archived

    // Filter Logic
    const filteredBlogs = useMemo(() => {
        let result = [...allBlogs];

        // 1. Filter by Status
        if (tabStatus === 1) {
            result = result.filter(blog => blog.status === 'PUBLISHED');
        } else if (tabStatus === 2) {
            result = result.filter(blog => blog.status === 'DRAFT');
        } else if (tabStatus === 3) {
            result = result.filter(blog => blog.status === 'ARCHIVED');
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'latest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'popular') {
                return (b.viewCount || 0) - (a.viewCount || 0);
            }
            return 0;
        });

        return result;
    }, [allBlogs, tabStatus, sortBy]);

    // Counts Logic
    const counts = useMemo(() => {
        return {
            all: allBlogs.length,
            published: allBlogs.filter((b: any) => b.status === 'PUBLISHED').length,
            draft: allBlogs.filter((b: any) => b.status === 'DRAFT').length,
            archived: allBlogs.filter((b: any) => b.status === 'ARCHIVED').length,
        };
    }, [allBlogs]);

    return (
        <div className="flex flex-col gap-[24px]">
            <ListHeader
                title={t("admin.blog.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.blog.title.list") }
                ]}
                addButtonLabel={t("admin.blog.title.create")}
                addButtonPath={`/${prefixAdmin}/blog/create`}
            />

            <Box>
                <Box sx={{ mb: "24px", display: 'flex', justifyContent: "space-between", gap: "16px" }}>
                    <Search />
                    <SortButton
                        value={sortBy}
                        onChange={setSortBy}
                    />
                </Box>

                <TabList
                    value={tabStatus}
                    onChange={(_, newVal) => setTabStatus(newVal)}
                    counts={counts}
                />

                <BlogList
                    blogs={filteredBlogs}
                    isLoading={isLoading}
                />
            </Box>
        </div>
    )
}
