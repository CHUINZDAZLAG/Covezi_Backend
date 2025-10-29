import dotenv from 'dotenv'
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const DATABASE_NAME = process.env.DATABASE_NAME || 'covezi-db'

const mongoClientInstance = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false
  },
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 45000,
  waitQueueTimeoutMS: 10000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  journal: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4,
  directConnection: false
})

const generateVoucherCode = (userId, createdDate, expiryDate) => {
  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  const createdDateStr = formatDate(createdDate)
  const expiryDateStr = formatDate(expiryDate)
  
  return `${userId}+${createdDateStr}+${expiryDateStr}`
}

async function createVoucherForTestUser() {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoClientInstance.connect()
    console.log('✅ Connected to MongoDB')

    const db = mongoClientInstance.db(DATABASE_NAME)
    
    // Find user by email
    console.log('🔍 Finding user with email: test@gmail.com')
    const user = await db.collection('users').findOne({ email: 'test@gmail.com' })
    
    if (!user) {
      console.log('❌ User not found with email: test@gmail.com')
      return
    }

    console.log(`✅ Found user: ${user.displayName || 'N/A'} (ID: ${user._id})`)

    // Create voucher
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
    const voucherCode = generateVoucherCode(user._id.toString(), now, expiresAt)

    const newVoucher = {
      voucherCode,
      userId: user._id,
      percent: 30, // 30% discount
      levelReward: 5, // Level 5 reward
      status: 'active',
      productId: '',
      usageRequest: null,
      sharingHistory: [],
      confirmedAt: null,
      confirmedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: '',
      expiresAt,
      description: 'Test voucher - 30% discount',
      createdAt: now,
      updatedAt: null,
      _destroy: false
    }

    console.log('📝 Creating voucher...')
    console.log('   Code:', voucherCode)
    console.log('   Discount:', newVoucher.percent + '%')
    console.log('   Expires:', expiresAt.toLocaleDateString('vi-VN'))

    const result = await db.collection('vouchers').insertOne(newVoucher)
    console.log(`✅ Voucher created successfully! ID: ${result.insertedId}`)

    // Update user garden to include voucher
    console.log('📝 Updating user garden...')
    const updateResult = await db.collection('UserGardens').updateOne(
      { userId: user._id },
      {
        $push: { vouchersReceived: result.insertedId },
        $addToSet: {
          voucherMilestonesClaimed: {
            level: 5,
            claimedAt: now,
            discountPercent: 30
          }
        }
      }
    )

    if (updateResult.matchedCount > 0) {
      console.log('✅ User garden updated with new voucher')
    } else {
      console.log('⚠️ User garden not found, but voucher was created')
    }

    console.log('\n🎉 Voucher creation completed successfully!')
    console.log('\n📋 Voucher Details:')
    console.log(`   Email: test@gmail.com`)
    console.log(`   Voucher Code: ${voucherCode}`)
    console.log(`   Discount: ${newVoucher.percent}%`)
    console.log(`   Created: ${now.toLocaleString('vi-VN')}`)
    console.log(`   Expires: ${expiresAt.toLocaleString('vi-VN')}`)
    console.log(`   Status: Active`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    console.log('\n🔌 Closing connection...')
    await mongoClientInstance.close()
    console.log('✅ Connection closed')
    process.exit(0)
  }
}

createVoucherForTestUser()
