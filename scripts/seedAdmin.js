import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://covezi_user:nCoqLfUi3OxPa20e@cluster0.37r7s.mongodb.net/covezi-db?retryWrites=true&w=majority'

const createAdminUser = async () => {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db('covezi-db')
    const usersCollection = db.collection('users')
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@covezi.com' })
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists, updating it...')
      // Delete existing admin first
      await usersCollection.deleteOne({ email: 'admin@covezi.com' })
    }
    
    // Hash password
    const password = 'Admin@123456'
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // Create admin user
    const adminUser = {
      email: 'admin@covezi.com',
      password: hashedPassword,
      username: 'admin',
      displayName: 'Admin User',
      avatar: null,
      role: 'admin',
      isActive: true,
      verifyToken: null,
      createdAt: new Date(),
      updatedAt: null,
      _destroy: false
    }
    
    const result = await usersCollection.insertOne(adminUser)
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@covezi.com')
    console.log('🔑 Password: Admin@123456')
    console.log('🆔 User ID:', result.insertedId.toString())
    console.log('\n⚠️  Please change this password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  } finally {
    await client.close()
    console.log('Connection closed')
  }
}

createAdminUser()
