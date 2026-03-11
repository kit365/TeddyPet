import { ReactNode } from "react";
import Button from "@mui/material/Button";
import { Breadcrumb } from "./Breadcrumb";
import { Title } from "./Title";
import { useNavigate } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

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
            py: '20px', // Reduced from 32px to reclaim space
            bgcolor: '#FFFFFF',
            borderBottom: '1px dashed #919eab33',
            mx: '-40px',
            mt: '-8px'
        }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} flexWrap="wrap">
                <Box>
                    <Title title={title} sx={titleSx} />
                    <Breadcrumb items={breadcrumbItems} />
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    {action}
                    {addButtonLabel && addButtonPath && (
                        <Button
                            onClick={() => navigate(addButtonPath)}
                            startIcon={<AddIcon />}
                            sx={{
                                backgroundColor: '#1C252E',
                                minHeight: '40px',
                                fontWeight: 700,
                                fontSize: '1.4rem',
                                px: 2.5,
                                borderRadius: '10px',
                                textTransform: 'none',
                                boxShadow: '0 8px 16px 0 rgba(28, 37, 46, 0.24)',
                                color: '#ffffff',
                                '&:hover': {
                                    backgroundColor: '#454F5B',
                                    boxShadow: 'none',
                                },
                            }}
                            variant="contained"
                        >
                            {addButtonLabel}
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};
