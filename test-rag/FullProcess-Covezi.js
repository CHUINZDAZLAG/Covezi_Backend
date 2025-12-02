import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runFileSearch() {
  try {
    // 1. Tạo File Search Store (RAG Store) cho Covezi
    const store = await ai.fileSearchStores.create({
      config: { displayName: "covezi-products" }
    });
    console.log("✅ Store created:", store.name);

    // 2. Upload file dữ liệu sản phẩm Covezi
    let op = await ai.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: store.name,
      file: "./data/covezi-products.txt" // File text chứa data sản phẩm Covezi
    });

    // 3. Đợi file được xử lý (Polling)
    console.log("⏳ Đang xử lý file...");
    while (!op.done) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2s
      op = await ai.operations.get({ operation: op });
    }
    console.log("✅ File đã sẵn sàng!");

    // 4. Test query với dữ liệu Covezi
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Tóm tắt nội dung chính của tài liệu này',
      config: {
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [store.name],
          }
        }]
      }
    });

    console.log("📝 Câu trả lời:", response.text);
    console.log("\n🎉 HOÀN TẤT! Store name cần lưu lại:");
    console.log(`   ${store.name}`);
    console.log("\n📌 Hãy copy store name này vào file AskAI-Covezi.js");

  } catch (error) {
    console.error("❌ Lỗi:", error);
  }
}

runFileSearch();
