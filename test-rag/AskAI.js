import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAskStore(storeName, question) {
  try {
    const systemInstruction = `
    Bạn là nhân viên tư vấn bán hàng chuyên nghiệp của LapZone.
    Nguyên tắc:
    1. Trả lời thật ngắn gọn, súc tích.
    2. Trả lời dựa trên DUY NHẤT thông tin từ tài liệu đính kèm.
    3. Nếu không có thông tin, hãy xin lỗi và gợi ý khách liên hệ hotline, không được bịa đặt.
    4. Giọng điệu thân thiện, dùng 'Dạ/Vâng', xưng 'Em'.
    5. Báo giá rõ ràng kèm đơn vị tiền tệ (VNĐ).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction, // Thêm prompt hệ thống
        temperature: 0.1, // Giảm độ sáng tạo để tăng tính chính xác
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [storeName],
            // maxOutputTokens: có thể cấu hình nếu cần giới hạn độ dài
          }
        }]
      }
    });

    console.log("LapZone tư vấn:", response.text);
    
    // In trích dẫn để debug xem nó lấy tin từ đâu
    // const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    // if (chunks) {
    //     console.log("------------------------------------------------");
    //     console.log(`Dựa trên ${chunks.length} đoạn thông tin từ tài liệu.`);
    // }

  } catch (error) {
    console.error("Lỗi khi hỏi AI:", error);
  }
}

const fileName = 'fileSearchStores/lapzonetext-at533nwfrdtv'; // Thay bằng tên store của bạn
const userPrompt = 'tư vấn sản phẩm laptop cho sinh viên đi học'; // Thay bằng câu hỏi của bạn

testAskStore(fileName, userPrompt);