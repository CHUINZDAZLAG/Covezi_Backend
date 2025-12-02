import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function uploadNewData() {
  try {
    console.log('🚀 Upload dữ liệu mới vào File Search Store\n');

    // Tạo store mới
    console.log('📦 Tạo File Search Store mới...');
    const fileSearchStore = await ai.fileSearchStores.create({
      config: { displayName: 'html-test' }
    });
    console.log(`✅ Store: ${fileSearchStore.name}\n`);

    // Upload file mới
    console.log('📤 Upload lapzone-clean.json...');
    const filePath = path.join(__dirname, 'data', 'htiml.txt');
    
    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: filePath,
      fileSearchStoreName: fileSearchStore.name,
      config: {
        displayName: 'lapzone-final.json',
      }
    });

    // Chờ xử lý
    console.log('⏳ Đang xử lý...');
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.get({ operation });
    }
    
    console.log('✅ Upload thành công!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COPY STORE NAME này vào chay.js:');
    console.log(`"${fileSearchStore.name}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

uploadNewData();
