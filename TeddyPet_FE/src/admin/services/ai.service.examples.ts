/**
 * Example: Using AI Service with Real API
 * 
 * This file contains examples of how to use the AI service in your application.
 * You can copy these examples and adapt them to your needs.
 * 
 * NOTE: This is a reference file with example code. 
 * You don't need to import this file anywhere - just use it as a guide.
 */

import { aiService, AIService } from './ai.service';

// ============================================
// Example 1: Improve text
// ============================================
export async function improveMyText() {
    const originalText = "Đây là một văn bản cần cải thiện";
    const improved = await aiService.improveText(originalText);
    console.log('Improved:', improved);
    return improved;
}

// ============================================
// Example 2: Summarize content
// ============================================
export async function summarizeContent() {
    const longText = `
        Tiptap là một framework headless để xây dựng rich text editor.
        Nó được xây dựng dựa trên ProseMirror và cung cấp nhiều extension hữu ích.
        Với Tiptap, bạn có thể dễ dàng tùy chỉnh editor theo nhu cầu của mình.
    `;
    const summary = await aiService.summarize(longText);
    console.log('Summary:', summary);
    return summary;
}

// ============================================
// Example 3: Custom prompt
// ============================================
export async function customAIRequest() {
    const context = "Tôi đang viết về công nghệ AI";
    const prompt = "Hãy đề xuất 5 ý tưởng nội dung hay cho blog về AI";
    const result = await aiService.complete(prompt, context);
    console.log('AI Response:', result);
    return result;
}

// ============================================
// Example 4: Translate text
// ============================================
export async function translateToEnglish() {
    const vietnameseText = "Xin chào, đây là một ví dụ về dịch thuật";
    const translated = await aiService.translate(vietnameseText, 'en');
    console.log('Translated:', translated);
    return translated;
}

// ============================================
// Example 5: Fix grammar
// ============================================
export async function fixGrammarExample() {
    const textWithErrors = "Tôi đang viêt một bài viết về cong nghệ AI";
    const fixed = await aiService.fixGrammar(textWithErrors);
    console.log('Fixed:', fixed);
    return fixed;
}

// ============================================
// Example 6: Configure custom AI service
// ============================================
export const customAI = new AIService({
    apiKey: 'your-custom-api-key',
    model: 'gpt-4', // or 'gpt-3.5-turbo' or 'gemini-pro'
    temperature: 0.9, // Higher = more creative (0.0 - 2.0)
    maxTokens: 1000, // Maximum response length
});

export async function useCustomAI() {
    const result = await customAI.improveText("Sample text");
    console.log(result);
    return result;
}

// ============================================
// Example 7: Using all AI commands
// ============================================
export async function demonstrateAllCommands() {
    const sampleText = "Đây là văn bản mẫu để thử nghiệm các tính năng AI";

    // Improve
    const improved = await aiService.improveText(sampleText);
    console.log('Improved:', improved);

    // Summarize
    const summary = await aiService.summarize(sampleText);
    console.log('Summary:', summary);

    // Expand
    const expanded = await aiService.expand(sampleText);
    console.log('Expanded:', expanded);

    // Fix grammar
    const fixed = await aiService.fixGrammar(sampleText);
    console.log('Fixed:', fixed);

    // Translate
    const translated = await aiService.translate(sampleText, 'en');
    console.log('Translated:', translated);

    // Make shorter
    const shorter = await aiService.makeShorter(sampleText);
    console.log('Shorter:', shorter);

    return {
        improved,
        summary,
        expanded,
        fixed,
        translated,
        shorter,
    };
}

// ============================================
// Example 8: Error handling
// ============================================
export async function improveTextWithErrorHandling(text: string) {
    try {
        const result = await aiService.improveText(text);
        return { success: true, data: result };
    } catch (error) {
        console.error('AI Error:', error);
        return { success: false, error: 'Failed to improve text' };
    }
}

// ============================================
// Example 9: Batch processing
// ============================================
export async function batchImproveTexts(texts: string[]) {
    const results = await Promise.all(
        texts.map(text => aiService.improveText(text))
    );
    return results;
}

// ============================================
// Example 10: Chaining AI operations
// ============================================
export async function improveAndTranslate(text: string) {
    // First improve the text
    const improved = await aiService.improveText(text);

    // Then translate it
    const translated = await aiService.translate(improved, 'en');

    return {
        original: text,
        improved,
        translated,
    };
}
