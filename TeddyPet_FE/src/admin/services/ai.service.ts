// AI Service - Tích hợp với các AI API (OpenAI, Gemini, v.v.)

export interface AIConfig {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export class AIService {
    private config: AIConfig;

    constructor(config: AIConfig = {}) {
        this.config = {
            apiKey: config.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
            model: config.model || 'gemini-1.5-flash',
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2048,
        };
    }

    /**
     * Gọi Google Gemini API
     */
    async complete(prompt: string, context?: string): Promise<string> {
        try {
            if (!this.config.apiKey) {
                console.warn('AI API key not configured. Using mock response.');
                return this.mockResponse(prompt, context);
            }

            const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

            const fullPrompt = context
                ? `Ngữ cảnh: ${context}\n\nYêu cầu: ${prompt}\n\nTrả về kết quả ở định dạng văn bản thuần túy hoặc HTML phù hợp để chèn trực tiếp vào trình soạn thảo.`
                : `${prompt}\n\nTrả về kết quả ở định dạng văn bản thuần túy hoặc HTML phù hợp để chèn trực tiếp vào trình soạn thảo.`;

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: fullPrompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: this.config.temperature,
                        maxOutputTokens: this.config.maxTokens,
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Xóa các ký tự markdown nếu AI trả về (như ```html ...)
            return content.replace(/```html|```/g, '').trim();
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    /**
     * Cải thiện văn bản
     */
    async improveText(text: string): Promise<string> {
        return this.complete(
            `Hãy viết lại đoạn văn bản sau để nó hay hơn, chuyên nghiệp và súc tích hơn, nhưng vẫn giữ nguyên ý nghĩa ban đầu:\n\n${text}`
        );
    }

    /**
     * Tóm tắt văn bản
     */
    async summarize(text: string): Promise<string> {
        return this.complete(
            `Hãy tóm tắt đoạn văn bản sau một cách ngắn gọn, súc tích nhất:\n\n${text}`
        );
    }

    /**
     * Mở rộng văn bản
     */
    async expand(text: string): Promise<string> {
        return this.complete(
            `Hãy mở rộng đoạn văn bản sau bằng cách thêm các chi tiết, ví dụ minh họa và thông tin hữu ích liên quan:\n\n${text}`
        );
    }

    /**
     * Sửa lỗi chính tả và ngữ pháp
     */
    async fixGrammar(text: string): Promise<string> {
        return this.complete(
            `Hãy kiểm tra và sửa toàn bộ lỗi chính tả, lỗi đánh máy và lỗi ngữ pháp trong đoạn văn bản sau. Chỉ trả về văn bản đã sửa:\n\n${text}`
        );
    }

    /**
     * Dịch văn bản
     */
    async translate(text: string, targetLanguage: string = 'tiếng Anh'): Promise<string> {
        return this.complete(
            `Hãy dịch đoạn văn bản sau sang ${targetLanguage}. Chỉ trả về nội dung đã dịch:\n\n${text}`
        );
    }

    /**
     * Làm ngắn văn bản
     */
    async makeShorter(text: string): Promise<string> {
        return this.complete(
            `Hãy rút gọn văn bản sau mà vẫn giữ được thông tin quan trọng nhất:\n\n${text}`
        );
    }

    /**
     * Gợi ý hoàn thiện câu
     */
    async suggest(context: string): Promise<string> {
        return this.complete(
            `Dựa vào nội dung sau, hãy đưa ra một gợi ý ngắn gọn để viết tiếp câu tiếp theo:\n\n${context}`,
            context
        );
    }

    /**
     * Mock response khi không có API key
     */
    private async mockResponse(prompt: string, context?: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 800));

        const text = context || '';
        if (prompt.includes('cải thiện')) return `✨ [Đã tối ưu]: ${text} (Vui lòng thêm VITE_GEMINI_API_KEY để dùng AI thật)`;
        if (prompt.includes('tóm tắt')) return `📝 [Tóm tắt]: ${text.substring(0, 50)}...`;
        if (prompt.includes('mở rộng')) return `📈 [Mở rộng]: ${text} - Thêm các thông tin chi tiết về dịch vụ thú cưng...`;
        if (prompt.includes('sửa')) return `✅ [Đã sửa]: ${text}`;
        if (prompt.includes('dịch')) return `🌐 [Dịch]: ${text} (Translated)`;

        return `🤖 [AI]: ${text}`;
    }
}

export const aiService = new AIService();
