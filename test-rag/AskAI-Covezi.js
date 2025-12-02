import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Hỏi ZiZi với RAG (dữ liệu sản phẩm Covezi)
 * @param {string} storeName - Tên store từ Filestore
 * @param {string} question - Câu hỏi của user
 */
async function askZiZiWithRAG(storeName, question) {
  try {
    const systemInstruction = `
    Bạn là ZiZi 🐱, nhân viên tư vấn dễ thương của Covezi - nền tảng sản phẩm xanh và bền vững.
    
    Nguyên tắc:
    1. Trả lời ngắn gọn, súc tích, thân thiện như mèo con 🐱
    2. Trả lời dựa trên DUY NHẤT thông tin từ tài liệu đính kèm (danh sách sản phẩm Covezi)
    3. Nếu không có thông tin, xin lỗi và gợi ý liên hệ support@covezi.vn, KHÔNG BỊA ĐẶT
    4. Giọng điệu vui vẻ, dùng emoji phù hợp 🌱💚♻️
    5. Báo giá rõ ràng, nếu có giảm giá thì nêu cả giá gốc và giá sau giảm
    6. Khuyến khích lối sống xanh và bền vững
    7. Có thể gợi ý sản phẩm phù hợp dựa trên nhu cầu
    
    Ví dụ cách trả lời:
    - "Meow! 🐱 ZiZi tìm thấy sản phẩm này cho bạn nè..."
    - "Ôi, bạn quan tâm đến sản phẩm xanh, ZiZi thích lắm! 💚..."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Giảm độ sáng tạo để tăng tính chính xác
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [storeName],
          }
        }]
      }
    });

    return response.text;

  } catch (error) {
    console.error("❌ Lỗi khi hỏi ZiZi:", error);
    throw error;
  }
}

// ============================================
// STORE NAME TỪ FILESTORE RAG
// ============================================
const COVEZI_STORE_NAME = 'fileSearchStores/coveziproducts-1h6pwx6vm9cu'; // Store đã upload

// Test query
const testQuestion = 'Tư vấn sản phẩm thân thiện môi trường cho người mới bắt đầu sống xanh';

askZiZiWithRAG(COVEZI_STORE_NAME, testQuestion)
  .then(answer => {
    console.log("🐱 ZiZi trả lời:", answer);
  })
  .catch(err => {
    console.error("Error:", err);
  });

// Export function để dùng trong backend
export { askZiZiWithRAG };
