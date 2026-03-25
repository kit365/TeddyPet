import { useEffect, useState, useCallback, memo } from 'react';
import { Editor } from '@tiptap/react';
import { Box, Typography, Chip } from '@mui/material';

interface AIAutocompleteProps {
    editor: Editor | null;
    enabled?: boolean;
}

export const AIAutocomplete = memo(({ editor, enabled = true }: AIAutocompleteProps) => {
    const [suggestion, setSuggestion] = useState<string>('');
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

    const getSuggestion = useCallback(async (currentText: string): Promise<string> => {
        // Mock API - Thay thế bằng API thực tế
        await new Promise(resolve => setTimeout(resolve, 800));

        // Giả lập suggestion dựa vào context
        const suggestions = [
            'và điều này sẽ giúp cải thiện trải nghiệm người dùng.',
            'nhằm tối ưu hóa hiệu suất của hệ thống.',
            'để đảm bảo tính bảo mật và an toàn thông tin.',
            'giúp tăng cường khả năng tương tác với khách hàng.',
        ];

        // Chọn suggestion dựa vào độ dài của text hiện tại
        const index = currentText.length % suggestions.length;
        return suggestions[index];
    }, []);

    const handleTextUpdate = useCallback(async () => {
        if (!editor || !enabled) return;

        const { from, to } = editor.state.selection;
        const currentText = editor.state.doc.textBetween(from - 50, from);

        // Chỉ hiển thị suggestion khi đang gõ (không chọn text)
        if (from === to && currentText.length > 10) {
            const aiSuggestion = await getSuggestion(currentText);
            setSuggestion(aiSuggestion);
            setShowSuggestion(true);
        } else {
            setShowSuggestion(false);
        }
    }, [editor, enabled, getSuggestion]);

    useEffect(() => {
        if (!editor || !enabled) return;

        const handleUpdate = () => {
            // Clear existing timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Set new timeout để tránh gọi API quá nhiều
            const timeout = setTimeout(() => {
                handleTextUpdate();
            }, 1000); // Đợi 1 giây sau khi ngừng gõ

            setTypingTimeout(timeout);
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [editor, enabled, typingTimeout, handleTextUpdate]);

    const acceptSuggestion = useCallback(() => {
        if (editor && suggestion) {
            editor.commands.insertContent(' ' + suggestion);
            setShowSuggestion(false);
            setSuggestion('');
        }
    }, [editor, suggestion]);

    const rejectSuggestion = useCallback(() => {
        setShowSuggestion(false);
        setSuggestion('');
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        if (!showSuggestion) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' && showSuggestion) {
                e.preventDefault();
                acceptSuggestion();
            } else if (e.key === 'Escape' && showSuggestion) {
                e.preventDefault();
                rejectSuggestion();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSuggestion, acceptSuggestion, rejectSuggestion]);

    if (!showSuggestion || !suggestion) return null;

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                maxWidth: 400,
                bgcolor: 'rgba(94, 53, 177, 0.05)',
                border: '1px solid rgba(94, 53, 177, 0.2)',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(8px)',
                zIndex: 10,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#5e35b1',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}
                >
                    ✨ AI Suggestion
                </Typography>
            </Box>

            <Typography
                variant="body2"
                sx={{
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    mb: 1.5,
                }}
            >
                {suggestion}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                    label="Tab để chấp nhận"
                    size="small"
                    onClick={acceptSuggestion}
                    sx={{
                        bgcolor: '#5e35b1',
                        color: 'white',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: '#4527a0',
                        },
                    }}
                />
                <Chip
                    label="Esc để bỏ qua"
                    size="small"
                    onClick={rejectSuggestion}
                    variant="outlined"
                    sx={{
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                    }}
                />
            </Box>
        </Box>
    );
});

AIAutocomplete.displayName = 'AIAutocomplete';
