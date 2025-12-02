import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function listStores() {
  const stores = await ai.fileSearchStores.list();
  for await (const store of stores) {
    console.log(store);
  }
}

listStores();