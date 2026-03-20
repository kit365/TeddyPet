import { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { ListHeader } from "../../components/ui/ListHeader";
import { FeedbackList } from "./sections/FeedbackList";
import { BlogCommentList } from "./sections/BlogCommentList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const FeedbackListPage = () => {
    const { t } = useTranslation();
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <div className="flex flex-col">
            <ListHeader
                title="Quản lý đánh giá"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đánh giá", to: `/${prefixAdmin}/feedback/list` },
                    { label: t("admin.common.list") }
                ]}
            />
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, bgcolor: 'white', borderRadius: '12px 12px 0 0' }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange}
                    sx={{
                        px: 2,
                        '& .MuiTab-root': {
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 1.5,
                        },
                        '& .Mui-selected': { color: '#00AB55 !important' },
                        '& .MuiTabs-indicator': { backgroundColor: '#00AB55' }
                    }}
                >
                    <Tab label="Đánh giá sản phẩm" />
                    <Tab label="Bình luận Blog" />
                </Tabs>
            </Box>

            <div className="mt-6 px-3">
                {currentTab === 0 && <FeedbackList />}
                {currentTab === 1 && <BlogCommentList />}
            </div>
        </div>
    )
}
