import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// === XÓA STORE CŨ KHÔNG CẦN THIẾT ===
// Thay thế "oldStoreName" bằng tên store bạn muốn xóa
async function deleteOldStore() {
  try {
    const oldStoreName = "fileSearchStores/tailieubackend-k0q1fe394mkx";
    
    console.log('🗑️  Đang xóa store cũ:', oldStoreName);
    
    await ai.fileSearchStores.delete({
      name: oldStoreName,
      config: { force: true }
    });
    
    console.log('✅ Đã xóa thành công!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

deleteOldStore();
