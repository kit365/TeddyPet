/**
 * React Component Examples for AI Service
 * 
 * This file contains React component examples showing how to use AI service in components.
 * Copy these examples and adapt them to your needs.
 */

import { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { aiService } from './ai.service';

// ============================================
// Example 1: Simple Text Improver Component
// ============================================
export function AITextImprover() {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImprove = async () => {
        setLoading(true);
        try {
            const improved = await aiService.improveText(text);
            setResult(improved);
        } catch (error) {
            console.error('AI Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                AI Text Improver
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập văn bản cần cải thiện..."
                sx={{ mb: 2 }}
            />
            <Button
                variant="contained"
                onClick={handleImprove}
                disabled={loading || !text}
                startIcon={loading ? <CircularProgress size={20} /> : null}
            >
                {loading ? 'Đang xử lý...' : 'Cải thiện văn bản'}
            </Button>
            {result && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Kết quả:
                    </Typography>
                    <Typography>{result}</Typography>
                </Box>
            )}
        </Box>
    );
}

// ============================================
// Example 2: Multi-command AI Tool
// ============================================
export function AIMultiTool() {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCommand = async (command: 'improve' | 'summarize' | 'expand' | 'translate') => {
        setLoading(true);
        try {
            let response = '';
            switch (command) {
                case 'improve':
                    response = await aiService.improveText(text);
                    break;
                case 'summarize':
                    response = await aiService.summarize(text);
                    break;
                case 'expand':
                    response = await aiService.expand(text);
                    break;
                case 'translate':
                    response = await aiService.translate(text, 'en');
                    break;
            }
            setResult(response);
        } catch (error) {
            console.error('AI Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                AI Multi-Tool
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập văn bản..."
                sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => handleCommand('improve')}
                    disabled={loading || !text}
                >
                    Cải thiện
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleCommand('summarize')}
                    disabled={loading || !text}
                >
                    Tóm tắt
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleCommand('expand')}
                    disabled={loading || !text}
                >
                    Mở rộng
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleCommand('translate')}
                    disabled={loading || !text}
                >
                    Dịch
                </Button>
            </Box>
            {loading && <CircularProgress />}
            {result && !loading && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Kết quả:
                    </Typography>
                    <Typography>{result}</Typography>
                </Box>
            )}
        </Box>
    );
}

// ============================================
// Example 3: AI Text Field with Auto-suggest
// ============================================
export function AITextField() {
    const [value, setValue] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = async (newValue: string) => {
        setValue(newValue);

        // Get suggestion if text is long enough
        if (newValue.length > 20) {
            setLoading(true);
            try {
                const context = newValue.slice(-50); // Last 50 chars
                const aiSuggestion = await aiService.suggest(context);
                setSuggestion(aiSuggestion);
            } catch (error) {
                console.error('AI Error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const acceptSuggestion = () => {
        setValue(value + ' ' + suggestion);
        setSuggestion('');
    };

    return (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                multiline
                rows={6}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Bắt đầu gõ..."
            />
            {loading && <CircularProgress size={20} />}
            {suggestion && !loading && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="caption" color="info.main">
                        💡 Gợi ý: {suggestion}
                    </Typography>
                    <Button
                        size="small"
                        onClick={acceptSuggestion}
                        sx={{ ml: 2 }}
                    >
                        Chấp nhận
                    </Button>
                </Box>
            )}
        </Box>
    );
}

// ============================================
// Example 4: Custom Hook for AI Operations
// ============================================
export function useAIImprove() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const improve = async (text: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await aiService.improveText(text);
            return result;
        } catch (err) {
            setError('Failed to improve text');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { improve, loading, error };
}

// Usage of the custom hook:
export function ComponentUsingHook() {
    const { improve, loading, error } = useAIImprove();
    const [text, setText] = useState('');
    const [result, setResult] = useState('');

    const handleImprove = async () => {
        try {
            const improved = await improve(text);
            setResult(improved);
        } catch (err) {
            // Error is already handled in the hook
            console.error(err);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text..."
            />
            <Button onClick={handleImprove} disabled={loading}>
                {loading ? 'Processing...' : 'Improve'}
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            {result && <Typography>{result}</Typography>}
        </Box>
    );
}
