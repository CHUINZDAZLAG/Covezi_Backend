import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runFileSearch() {
  try {
    // 1. Tạo File Search Store (RAG Store)
    const store = await ai.fileSearchStores.create({
      config: { displayName: "lapzone-text" }
    });
    console.log("Store created:", store.name);

    // 2. Upload file (Trong Node.js, bạn truyền đường dẫn file cục bộ)
    let op = await ai.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: store.name,
      file: "./data/........" // Đường dẫn tới file trên server của bạn
    });

    // 3. Đợi file được xử lý (Polling)
    console.log("Đang xử lý file...");
    while (!op.done) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2s
      op = await ai.operations.get({ operation: op });
    }
    console.log("File đã sẵn sàng!");

    // 4. Query (Hỏi đáp với tài liệu)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Model hỗ trợ tốt và chi phí thấp (miễn phí ở mức giới hạn)
      contents: 'Tóm tắt nội dung chính của tài liệu này',
      config: {
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [store.name],
          }
        }]
      }
    });

    console.log("Câu trả lời:", response.text);
    
    // In ra các đoạn trích dẫn (citations) nếu có
    // const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    // if (chunks) {
    //     console.log("Nguồn tham khảo:", JSON.stringify(chunks, null, 2));
    // }

  } catch (error) {
    console.error("Lỗi:", error);
  }
}

runFileSearch();