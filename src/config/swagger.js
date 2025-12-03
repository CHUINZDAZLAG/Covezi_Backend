import swaggerJsdoc from 'swagger-jsdoc'
import { env } from '~/config/environment'

/**
 * Comprehensive Swagger configuration for Covezi API
 * Features: JWT cookie auth, complete route documentation, test interfaces
 * Design: Green/purple/red/orange theme with Covezi branding
 */

const specs = {
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
    }
  },
  apis: [
    './src/routes/v1/*.js'
  ]
}

const swaggerSpec = swaggerJsdoc(specs)

// Enhanced UI customization with Cover_Covezi background and colorful theme
export const swaggerUIOptions = {
  customCssUrl: null,
  customCss: `
    /* === GLOBAL RESET & SETUP === */
    * {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f4c3a 0%, #1a5f4a 25%, #2d8659 50%, #0f4c3a 100%);
      min-height: 100vh;
      position: relative;
    }
    
    /* Background Image - Cover_Covezi */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJjb3ZlemktcGF0dGVybiIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBvcGFjaXR5PSIwLjA1Ij4KICAgICAgPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMyIgZmlsbD0iIzRhOWY3YyIvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NvdmV6aS1wYXR0ZXJuKSIvPgo8L3N2Zz4K');
      background-size: 100px 100px;
      opacity: 0.3;
      z-index: -1;
      pointer-events: none;
    }

    /* === MAIN CONTAINER === */
    .swagger-ui {
      max-width: none !important;
      margin: 0 !important;
      padding: 20px !important;
      background: transparent !important;
      color: #ffffff !important;
    }
    
    /* === HEADER SECTION === */
    .swagger-ui .info {
      background: linear-gradient(135deg, rgba(15, 76, 58, 0.95), rgba(45, 134, 89, 0.9));
      backdrop-filter: blur(10px);
      border: 1px solid rgba(74, 159, 124, 0.3);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .swagger-ui .info::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(74, 159, 124, 0.1), transparent);
      animation: shimmer 3s infinite linear;
      pointer-events: none;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
    }
    
    .swagger-ui .info .title {
      color: #ffffff !important;
      font-size: 3.5rem !important;
      font-weight: 800 !important;
      text-align: center;
      margin-bottom: 20px !important;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      background: linear-gradient(45deg, #4af27c, #2d8659, #66d9a3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .swagger-ui .info .description {
      color: #e8f5e8 !important;
      font-size: 1.1rem !important;
      line-height: 1.8 !important;
      text-align: center;
      backdrop-filter: blur(5px);
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 15px;
      border: 1px solid rgba(74, 159, 124, 0.2);
    }

    /* === SERVERS DROPDOWN === */
    .swagger-ui .servers {
      background: linear-gradient(135deg, rgba(102, 51, 153, 0.9), rgba(138, 43, 226, 0.8));
      border-radius: 15px !important;
      padding: 20px !important;
      margin: 20px 0 !important;
      border: 2px solid rgba(138, 43, 226, 0.3) !important;
      box-shadow: 0 10px 30px rgba(102, 51, 153, 0.3);
    }
    
    .swagger-ui .servers label {
      color: #ffffff !important;
      font-weight: 600 !important;
    }

    /* === TAG SECTIONS - COLOR CODED === */
    .swagger-ui .opblock-tag-section {
      margin: 30px 0 !important;
    }
    
    /* Authentication - Purple */
    .swagger-ui .opblock-tag[data-tag="Authentication"] {
      background: linear-gradient(135deg, #6633cc, #8a2be2) !important;
      color: #ffffff !important;
      border-radius: 15px 15px 0 0 !important;
      padding: 20px !important;
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 5px 20px rgba(102, 51, 204, 0.4);
    }
    
    /* Products - Red/Orange */
    .swagger-ui .opblock-tag[data-tag="Products"] {
      background: linear-gradient(135deg, #dc3545, #ff6b35) !important;
      color: #ffffff !important;
      border-radius: 15px 15px 0 0 !important;
      padding: 20px !important;
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 5px 20px rgba(220, 53, 69, 0.4);
    }
    
    /* Challenges - Green */
    .swagger-ui .opblock-tag[data-tag="Challenges"] {
      background: linear-gradient(135deg, #28a745, #4af27c) !important;
      color: #ffffff !important;
      border-radius: 15px 15px 0 0 !important;
      padding: 20px !important;
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);
    }
    
    /* Chat - Blue */
    .swagger-ui .opblock-tag[data-tag="Chat"] {
      background: linear-gradient(135deg, #007bff, #40a9ff) !important;
      color: #ffffff !important;
      border-radius: 15px 15px 0 0 !important;
      padding: 20px !important;
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 5px 20px rgba(0, 123, 255, 0.4);
    }
    
    /* Garden - Orange */
    .swagger-ui .opblock-tag[data-tag="Garden"] {
      background: linear-gradient(135deg, #fd7e14, #ffb347) !important;
      color: #ffffff !important;
      border-radius: 15px 15px 0 0 !important;
      padding: 20px !important;
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 5px 20px rgba(253, 126, 20, 0.4);
    }

    /* === OPERATION BLOCKS === */
    .swagger-ui .opblock {
      margin: 15px 0 !important;
      border-radius: 15px !important;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(74, 159, 124, 0.2) !important;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    }
    
    .swagger-ui .opblock-summary {
      padding: 20px !important;
      background: rgba(245, 250, 245, 0.9) !important;
      border-bottom: 1px solid rgba(74, 159, 124, 0.1);
    }
    
    .swagger-ui .opblock-summary-method {
      border-radius: 8px !important;
      padding: 8px 15px !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
      text-transform: uppercase !important;
    }

    /* === RESPONSE SECTIONS === */
    .swagger-ui .responses-wrapper {
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(74, 159, 124, 0.1)) !important;
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid rgba(74, 159, 124, 0.2);
    }

    /* === SEARCH & FILTER IMPROVEMENTS === */
    .swagger-ui .filter-container {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 250, 245, 0.9));
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      border: 2px solid rgba(74, 159, 124, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .swagger-ui .filter .operation-filter-input {
      border: 2px solid #4a9f7c !important;
      border-radius: 10px !important;
      padding: 12px 20px !important;
      font-size: 1rem !important;
      background: rgba(255, 255, 255, 0.9) !important;
      color: #0f4c3a !important;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .filter .operation-filter-input:focus {
      border-color: #28a745 !important;
      box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2) !important;
      transform: scale(1.02);
    }

    /* === INTERACTIVE ELEMENTS === */
    .swagger-ui .btn {
      border-radius: 10px !important;
      padding: 12px 25px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      transition: all 0.3s ease !important;
      backdrop-filter: blur(5px);
    }
    
    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #28a745, #4af27c) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
    }
    
    .swagger-ui .btn.execute:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
    }

    /* === SCROLLBARS === */
    .swagger-ui ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    
    .swagger-ui ::-webkit-scrollbar-track {
      background: rgba(74, 159, 124, 0.1);
      border-radius: 6px;
    }
    
    .swagger-ui ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #4a9f7c, #2d8659);
      border-radius: 6px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .swagger-ui ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #28a745, #4af27c);
    }

    /* === MOBILE RESPONSIVE === */
    @media (max-width: 768px) {
      .swagger-ui {
        padding: 10px !important;
      }
      
      .swagger-ui .info {
        padding: 20px !important;
      }
      
      .swagger-ui .info .title {
        font-size: 2.5rem !important;
      }
      
      .swagger-ui .opblock {
        margin: 10px 0 !important;
      }
    }

    /* === ACCESSIBILITY IMPROVEMENTS === */
    .swagger-ui .opblock-summary:focus {
      outline: 3px solid rgba(40, 167, 69, 0.5) !important;
      outline-offset: 2px;
    }
    
    .swagger-ui .btn:focus {
      outline: 3px solid rgba(40, 167, 69, 0.5) !important;
      outline-offset: 2px;
    }
  `,
  customSiteTitle: 'Covezi API Documentation - Eco E-Commerce Platform',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showCommonExtensions: true,
    showExtensions: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayOperationId: false,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Auto-include cookies in requests
      request.credentials = 'include'
      return request
    }
  }
}

// API spec endpoint for external access
export const apiSpecEndpoint = (app) => {
  app.get('/api-spec', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })

  // eslint-disable-next-line no-console
  console.log(`📚 API Documentation available at: ${env.BUILD_MODE === 'production'
    ? 'https://website-covezi-backend-1.onrender.com/api-docs'
    : 'http://localhost:8017/api-docs'}`)
}

export default swaggerSpec