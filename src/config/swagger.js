import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { env } from '~/config/environment'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Covezi E-Commerce API Documentation',
      version: '1.0.0',
      description: `
        **REST API for eco-friendly e-commerce platform.**
        
        **Features:** JWT auth (Google OAuth2), Shopping cart, Orders (COD/MoMo), AI chat (Gemini), Reviews, Wishlist, Homepage management, Garden gamification, Challenges system
        
        **Tech:** Node.js 22, Express, MongoDB, Socket.IO, Cloudinary, Resend
        
        **Authentication:** Login + Cookies auto-saved + Auto-authenticated on all requests
        
        **Notes:** Timestamps in Unix ms | Cookies auto-sent | Cron: Auto-cancel unpaid orders after 24h
      `,
      contact: {
        name: 'Covezi Development Team',
        email: 'dev@covezi.org'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: env.BUILD_MODE === 'production' 
          ? 'https://website-covezi-backend-1.onrender.com'
          : 'http://localhost:8017',
        description: env.BUILD_MODE === 'production' 
          ? 'Production Server (https://website-covezi-backend-1.onrender.com)'
          : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token stored in HTTP-only cookie (auto-sent by browser)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@covezi.org' },
            username: { type: 'string', example: 'ecouser' },
            displayName: { type: 'string', example: 'Eco User' },
            avatar: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/covezi/image/upload/avatar.jpg' },
            role: { type: 'string', enum: ['client', 'admin'], default: 'client' },
            isActive: { type: 'boolean', default: false },
            createdAt: { type: 'number', example: 1701532800000 },
            updatedAt: { type: 'number', nullable: true }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Eco Bamboo Water Bottle' },
            description: { type: 'string', example: 'Sustainable bamboo water bottle with leak-proof design' },
            shortDescription: { type: 'string', example: 'Eco-friendly bamboo water bottle' },
            category: { type: 'string', example: 'kitchen' },
            price: { type: 'number', example: 25.99 },
            discount: { type: 'number', example: 10 },
            images: { type: 'array', items: { type: 'string' } },
            thumbnail: { type: 'string', example: 'https://res.cloudinary.com/covezi/image/upload/thumb.jpg' },
            cover: { type: 'string', example: '/assets/Covezi-Product.png' },
            links: {
              type: 'object',
              properties: {
                shopee: { type: 'string', example: 'https://shopee.vn/product/123' },
                tiktok: { type: 'string', example: 'https://shop.tiktok.com/product/123' },
                facebook: { type: 'string', example: 'https://facebook.com/marketplace/123' }
              }
            },
            stock: { type: 'number', example: 100 },
            status: { type: 'string', enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
            sold: { type: 'number', example: 25 },
            views: { type: 'number', example: 150 },
            rating: { type: 'number', minimum: 0, maximum: 5, example: 4.5 },
            reviewCount: { type: 'number', example: 12 },
            featured: { type: 'boolean', default: false },
            createdBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
            createdAt: { type: 'number', example: 1701532800000 },
            updatedAt: { type: 'number', nullable: true }
          }
        },
        Challenge: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Plant 5 Trees Challenge' },
            description: { type: 'string', example: 'Plant 5 trees in your local area and share photos' },
            type: { type: 'string', enum: ['ECO_ACTION', 'AWARENESS', 'COMMUNITY'], default: 'ECO_ACTION' },
            tags: { type: 'array', items: { type: 'string' }, example: ['planting', 'environment', 'trees'] },
            durationDays: { type: 'number', example: 7 },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'DRAFT'], default: 'ACTIVE' },
            startDate: { type: 'number', example: 1701532800000 },
            endDate: { type: 'number', example: 1702137600000 },
            likeCount: { type: 'number', example: 45 },
            commentCount: { type: 'number', example: 12 },
            participantCount: { type: 'number', example: 8 },
            image: { type: 'string', example: 'https://res.cloudinary.com/covezi/image/upload/challenge.jpg' },
            createdBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
            creatorDisplayName: { type: 'string', example: 'Eco Warrior' },
            isTrending: { type: 'boolean', default: false },
            isOfficial: { type: 'boolean', default: false },
            featured: { type: 'boolean', default: false }
          }
        },
        UserGarden: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            level: { type: 'number', example: 15 },
            currentXp: { type: 'number', example: 750 },
            nextLevelXp: { type: 'number', example: 800 },
            treeStage: { type: 'number', example: 3 },
            treeCustomization: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'My Eco Tree' },
                treeType: { type: 'string', example: 'oak' },
                color: { type: 'string', example: '#4CAF50' },
                potType: { type: 'string', example: 'ceramic' },
                potColor: { type: 'string', example: '#D7CCC8' },
                effects: { type: 'string', example: 'sparkle' }
              }
            }
          }
        },
        Voucher: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            code: { type: 'string', example: 'ECO20231201' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            levelEarned: { type: 'number', example: 20 },
            discountPercent: { type: 'number', example: 20 },
            status: { type: 'string', enum: ['active', 'used', 'expired'], default: 'active' },
            issuedAt: { type: 'number', example: 1701532800000 },
            expiresAt: { type: 'number', example: 1717084800000 }
          }
        },
        ChatSession: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Eco Products Chat' },
            createdAt: { type: 'number', example: 1701532800000 },
            updatedAt: { type: 'number', example: 1701532800000 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            statusCode: { type: 'number', example: 400 },
            stack: { type: 'string', example: 'Error stack trace (dev only)' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object', example: {} },
            statusCode: { type: 'number', example: 200 }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: []
      },
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app) => {
  // Serve swagger docs at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #4CAF50; }
      .swagger-ui .info .description { color: #666; }
      .swagger-ui .scheme-container { 
        background: #f8f9fa; 
        border: 1px solid #e9ecef; 
        padding: 10px; 
        margin: 10px 0; 
      }
    `,
    customSiteTitle: 'Covezi API Documentation',
    customfavIcon: 'https://website-covezi-frontend.vercel.app/favicon.ico'
  }))

  // JSON endpoint for the swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })

  console.log(`📚 API Documentation available at: ${env.BUILD_MODE === 'production' 
    ? 'https://website-covezi-backend-1.onrender.com/api-docs' 
    : 'http://localhost:8017/api-docs'}`)
}

export default specs