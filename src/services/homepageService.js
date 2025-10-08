import { env } from '~/config/environment'

const getHomepageData = async () => {
  try {
    // Return homepage content data
    const homepageData = {
      company: {
        name: env.COMPANY_NAME || 'Covezi',
        description: env.COMPANY_DESCRIPTION || 'Thương mại điện tử xanh - Bảo vệ môi trường với mỗi giao dịch',
        mission: 'Xây dựng một nền tảng thương mại điện tử bền vững, nơi mỗi giao dịch đều góp phần bảo vệ môi trường và tạo ra giá trị tích cực cho cộng đồng.',
        vision: 'Trở thành nền tảng thương mại điện tử xanh hàng đầu Việt Nam, kết nối người tiêu dùng với các sản phẩm thân thiện môi trường.',
        values: [
          'Bền vững môi trường',
          'Chất lượng sản phẩm',
          'Minh bạch thông tin',
          'Trách nhiệm xã hội'
        ]
      },
      
      socialLinks: {
        tiktok: env.TIKTOK_URL || 'https://tiktok.com/@covezi',
        facebook: env.FACEBOOK_URL || 'https://facebook.com/covezi',
        shopee: env.SHOPEE_URL || 'https://shopee.vn/covezi',
        website: env.WEBSITE_DOMAIN_PRODUCTION || 'https://covezi.com'
      },
      
      features: [
        {
          id: 'eco_products',
          title: 'Sản phẩm xanh',
          description: 'Hàng nghìn sản phẩm thân thiện môi trường được chọn lọc kỹ càng',
          icon: 'eco-leaf'
        },
        {
          id: 'virtual_garden',
          title: 'Vườn cây ảo',
          description: 'Trồng và chăm sóc vườn cây ảo, nhận thưởng từ các hoạt động xanh',
          icon: 'tree'
        },
        {
          id: 'green_challenges',
          title: 'Thử thách xanh',
          description: 'Tham gia các thử thách bảo vệ môi trường, nhận điểm thưởng và voucher',
          icon: 'challenge'
        },
        {
          id: 'carbon_tracking',
          title: 'Theo dõi carbon',
          description: 'Đo lường và giảm thiểu lượng khí thải carbon từ việc mua sắm',
          icon: 'carbon'
        }
      ],
      
      stats: {
        totalUsers: 10000,
        treesPlanted: 5000,
        carbonSaved: 2500, // kg CO2
        ordersDelivered: 15000
      },
      
      promotions: [
        {
          id: 'new_user_discount',
          title: 'Ưu đãi người dùng mới',
          description: 'Giảm 20% cho đơn hàng đầu tiên',
          discountPercent: 20,
          code: 'WELCOME20',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          image: 'https://via.placeholder.com/400x200?text=Welcome+Discount',
          active: true
        },
        {
          id: 'eco_month',
          title: 'Tháng môi trường',
          description: 'Mua sản phẩm xanh, tặng hạt giống cho vườn cây',
          discountPercent: 15,
          code: 'ECOMONTH',
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          image: 'https://via.placeholder.com/400x200?text=Eco+Month',
          active: true
        }
      ],
      
      topProducts: [], // Will be populated with actual product data
      
      testimonials: [
        {
          id: 1,
          name: 'Nguyễn Thị Mai',
          avatar: 'https://via.placeholder.com/60x60?text=NTM',
          comment: 'Sản phẩm chất lượng, thân thiện môi trường. Tôi rất thích trò chơi vườn cây!',
          rating: 5,
          location: 'Hà Nội'
        },
        {
          id: 2,
          name: 'Trần Văn Nam',
          avatar: 'https://via.placeholder.com/60x60?text=TVN',
          comment: 'Giao hàng nhanh, đóng gói cẩn thận. Các thử thách rất thú vị.',
          rating: 5,
          location: 'TP. Hồ Chí Minh'
        }
      ],
      
      news: [
        {
          id: 1,
          title: 'Covezi ra mắt tính năng vườn cây ảo',
          summary: 'Người dùng có thể trồng và chăm sóc cây ảo, nhận điểm thưởng từ hoạt động xanh.',
          publishedAt: new Date(),
          image: 'https://via.placeholder.com/300x200?text=Virtual+Garden',
          category: 'Tính năng mới'
        },
        {
          id: 2,
          title: '1000 cây xanh đầu tiên được trồng thành công',
          summary: 'Covezi đã trồng 1000 cây xanh thật từ hoạt động của người dùng trên nền tảng.',
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          image: 'https://via.placeholder.com/300x200?text=Real+Trees',
          category: 'Môi trường'
        }
      ]
    }
    
    return homepageData
  } catch (error) {
    throw error
  }
}

const getContactInfo = async () => {
  try {
    return {
      email: 'support@covezi.com',
      phone: '+84 901 234 567',
      address: 'Số 123, Đường ABC, Quận 1, TP. HCM',
      workingHours: {
        monday_friday: '8:00 - 18:00',
        saturday: '8:00 - 12:00',
        sunday: 'Nghỉ'
      },
      socialLinks: {
        tiktok: env.TIKTOK_URL,
        facebook: env.FACEBOOK_URL,
        shopee: env.SHOPEE_URL
      }
    }
  } catch (error) {
    throw error
  }
}

export const homepageService = {
  getHomepageData,
  getContactInfo
}