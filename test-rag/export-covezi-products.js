import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Lấy URI từ .env gốc của backend
const MONGODB_URI = process.env.MONGODB_URI

async function exportProductsToText() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db('covezi-db')
    const products = await db.collection('products').find({ _destroy: false }).toArray()
    
    console.log(`📦 Found ${products.length} products`)
    
    // Convert to text format for RAG
    let textContent = `=== DANH SÁCH SẢN PHẨM COVEZI - NỀN TẢNG XANH VÀ BỀN VỮNG ===

Covezi là nền tảng thương mại điện tử chuyên về sản phẩm thân thiện với môi trường, 
hỗ trợ lối sống xanh và bền vững. Dưới đây là danh sách các sản phẩm hiện có:

`
    
    products.forEach((product, index) => {
      // Calculate final price after discount
      const finalPrice = product.discount 
        ? product.price * (1 - product.discount / 100) 
        : product.price
      
      textContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: ${product._id}
Tên sản phẩm: ${product.name}
Danh mục: ${getCategoryName(product.category)}
Giá gốc: ${formatPrice(product.price)}
${product.discount > 0 ? `Giảm giá: ${product.discount}%\nGiá sau giảm: ${formatPrice(finalPrice)}` : ''}
Tình trạng: ${product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Hết hàng'}
Mô tả ngắn: ${product.shortDescription || 'Không có'}
Mô tả chi tiết: ${stripHtml(product.description)}
${product.featured ? '⭐ Sản phẩm nổi bật' : ''}
Đánh giá: ${product.rating}/5 (${product.reviewCount} đánh giá)
Đã bán: ${product.sold} sản phẩm

`
    })
    
    textContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== THÔNG TIN CHUNG VỀ COVEZI ===

🌱 COVEZI là nền tảng thương mại điện tử tập trung vào:
- Sản phẩm thân thiện với môi trường
- Lối sống xanh và bền vững
- Hỗ trợ cộng đồng sống eco-friendly
- Workshop và hoạt động xanh

🎮 HỆ THỐNG GAMIFICATION:
- Thu thập điểm xanh khi mua sắm và tham gia thử thách
- Trồng cây ảo trong vườn cá nhân
- Đổi điểm lấy voucher giảm giá
- Hoàn thành thử thách xanh để nhận thưởng

📍 LIÊN HỆ:
- Website: covezi.vn
- Email: support@covezi.vn
- Hotline: 1900-xxxx

💚 Mua sắm xanh - Sống bền vững cùng Covezi!
`
    
    // Save to file
    const outputPath = path.join(__dirname, 'data', 'covezi-products.txt')
    fs.writeFileSync(outputPath, textContent, 'utf-8')
    
    console.log(`✅ Exported to: ${outputPath}`)
    console.log(`📝 Total characters: ${textContent.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('📤 Disconnected from MongoDB')
  }
}

function getCategoryName(category) {
  const categories = {
    'eco-lifestyle': 'Lối sống xanh',
    'sustainable-fashion': 'Thời trang bền vững',
    'organic-food': 'Thực phẩm hữu cơ',
    'home-garden': 'Nhà cửa & Vườn',
    'personal-care': 'Chăm sóc cá nhân',
    'recycled-products': 'Sản phẩm tái chế',
    'workshop': 'Workshop',
    'other': 'Khác'
  }
  return categories[category] || category
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(price)
}

function stripHtml(html) {
  if (!html) return 'Không có mô tả'
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

exportProductsToText()
