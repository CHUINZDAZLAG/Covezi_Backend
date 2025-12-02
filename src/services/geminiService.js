import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'
import { env } from '~/config/environment'

// Store name từ Filestore RAG (đã upload dữ liệu sản phẩm Covezi)
const COVEZI_RAG_STORE = 'fileSearchStores/coveziproducts-1h6pwx6vm9cu'

// Client cho RAG (SDK mới @google/genai)
const ragClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

/**
 * GeminiProvider - Integration with Google Gemini AI API
 * Provides chat completion with streaming support
 */
class GeminiProvider {
  constructor() {
    // Initialize Google Generative AI client
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    
    // Default model configuration - using stable model
    this.modelName = 'gemini-2.0-flash-lite'
    
    // Generation config for better responses
    this.generationConfig = {
      temperature: 0.9, // Controls randomness (0-1, higher = more creative)
      topP: 0.95, // Nucleus sampling threshold
      topK: 40, // Top-k sampling
      maxOutputTokens: 8192 // Maximum length of response
    }

    // Safety settings to prevent harmful content
    this.safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  }

  /**
   * Create a new chat session with conversation history
   * @param {Array} history - Array of {role: 'user'|'assistant', content: string}
   * @param {string} systemInstruction - System instruction for AI behavior
   * @returns {ChatSession} Gemini chat session object
   */
  createChatSession(history = [], systemInstruction = null) {
    const modelConfig = {
      model: this.modelName,
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings
    }

    // Add system instruction if provided
    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction
    }

    const model = this.genAI.getGenerativeModel(modelConfig)

    // Convert history to Gemini format
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({
      history: formattedHistory
    })

    return chat
  }

  /**
   * Send message and stream response chunks
   * @param {ChatSession} chat - Gemini chat session
   * @param {string} message - User message
   * @param {Function} onChunk - Callback for each streamed chunk: (text) => void
   * @returns {Promise<string>} Complete response text
   */
  async sendMessageStream(chat, message, onChunk) {
    try {
      const result = await chat.sendMessageStream(message)

      let fullResponse = ''

      // Stream each chunk of the response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText

        // Call the callback with each chunk
        if (onChunk && typeof onChunk === 'function') {
          onChunk(chunkText)
        }
      }

      return fullResponse
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Gemini API Error:', error)
      
      // Handle rate limit error (429) with retry suggestion
      if (error.message && error.message.includes('429')) {
        throw new Error('ZiZi is taking a short nap 😴 Please try again in 30 seconds! (Rate limit - Google Gemini)')
      }
      
      // Handle model not found
      if (error.message && error.message.includes('404')) {
        throw new Error('ZiZi is updating... Please try again later! (Model unavailable)')
      }
      
      throw new Error(`Gemini API Error: ${error.message}`)
    }
  }

  /**
   * Send message without streaming (get complete response at once)
   * @param {ChatSession} chat - Gemini chat session
   * @param {string} message - User message
   * @returns {Promise<string>} Complete response text
   */
  async sendMessage(chat, message) {
    try {
      const result = await chat.sendMessage(message)
      const response = result.response
      return response.text()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Gemini API Error:', error)
      throw new Error(`Gemini API Error: ${error.message}`)
    }
  }

  /**
   * Generate content without chat history (one-shot generation)
   * @param {string} prompt - Input prompt
   * @returns {Promise<string>} Generated text
   */
  async generateContent(prompt) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings
      })

      const result = await model.generateContent(prompt)
      const response = result.response
      return response.text()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Gemini API Error:', error)
      throw new Error(`Gemini API Error: ${error.message}`)
    }
  }

  /**
   * Count tokens in text (useful for managing context limits)
   * @param {string} text - Text to count tokens
   * @returns {Promise<number>} Token count
   */
  async countTokens(text) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName })
      const result = await model.countTokens(text)
      return result.totalTokens
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Token counting error:', error)
      throw new Error(`Token counting error: ${error.message}`)
    }
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider()

const systemPrompt = `You are ZiZi, a cute and helpful AI assistant for Covezi - an eco-friendly products and sustainable living platform. 

Your personality:
- Cute and friendly with occasional cat emojis (meow 🐱)
- Knowledgeable about sustainable products and eco-friendly practices
- Helpful and patient in answering questions
- Encouraging users to make environmentally conscious choices

Topics you can help with:
- Sustainable products on Covezi
- Environmental tips and green living advice
- Product recommendations
- Recycling and waste reduction
- Carbon footprint reduction
- Sustainable fashion and lifestyle
- Garden and plant care
- General eco-friendly questions

Always be helpful, kind, and promote sustainability. Keep responses concise and engaging.`

/**
 * Generate AI response using Gemini
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI response
 */
export const generateAIResponse = async (userMessage) => {
  try {
    const chat = geminiProvider.createChatSession([], systemPrompt)
    const response = await geminiProvider.sendMessage(chat, userMessage)
    return response
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GEMINI] Error generating response:', error.message)
    throw new Error('Failed to generate AI response')
  }
}

/**
 * Generate a concise title for a conversation
 * @param {Array} messages - Array of conversation messages
 * @returns {Promise<string>} - Generated title
 */
export const generateTitleFromConversation = async (messages) => {
  try {
    // Create a summary of the conversation
    const conversationText = messages.map(msg =>
      `${msg.role}: ${msg.content}`
    ).join('\n')

    const titlePrompt = `Please generate a short, concise title (max 50 characters) for this conversation. Return only the title, nothing else:

${conversationText}

Title:`

    const title = await geminiProvider.generateContent(titlePrompt)
    
    // Clean up the title and ensure it's not too long
    return title.replace(/['"]/g, '').substring(0, 50)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GEMINI] Error generating title:', error.message)
    return 'New Chat' // Fallback title
  }
}

/**
 * Stream AI response using Gemini (for real-time streaming)
 * @param {string} userMessage - The user's message
 * @returns {AsyncGenerator} - Async generator that yields text chunks
 */
export async function* streamAIResponse(userMessage) {
  try {
    const chat = geminiProvider.createChatSession([], systemPrompt)
    
    let fullResponse = ''
    await geminiProvider.sendMessageStream(chat, userMessage, (chunk) => {
      fullResponse += chunk
    })

    // Yield the full response as a single chunk for now
    // In future, modify sendMessageStream to support true async iteration
    yield fullResponse
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GEMINI] Error streaming response:', error.message)
    throw new Error('Failed to stream AI response')
  }
}

/**
 * 🐱 ZiZi RAG - Trả lời dựa trên dữ liệu sản phẩm Covezi thật
 * Sử dụng Gemini Filestore để query với RAG
 * @param {string} userMessage - Câu hỏi của user
 * @returns {Promise<string>} - Câu trả lời từ ZiZi với dữ liệu RAG
 */
export const askZiZiWithRAG = async (userMessage) => {
  try {
    const ragSystemInstruction = `
    Bạn là ZiZi 🐱, nhân viên tư vấn dễ thương của Covezi - nền tảng sản phẩm xanh và bền vững.
    
    Nguyên tắc:
    1. Trả lời ngắn gọn, súc tích, thân thiện như mèo con 🐱
    2. Trả lời dựa trên DUY NHẤT thông tin từ tài liệu đính kèm (danh sách sản phẩm Covezi)
    3. Nếu không có thông tin, xin lỗi và gợi ý liên hệ support@covezi.vn, KHÔNG BỊA ĐẶT
    4. Giọng điệu vui vẻ, dùng emoji phù hợp 🌱💚♻️
    5. Báo giá rõ ràng, nếu có giảm giá thì nêu cả giá gốc và giá sau giảm
    6. Khuyến khích lối sống xanh và bền vững
    7. Có thể gợi ý sản phẩm phù hợp dựa trên nhu cầu
    
    Ví dụ cách trả lời:
    - "Meow! 🐱 ZiZi tìm thấy sản phẩm này cho bạn nè..."
    - "Ôi, bạn quan tâm đến sản phẩm xanh, ZiZi thích lắm! 💚..."
    `

    const response = await ragClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: ragSystemInstruction,
        temperature: 0.3,
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [COVEZI_RAG_STORE]
          }
        }]
      }
    })

    return response.text
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GEMINI RAG] Error:', error.message)
    
    // Fallback về non-RAG nếu RAG fail
    // eslint-disable-next-line no-console
    console.log('[GEMINI RAG] Falling back to standard response...')
    return generateAIResponse(userMessage)
  }
}
