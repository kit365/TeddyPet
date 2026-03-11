import { ReactNode } from "react";
import Button from "@mui/material/Button";
import { UserPlus } from 'lucide-react';
import { Breadcrumb } from "./Breadcrumb";
import { Title } from "./Title";
import { useNavigate } from "react-router-dom";

type BreadcrumbItem = {
    label: string;
    to?: string;
};

interface ListHeaderProps {
    title: string;
    breadcrumbItems: BreadcrumbItem[];
    addButtonLabel?: string;
    addButtonPath?: string;
    action?: ReactNode;
    titleSx?: React.CSSProperties;
}

import { Box } from "@mui/material";

export const ListHeader = ({
    title,
    breadcrumbItems,
    addButtonLabel,
    addButtonPath,
    action,
    titleSx
}: ListHeaderProps) => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            px: '40px',
            py: '32px',
            bgcolor: '#F4F6F880',
            borderBottom: '1px dashed #919eab33',
            mx: '-40px',
            mt: '-8px'
        }}>
            <div className="flex items-center justify-end flex-wrap gap-[16px]">
                <div className="mr-auto">
                    <Title title={title} sx={titleSx} />
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="flex gap-[16px] items-center">
                    {action}
                    {addButtonLabel && addButtonPath && (
                        <Button
                            onClick={() => navigate(addButtonPath)}
                            sx={{
                                backgroundColor: 'rgb(5 150 105)', // emerald-600
                                minHeight: '3rem',
                                minWidth: '6.4rem',
                                fontWeight: 600,
                                fontSize: '1.4rem',
                                padding: '6px 16px',
                                borderRadius: '0.75rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                '&:hover': {
                                    backgroundColor: 'rgb(4 120 87)', // emerald-700
                                    boxShadow: '0 8px 18px rgba(16,185,129,0.35)',
                                },
                            }}
                            variant="contained"
                        >
                            <UserPlus className="h-4 w-4" />
                            {addButtonLabel}
                        </Button>
                    )}
                </div>
            </div>
        </Box>
    );
};
