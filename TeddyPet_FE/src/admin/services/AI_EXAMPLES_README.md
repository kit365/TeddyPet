# AI Service Examples - Hướng Dẫn

## 📁 Files Examples

Có **2 files examples** để bạn tham khảo:

### 1. `ai.service.examples.ts` ✅
**Pure TypeScript examples** - Không có React/JSX

Chứa các ví dụ thuần TypeScript:
- ✅ Improve text
- ✅ Summarize content
- ✅ Custom prompts
- ✅ Translate
- ✅ Fix grammar
- ✅ Error handling
- ✅ Batch processing
- ✅ Chaining operations

**Khi nào dùng:**
- Muốn dùng AI service trong utility functions
- Backend/Node.js code
- Non-React contexts

### 2. `ai.service.react-examples.tsx` ✅
**React Component examples** - Có JSX

Chứa các React components hoàn chỉnh:
- ✅ AITextImprover - Simple text improver
- ✅ AIMultiTool - Multi-command tool
- ✅ AITextField - Auto-suggest field
- ✅ useAIImprove - Custom React hook

**Khi nào dùng:**
- Muốn tạo UI components với AI
- React/TSX contexts
- Interactive user interfaces

---

## 🚀 Cách Sử Dụng

### Option 1: Copy Examples

Mở file tương ứng → Copy code → Paste vào component của bạn

### Option 2: Import Directly

```typescript
// Import từ TypeScript examples
import { improveMyText, summarizeContent } from './services/ai.service.examples';

// Sử dụng
const result = await improveMyText();
```

```tsx
// Import từ React examples
import { AITextImprover } from './services/ai.service.react-examples';

// Sử dụng trong component
function MyPage() {
    return <AITextImprover />;
}
```

---

## ⚠️ Lưu Ý Quan Trọng

### File Examples Không Bắt Buộc
- Files này **chỉ để tham khảo**
- Bạn **không cần import** chúng vào app
- Nếu không dùng, có thể **xóa** hoặc **bỏ qua**

### Để Tránh Lỗi Build
Nếu file examples gây lỗi khi build, bạn có 2 lựa chọn:

**Lựa chọn 1: Xóa file (Nếu không dùng)**
```bash
rm src/admin/services/ai.service.examples.ts
rm src/admin/services/ai.service.react-examples.tsx
```

**Lựa chọn 2: Thêm vào tsconfig exclude**
```json
{
  "exclude": [
    "**/*.examples.ts",
    "**/*.examples.tsx"
  ]
}
```

---

## ✅ File Đã Sửa

Tôi đã sửa lỗi trong `ai.service.examples.ts`:

**Lỗi trước:**
- ❌ JSX trong file `.ts`
- ❌ Import ở giữa file
- ❌ Syntax errors

**Sau khi sửa:**
- ✅ Pure TypeScript
- ✅ Không có JSX
- ✅ Không có syntax errors
- ✅ Đã tách React examples sang file `.tsx` riêng

---

## 📚 Tài Liệu Liên Quan

- `ai.service.ts` - Main AI service
- `AIAssistant.tsx` - AI menu component (đang dùng trong Tiptap)
- `AIAutocomplete.tsx` - AI autocomplete (đang dùng trong Tiptap)
- `AI_INTEGRATION_README.md` - Full documentation

---

**Bây giờ file examples đã clean và không còn lỗi! ✅**
