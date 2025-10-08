/* eslint-disable no-console */
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '~/config/environment'

// Sample products data
const sampleProducts = [
  {
    name: 'Eco Reusable Shopping Bag',
    description: 'Durable reusable shopping bag made from organic cotton. Perfect for everyday shopping and reduces plastic waste.',
    shortDescription: 'Organic cotton shopping bag',
    category: 'Accessories',
    price: 159000,
    originalPrice: 199000,
    discount: 20,
    cover: 'https://via.placeholder.com/400x300?text=Shopping+Bag',
    stock: 50,
    ecoScore: 9,
    carbonFootprint: 0.5,
    recyclable: true,
    organic: true,
    rating: 4.5,
    reviewCount: 128,
    tags: ['eco', 'reusable', 'cotton', 'shopping'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=eco+shopping+bag',
      tiktok: 'https://www.tiktok.com/search?q=eco+shopping+bag',
      facebook: 'https://facebook.com/search/products?q=eco+shopping+bag'
    },
    createdBy: '671234567890abcdef000001'
  },
  {
    name: 'Bamboo Toothbrush Set',
    description: 'Eco-friendly bamboo toothbrush set with soft bristles. Biodegradable and sustainable alternative to plastic toothbrushes.',
    shortDescription: 'Bamboo toothbrush eco-pack',
    category: 'Personal Care',
    price: 89000,
    originalPrice: 120000,
    discount: 25,
    cover: 'https://via.placeholder.com/400x300?text=Bamboo+Toothbrush',
    stock: 100,
    ecoScore: 8.5,
    carbonFootprint: 0.2,
    recyclable: true,
    organic: false,
    rating: 4.8,
    reviewCount: 256,
    tags: ['bamboo', 'toothbrush', 'eco', 'biodegradable'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=bamboo+toothbrush',
      tiktok: 'https://www.tiktok.com/search?q=bamboo+toothbrush',
      facebook: 'https://facebook.com/search/products?q=bamboo+toothbrush'
    },
    createdBy: '671234567890abcdef000001'
  },
  {
    name: 'Organic Green Tea',
    description: 'Premium organic green tea from sustainable farms. Rich in antioxidants and great for health. Comes in 50g package.',
    shortDescription: 'Premium organic green tea',
    category: 'Food & Beverages',
    price: 129000,
    originalPrice: 150000,
    discount: 14,
    cover: 'https://via.placeholder.com/400x300?text=Green+Tea',
    stock: 75,
    ecoScore: 9,
    carbonFootprint: 0.1,
    recyclable: true,
    organic: true,
    rating: 4.7,
    reviewCount: 187,
    tags: ['tea', 'organic', 'green', 'antioxidant'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=organic+green+tea',
      tiktok: 'https://www.tiktok.com/search?q=organic+green+tea',
      facebook: 'https://facebook.com/search/products?q=organic+green+tea'
    },
    createdBy: '671234567890abcdef000001'
  },
  {
    name: 'Recycled Plastic Water Bottle',
    description: 'Durable water bottle made from 100% recycled plastic. BPA-free, lightweight, and perfect for outdoor activities.',
    shortDescription: 'Recycled plastic water bottle',
    category: 'Accessories',
    price: 199000,
    originalPrice: 250000,
    discount: 20,
    cover: 'https://via.placeholder.com/400x300?text=Water+Bottle',
    stock: 60,
    ecoScore: 8.8,
    carbonFootprint: 0.3,
    recyclable: true,
    organic: false,
    rating: 4.6,
    reviewCount: 342,
    tags: ['bottle', 'water', 'recycled', 'eco'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=recycled+water+bottle',
      tiktok: 'https://www.tiktok.com/search?q=recycled+water+bottle',
      facebook: 'https://facebook.com/search/products?q=recycled+water+bottle'
    },
    createdBy: '671234567890abcdef000001'
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: '100% organic cotton t-shirt. Soft, comfortable, and sustainably produced. Perfect for everyday wear.',
    shortDescription: 'Organic cotton t-shirt',
    category: 'Clothing',
    price: 249000,
    originalPrice: 350000,
    discount: 28,
    cover: 'https://via.placeholder.com/400x300?text=Organic+Tshirt',
    stock: 120,
    ecoScore: 9,
    carbonFootprint: 0.8,
    recyclable: true,
    organic: true,
    rating: 4.9,
    reviewCount: 512,
    tags: ['cotton', 'organic', 'tshirt', 'clothing'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=organic+cotton+tshirt',
      tiktok: 'https://www.tiktok.com/search?q=organic+cotton+tshirt',
      facebook: 'https://facebook.com/search/products?q=organic+cotton+tshirt'
    },
    createdBy: '671234567890abcdef000001',
    featured: true
  },
  {
    name: 'Eco-Friendly Lunch Box',
    description: 'Stainless steel lunch box with eco-friendly design. Perfect for carrying lunch to work or school. Keep food fresh all day.',
    shortDescription: 'Stainless steel lunch box',
    category: 'Kitchen',
    price: 159000,
    originalPrice: 200000,
    discount: 20,
    cover: 'https://via.placeholder.com/400x300?text=Lunch+Box',
    stock: 45,
    ecoScore: 8.5,
    carbonFootprint: 1.2,
    recyclable: true,
    organic: false,
    rating: 4.4,
    reviewCount: 89,
    tags: ['lunchbox', 'stainless', 'eco', 'kitchen'],
    links: {
      shopee: 'https://shopee.vn/search?keyword=eco+lunch+box',
      tiktok: 'https://www.tiktok.com/search?q=eco+lunch+box',
      facebook: 'https://facebook.com/search/products?q=eco+lunch+box'
    },
    createdBy: '671234567890abcdef000001'
  }
]

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...')
    console.log('📍 MongoDB URI:', env.MONGODB_URI.substring(0, 50) + '...')
    
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      retryWrites: true,
      w: 'majority'
    })
    
    console.log('✅ Connected to MongoDB')
    
    const db = mongoose.connection.db
    const productsCollection = db.collection('products')
    
    // Clear existing products
    const clearResult = await productsCollection.deleteMany({})
    console.log(`🗑️  Deleted ${clearResult.deletedCount} existing products`)
    
    // Insert sample products
    const insertResult = await productsCollection.insertMany(sampleProducts)
    console.log(`✅ Successfully inserted ${insertResult.insertedIds.length} sample products`)
    
    // Display inserted products
    console.log('\n📦 Sample Products:')
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.price.toLocaleString('vi-VN')}đ`)
    })
    
    console.log('\n✅ Product seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding products:')
    console.error(error)
    process.exit(1)
  }
}

// Run seeding
seedProducts()
