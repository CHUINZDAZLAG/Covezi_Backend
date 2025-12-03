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
        🌱 **REST API for eco-friendly e-commerce platform with gamification.**
        
        **🚀 Core Features:** 
        • JWT Authentication (Google OAuth2 ready)
        • 🛒 Shopping cart & Product management  
        • 🎯 Environmental Challenges system
        • 🌳 Virtual Garden gamification
        • 🤖 AI Chat with ZiZi (Google Gemini + RAG)
        • 🎁 XP & Voucher reward system
        • 📱 Real-time notifications (Socket.IO)
        
        **⚡ Tech Stack:** Node.js 22, Express, MongoDB, Socket.IO, Cloudinary, SendGrid
        
        **🔐 Authentication:** JWT + HTTP-only cookies (auto-authenticated on all requests)
        
        **🌍 Environment:** Production server hosted on Render with MongoDB Atlas
        
        **📝 Notes:** 
        • Timestamps in Unix milliseconds
        • Cookies auto-sent by browser  
        • Auto-cancel unpaid orders after 24h
        • Challenge cleanup via cron jobs
      `,
      contact: {
        name: 'Covezi Development Team',
        email: 'dev@covezi.org',
        url: 'https://covezi.org'
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
          ? '🌐 Production Server (Render + MongoDB Atlas)'
          : '🔧 Development Server (Local)'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: '🔐 User authentication, registration, and account management'
      },
      {
        name: 'Products',
        description: '🛍️ Eco-friendly product management, search, and e-commerce features'
      },
      {
        name: 'Challenges',
        description: '🎯 Environmental challenges, social features, and XP rewards system'
      },
      {
        name: 'Chat',
        description: '🤖 AI Chat with ZiZi - Google Gemini + RAG for eco-product recommendations'
      },
      {
        name: 'Garden',
        description: '🌳 Virtual garden gamification, tree planting, and level progression'
      },
      {
        name: 'Vouchers',
        description: '🎁 Voucher rewards, level milestones, and discount management'
      },
      {
        name: 'Homepage',
        description: '🏠 Homepage data, company info, features, and public content'
      },
      {
        name: 'Gamification',
        description: '🎮 XP system, garden management, leaderboard, and achievement rewards'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: '🍪 JWT token automatically sent via HTTP-only cookie'
        }
      },
      responses: {
        Unauthorized: {
          description: '❌ Authentication failed - missing or invalid token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Authentication required. Please login.'
                  },
                  statusCode: {
                    type: 'number',
                    example: 401
                  }
                }
              }
            }
          }
        },
        Forbidden: {
          description: '🚫 Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Access denied. Admin privileges required.'
                  },
                  statusCode: {
                    type: 'number',
                    example: 403
                  }
                }
              }
            }
          }
        },
        BadRequest: {
          description: '⚠️ Invalid request data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Validation failed'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string'
                        },
                        message: {
                          type: 'string'
                        }
                      }
                    }
                  },
                  statusCode: {
                    type: 'number',
                    example: 400
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: '💥 Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Internal server error occurred'
                  },
                  statusCode: {
                    type: 'number',
                    example: 500
                  }
                }
              }
            }
          }
        },
        NotFound: {
          description: '🔍 Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Resource not found'
                  },
                  statusCode: {
                    type: 'number',
                    example: 404
                  }
                }
              }
            }
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '674f1234567890abcdef1234'
            },
            username: {
              type: 'string',
              example: 'ecouser2024'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@covezi.org'
            },
            displayName: {
              type: 'string',
              example: 'Eco User'
            },
            avatar: {
              type: 'string',
              format: 'url',
              example: 'https://res.cloudinary.com/covezi/image/avatar.jpg'
            },
            level: {
              type: 'number',
              example: 12
            },
            totalXP: {
              type: 'number',
              example: 2450
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            },
            createdAt: {
              type: 'number',
              example: 1701648000000
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '674f1234567890abcdef1234'
            },
            title: {
              type: 'string',
              example: 'Organic Cotton T-Shirt'
            },
            description: {
              type: 'string',
              example: 'Sustainable organic cotton t-shirt made from 100% eco-friendly materials'
            },
            price: {
              type: 'number',
              example: 299000
            },
            originalPrice: {
              type: 'number',
              example: 399000
            },
            discountPercent: {
              type: 'number',
              example: 25
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'url'
              },
              example: ['https://res.cloudinary.com/covezi/image/product1.jpg']
            },
            category: {
              type: 'string',
              example: 'Clothing'
            },
            ecoScore: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              example: 8.5
            },
            inStock: {
              type: 'boolean',
              example: true
            },
            stockQuantity: {
              type: 'number',
              example: 150
            }
          }
        },
        Challenge: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '674f1234567890abcdef1234'
            },
            title: {
              type: 'string',
              example: 'Zero Waste Week Challenge'
            },
            description: {
              type: 'string',
              example: 'Reduce your waste by 80% for one week'
            },
            xpReward: {
              type: 'number',
              example: 50
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'medium'
            },
            category: {
              type: 'string',
              example: 'waste-reduction'
            },
            duration: {
              type: 'number',
              description: 'Duration in days',
              example: 7
            },
            participants: {
              type: 'number',
              example: 234
            },
            createdBy: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string'
                },
                username: {
                  type: 'string'
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            deadlineAt: {
              type: 'number',
              example: 1735689600000
            }
          }
        }
      }
    },
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
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    },
    customCss: `
      /* Hide default topbar */
      .swagger-ui .topbar { display: none !important; }
      
      /* Main container styling with background */
      .swagger-ui {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(156, 39, 176, 0.05) 50%, rgba(255, 152, 0, 0.05) 100%);
        min-height: 100vh;
        position: relative;
      }
      
      /* Background image */
      .swagger-ui::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('https://website-covezi-frontend.vercel.app/assets/Cover_Covezi.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0.03;
        z-index: -1;
      }
      
      /* Custom header */
      .swagger-ui .info {
        margin: 0;
        padding: 30px;
        background: linear-gradient(135deg, #4CAF50 0%, #81C784 50%, #A5D6A7 100%);
        border-radius: 15px 15px 0 0;
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      .swagger-ui .info::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
        border-radius: 50%;
      }
      
      .swagger-ui .info .title {
        color: #fff !important;
        font-size: 2.5em !important;
        font-weight: 700 !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        margin-bottom: 15px !important;
        position: relative;
        z-index: 1;
      }
      
      .swagger-ui .info .description {
        color: #f1f8e9 !important;
        font-size: 1.1em !important;
        line-height: 1.6 !important;
        position: relative;
        z-index: 1;
        background: rgba(255,255,255,0.1);
        padding: 20px;
        border-radius: 10px;
        backdrop-filter: blur(5px);
      }
      
      /* Main wrapper */
      .swagger-ui .wrapper {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
      }
      
      /* Filter/Search styling */
      .swagger-ui .filter-container {
        padding: 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%);
        border-bottom: 2px solid #4CAF50;
      }
      
      .swagger-ui .filter input[type=text] {
        border: 2px solid #4CAF50 !important;
        border-radius: 25px !important;
        padding: 12px 20px !important;
        font-size: 16px !important;
        width: 100% !important;
        max-width: 400px !important;
        background: #fff !important;
        color: #2e7d32 !important;
        box-shadow: 0 2px 10px rgba(76, 175, 80, 0.2) !important;
        transition: all 0.3s ease !important;
      }
      
      .swagger-ui .filter input[type=text]:focus {
        outline: none !important;
        border-color: #9c27b0 !important;
        box-shadow: 0 4px 20px rgba(156, 39, 176, 0.3) !important;
        transform: translateY(-2px);
      }
      
      .swagger-ui .filter input[type=text]::placeholder {
        color: #81c784 !important;
      }
      
      /* Tag sections styling */
      .swagger-ui .opblock-tag {
        background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%) !important;
        color: #fff !important;
        padding: 15px 25px !important;
        border-radius: 12px !important;
        margin: 15px 0 !important;
        border: none !important;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3) !important;
        font-weight: 600 !important;
        font-size: 1.3em !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        position: relative !important;
        overflow: hidden !important;
      }
      
      .swagger-ui .opblock-tag::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .swagger-ui .opblock-tag:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4) !important;
        background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%) !important;
      }
      
      .swagger-ui .opblock-tag:hover::before {
        left: 100%;
      }
      
      /* Different colors for different tag sections */
      .swagger-ui .opblock-tag[data-tag="Authentication"] {
        background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%) !important;
        box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Authentication"]:hover {
        background: linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%) !important;
        box-shadow: 0 8px 25px rgba(156, 39, 176, 0.4) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Products"] {
        background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%) !important;
        box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Products"]:hover {
        background: linear-gradient(135deg, #FF7043 0%, #FF5722 100%) !important;
        box-shadow: 0 8px 25px rgba(255, 87, 34, 0.4) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Challenges"] {
        background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%) !important;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Chat"] {
        background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%) !important;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Chat"]:hover {
        background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%) !important;
        box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Garden"] {
        background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%) !important;
        box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3) !important;
      }
      
      .swagger-ui .opblock-tag[data-tag="Garden"]:hover {
        background: linear-gradient(135deg, #FFB74D 0%, #FF9800 100%) !important;
        box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4) !important;
      }
      
      /* Individual operation blocks */
      .swagger-ui .opblock {
        border-radius: 10px !important;
        margin: 10px 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        overflow: hidden !important;
        transition: all 0.3s ease !important;
      }
      
      .swagger-ui .opblock:hover {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
        transform: translateY(-2px) !important;
      }
      
      /* HTTP Method colors */
      .swagger-ui .opblock.opblock-post {
        border-left: 5px solid #4CAF50 !important;
      }
      
      .swagger-ui .opblock.opblock-get {
        border-left: 5px solid #2196F3 !important;
      }
      
      .swagger-ui .opblock.opblock-put {
        border-left: 5px solid #FF9800 !important;
      }
      
      .swagger-ui .opblock.opblock-delete {
        border-left: 5px solid #F44336 !important;
      }
      
      /* Scheme container */
      .swagger-ui .scheme-container {
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%) !important;
        border: 2px solid #4CAF50 !important;
        border-radius: 15px !important;
        padding: 20px !important;
        margin: 20px 0 !important;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2) !important;
      }
      
      /* Authorization button */
      .swagger-ui .btn.authorize {
        background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%) !important;
        border: none !important;
        border-radius: 25px !important;
        padding: 12px 25px !important;
        color: #fff !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3) !important;
        transition: all 0.3s ease !important;
      }
      
      .swagger-ui .btn.authorize:hover {
        background: linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%) !important;
        box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4) !important;
        transform: translateY(-2px) !important;
      }
      
      /* Try it out buttons */
      .swagger-ui .btn.try-out__btn {
        background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%) !important;
        border: none !important;
        border-radius: 20px !important;
        color: #fff !important;
        padding: 8px 20px !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;
      }
      
      .swagger-ui .btn.try-out__btn:hover {
        background: linear-gradient(135deg, #FF7043 0%, #FF5722 100%) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3) !important;
      }
      
      /* Execute button */
      .swagger-ui .btn.execute {
        background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%) !important;
        border: none !important;
        border-radius: 25px !important;
        color: #fff !important;
        padding: 12px 30px !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3) !important;
      }
      
      .swagger-ui .btn.execute:hover {
        background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4) !important;
      }
      
      /* Parameter tables */
      .swagger-ui table {
        border-radius: 10px !important;
        overflow: hidden !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
      }
      
      .swagger-ui .parameters-container {
        background: #f8f9fa !important;
        border-radius: 10px !important;
        padding: 15px !important;
        margin: 10px 0 !important;
      }
      
      /* Response section */
      .swagger-ui .responses-wrapper {
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%) !important;
        border-radius: 10px !important;
        padding: 15px !important;
        margin: 15px 0 !important;
        border-left: 4px solid #4CAF50 !important;
      }
      
      /* Custom scrollbar */
      .swagger-ui ::-webkit-scrollbar {
        width: 12px;
      }
      
      .swagger-ui ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      
      .swagger-ui ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
        border-radius: 10px;
      }
      
      .swagger-ui ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
      }
      
      /* Model section */
      .swagger-ui .model-container {
        background: linear-gradient(135deg, #fafafa 0%, #f0f4f0 100%) !important;
        border-radius: 10px !important;
        border: 1px solid #e0e0e0 !important;
        margin: 10px 0 !important;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .swagger-ui .wrapper {
          padding: 0 10px;
          margin: 10px;
        }
        
        .swagger-ui .info {
          padding: 20px;
        }
        
        .swagger-ui .info .title {
          font-size: 2em !important;
        }
        
        .swagger-ui .filter input[type=text] {
          max-width: 100% !important;
        }
      }
    `,
    customSiteTitle: 'Covezi API Documentation | Eco-Commerce Platform',
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