import { useState } from 'react';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { RoomList } from './sections/RoomList';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';

export const RoomListPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    return (
        <>
            <ListHeader
                title="Danh sách phòng"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                    { label: 'Danh sách phòng' },
                ]}
                addButtonLabel="Thêm phòng"
                addButtonPath={`/${prefixAdmin}/room/create`}
                action={
                    <Box sx={{ minWidth: 280 }}>
                        <TextField
                            size="small"
                            placeholder="Tìm theo tên phòng hoặc loại phòng"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 1,
                                '& .MuiOutlinedInput-root': { fontSize: '0.875rem' },
                            }}
                        />
                    </Box>
                }
            />
            <RoomList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </>
    );
};
