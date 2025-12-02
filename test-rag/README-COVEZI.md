# 🐱 HƯỚNG DẪN SETUP RAG CHO ZIZI COVEZI

## 📋 Tổng quan
Code RAG này giúp ZiZi chatbot trả lời dựa trên dữ liệu sản phẩm thật của Covezi, thay vì bịa đặt.

## 🔧 Các bước thực hiện

### Bước 1: Cài đặt package mới
```bash
cd c:\Covezi\Trello-Backend\test-rag
npm install @google/genai
```

### Bước 2: Kiểm tra API Key
File `.env` trong thư mục `test-rag` đã có API key:
```
GEMINI_API_KEY='AIzaSyDFFiOya-Y9WsxAbcxWOaP95fYG6-hhCLE'
```

### Bước 3: Export dữ liệu sản phẩm từ MongoDB
```bash
cd c:\Covezi\Trello-Backend\test-rag
node export-covezi-products.js
```
➡️ File `data/covezi-products.txt` sẽ được tạo với dữ liệu sản phẩm

### Bước 4: Upload dữ liệu lên Gemini Filestore (RAG)
```bash
node FullProcess-Covezi.js
```
➡️ Ghi nhớ **Store Name** được in ra (ví dụ: `fileSearchStores/covezi-products-xxxxx`)

### Bước 5: Cập nhật Store Name
Mở file `AskAI-Covezi.js` và thay thế:
```javascript
const COVEZI_STORE_NAME = 'fileSearchStores/YOUR_STORE_NAME_HERE';
```
thành store name thật từ bước 4.

### Bước 6: Test RAG
```bash
node AskAI-Covezi.js
```

### Bước 7: Tích hợp vào Backend
Copy function `askZiZiWithRAG` từ `AskAI-Covezi.js` vào `geminiService.js` của backend chính.

---

## 📁 Cấu trúc file

```
test-rag/
├── .env                        # API Key
├── data/
│   ├── lapzone-text.txt        # Data mẫu (laptop)
│   └── covezi-products.txt     # Data Covezi (sẽ được tạo)
├── export-covezi-products.js   # Script export từ MongoDB
├── FullProcess-Covezi.js       # Upload lên Filestore
├── AskAI-Covezi.js             # Query với RAG
├── KiemTraFileStore.js         # Kiểm tra các store đã tạo
└── XoaFileStore.js             # Xóa store
```

## ⚠️ Lưu ý quan trọng

1. **KHÔNG SỬA CODE RAG** - Code này mới (tháng 11/2024), AI chưa được train nên dễ sửa sai
2. **Chỉ sửa:**
   - Tên file data (`covezi-products.txt`)
   - API Key trong `.env`
   - Store Name sau khi upload
3. **Rate Limit:** Free tier Gemini có giới hạn ~15 requests/phút, chờ 1-2 phút nếu bị 429

## 🔄 Cập nhật dữ liệu

Khi có sản phẩm mới:
1. Chạy lại `node export-covezi-products.js`
2. Xóa store cũ: sửa store name trong `XoaFileStore.js` rồi chạy `node XoaFileStore.js`
3. Chạy lại `node FullProcess-Covezi.js`
4. Cập nhật store name mới

---
💚 Made for Covezi - Sống xanh, sống bền vững!
