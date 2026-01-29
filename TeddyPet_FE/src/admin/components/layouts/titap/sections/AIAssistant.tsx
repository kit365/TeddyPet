import { useState, useCallback, memo } from 'react';
import {
    Box,
    IconButton,
    Popover,
    Stack,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Chip,
    Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Editor } from '@tiptap/react';
import { toast } from 'react-toastify';
import { aiService } from '../../../../services/ai.service';
import '@tiptap-pro/extension-ai';

interface AIAssistantProps {
    editor: Editor | null;
}

type AICommand = {
    id: string;
    label: string;
    description: string;
    icon: string;
};

export const AIAssistant = memo(({ editor }: AIAssistantProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const aiCommands: AICommand[] = [
        { id: 'improve', label: 'Cải thiện văn bản', description: 'Làm cho văn bản rõ ràng và chuyên nghiệp hơn', icon: '✨' },
        { id: 'summarize', label: 'Tóm tắt', description: 'Tạo bản tóm tắt ngắn gọn', icon: '📝' },
        { id: 'expand', label: 'Mở rộng', description: 'Thêm chi tiết và mở rộng nội dung', icon: '📈' },
        { id: 'fix-grammar', label: 'Sửa lỗi chính tả', description: 'Kiểm tra và sửa lỗi ngữ pháp', icon: '✅' },
        { id: 'translate', label: 'Dịch sang tiếng Anh', description: 'Dịch văn bản sang tiếng Anh', icon: '🌐' },
        { id: 'make-shorter', label: 'Làm ngắn hơn', description: 'Rút gọn nội dung', icon: '✂️' },
    ];

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
        setPrompt('');
    }, []);

    const executeAICommand = useCallback(async (commandId: string) => {
        if (!editor) return;
        setLoading(true);
        try {
            const chain = editor.chain().focus() as any;
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);

            switch (commandId) {
                case 'improve':
                    if (typeof chain.aiRephrase === 'function') {
                        await chain.aiRephrase().run();
                    } else {
                        await chain.aiText({ action: 'rephrase', text: selectedText }).run();
                    }
                    break;
                case 'summarize':
                    await chain.aiSummarize().run();
                    break;
                case 'expand':
                    if (typeof chain.aiExtend === 'function') {
                        await chain.aiExtend().run();
                    } else {
                        await chain.aiText({ action: 'expand', text: selectedText }).run();
                    }
                    break;
                case 'fix-grammar':
                    if (typeof chain.aiFixSpellingAndGrammar === 'function') {
                        await chain.aiFixSpellingAndGrammar().run();
                    } else {
                        await chain.aiText({ action: 'correct', text: selectedText }).run();
                    }
                    break;
                case 'translate':
                    await chain.aiTranslate({ language: 'en' }).run();
                    break;
                case 'make-shorter':
                    if (typeof chain.aiShorten === 'function') {
                        await chain.aiShorten().run();
                    } else {
                        await chain.aiText({ action: 'shorter', text: selectedText }).run();
                    }
                    break;
                default:
                    break;
            }
            handleClose();
        } catch (error: any) {
            console.error('AI Error:', error);
            if (error?.status === 429 || error.message?.includes('429')) {
                toast.error("Lỗi 429: Hạn mức Tiptap AI đã hết hoặc quá nhiều yêu cầu. Hãy kiểm tra Dashboard.");
            } else {
                toast.error("Lỗi AI: " + (error.message || "Không xác định"));
            }
        } finally {
            setLoading(false);
        }
    }, [editor, handleClose]);

    const handleAICommand = useCallback(async (commandId: string) => {
        if (!editor) return;

        let { from, to } = editor.state.selection;
        let selectedText = editor.state.doc.textBetween(from, to).trim();

        if (selectedText.length === 0) {
            const allText = editor.getText().trim();
            if (allText.length === 0) {
                toast.warning("Vui lòng nhập nội dung trước khi dùng AI");
                return;
            }
            editor.commands.selectAll();
        }

        await executeAICommand(commandId);
    }, [editor, executeAICommand]);

    const handleCustomPrompt = useCallback(async () => {
        if (!prompt.trim() || !editor) return;

        setLoading(true);
        try {
            const chain = editor.chain().focus() as any;

            if (typeof chain.aiTextPrompt === 'function') {
                await chain.aiTextPrompt({ text: prompt }).run();
            } else if (typeof chain.aiText === 'function') {
                await chain.aiText({ text: prompt, insert: true }).run();
            } else {
                // Fallback nếu gọi Tiptap không được
                const context = editor.state.doc.textBetween(0, editor.state.doc.content.size);
                const result = await aiService.complete(prompt, context);
                if (result) {
                    editor.chain().focus().insertContent(result).run();
                }
            }
            handleClose();
        } catch (error: any) {
            console.error('AI Error:', error);
            if (error?.status === 429 || error.message?.includes('429')) {
                toast.error("Lỗi 429: Hết hạn mức yêu cầu. Thử lại sau.");
            } else {
                toast.error("Lỗi AI: " + (error.message || "Không xác định"));
            }
        } finally {
            setLoading(false);
        }
    }, [prompt, editor, handleClose]);

    const open = Boolean(anchorEl);

    return (
        <>
            <Tooltip title="AI Assistant">
                <IconButton
                    size="small"
                    onClick={handleClick}
                    sx={{
                        color: open ? '#5e35b1' : 'inherit',
                        '&:hover': {
                            bgcolor: 'rgba(94, 53, 177, 0.08)',
                        },
                    }}
                >
                    <AutoAwesomeIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        width: 380,
                        mt: 1,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        borderRadius: 2,
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoAwesomeIcon sx={{ color: '#5e35b1' }} />
                            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                AI Assistant
                            </Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            Chọn một lệnh hoặc nhập yêu cầu của bạn
                        </Typography>

                        <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {aiCommands.map((command) => (
                                <Chip
                                    key={command.id}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                            <span>{command.icon}</span>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {command.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {command.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    onClick={() => handleAICommand(command.id)}
                                    disabled={loading}
                                    sx={{
                                        height: 'auto',
                                        justifyContent: 'flex-start',
                                        '& .MuiChip-label': {
                                            width: '100%',
                                            px: 1.5,
                                            py: 1,
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(94, 53, 177, 0.08)',
                                        },
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Stack>

                        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Hoặc nhập yêu cầu tùy chỉnh..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCustomPrompt();
                                    }
                                }}
                                disabled={loading}
                                multiline
                                rows={2}
                                sx={{ mb: 1 }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleCustomPrompt}
                                disabled={loading || !prompt.trim()}
                                startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                                sx={{
                                    bgcolor: '#5e35b1',
                                    '&:hover': {
                                        bgcolor: '#4527a0',
                                    },
                                }}
                            >
                                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
});

AIAssistant.displayName = 'AIAssistant';
