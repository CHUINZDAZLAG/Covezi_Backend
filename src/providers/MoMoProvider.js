import crypto from 'crypto'
import axios from 'axios'

class MoMoProvider {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE
    this.accessKey = process.env.MOMO_ACCESS_KEY
    this.secretKey = process.env.MOMO_SECRET_KEY
    this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api'
    this.returnUrl = process.env.MOMO_RETURN_URL || `${process.env.WEB_DOMAIN_FRONTEND}/payment/return`
    this.notifyUrl = process.env.MOMO_NOTIFY_URL || `${process.env.WEB_DOMAIN_BACKEND}/v1/payments/momo/notify`
  }

  generateSignature(rawData) {
    return crypto.createHmac('sha256', this.secretKey).update(rawData).digest('hex')
  }

  generateRequestId() {
    return `COVEZI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async createPayment(orderInfo) {
    try {
      const {
        orderId,
        amount,
        orderInfo: description,
        extraData = '',
        requestType = 'payWithATM',
        lang = 'vi'
      } = orderInfo

      const requestId = this.generateRequestId()
      
      // Create raw signature string
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${description}&partnerCode=${this.partnerCode}&redirectUrl=${this.returnUrl}&requestId=${requestId}&requestType=${requestType}`
      
      const signature = this.generateSignature(rawSignature)

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: amount.toString(),
        orderId: orderId,
        orderInfo: description,
        redirectUrl: this.returnUrl,
        ipnUrl: this.notifyUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: lang
      }

      const response = await axios.post(`${this.endpoint}/create`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data && response.data.resultCode === 0) {
        return {
          success: true,
          payUrl: response.data.payUrl,
          qrCodeUrl: response.data.qrCodeUrl,
          requestId: requestId,
          orderId: orderId
        }
      } else {
        throw new Error(response.data?.message || 'Failed to create MoMo payment')
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async queryPaymentStatus(requestId, orderId) {
    try {
      // Create raw signature string for query
      const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`
      const signature = this.generateSignature(rawSignature)

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        orderId: orderId,
        signature: signature,
        lang: 'vi'
      }

      const response = await axios.post(`${this.endpoint}/query`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return {
        success: true,
        data: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  verifySignature(data) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = data

      // Create raw signature string for verification
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`
      
      const expectedSignature = this.generateSignature(rawSignature)
      
      return signature === expectedSignature

    } catch (error) {
      return false
    }
  }

  async refundPayment(refundInfo) {
    try {
      const {
        orderId,
        amount,
        transId,
        description = 'Covezi refund'
      } = refundInfo

      const refundRequestId = this.generateRequestId()
      
      // Create raw signature string for refund
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${refundRequestId}&transId=${transId}`
      
      const signature = this.generateSignature(rawSignature)

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: refundRequestId,
        orderId: orderId,
        amount: amount.toString(),
        transId: transId,
        lang: 'vi',
        description: description,
        signature: signature
      }

      const response = await axios.post(`${this.endpoint}/refund`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return {
        success: response.data?.resultCode === 0,
        data: response.data,
        refundRequestId: refundRequestId
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  formatAmount(amount) {
    // Ensure amount is integer and within MoMo limits
    const intAmount = Math.floor(Number(amount))
    if (intAmount < 1000) {
      throw new Error('Minimum payment amount is 1,000 VND')
    }
    if (intAmount > 50000000) {
      throw new Error('Maximum payment amount is 50,000,000 VND')
    }
    return intAmount
  }

  formatOrderInfo(orderData) {
    const { orderCode, customerName, productCount } = orderData
    return `Covezi - ${orderCode} - ${customerName} - ${productCount} sản phẩm`
  }

  parsePaymentResult(resultCode) {
    const statusMap = {
      0: { status: 'success', message: 'Payment successful' },
      9000: { status: 'pending', message: 'Payment is being processed' },
      8000: { status: 'pending', message: 'Payment is being confirmed' },
      7000: { status: 'pending', message: 'Payment is being verified' },
      1000: { status: 'failed', message: 'Payment failed due to system error' },
      1001: { status: 'failed', message: 'Payment failed due to network error' },
      1002: { status: 'failed', message: 'Invalid signature' },
      1003: { status: 'failed', message: 'Invalid access key' },
      1004: { status: 'failed', message: 'Invalid amount' },
      1005: { status: 'failed', message: 'Invalid order info' },
      1006: { status: 'failed', message: 'Invalid order ID' },
      2001: { status: 'failed', message: 'Order not found' },
      2002: { status: 'failed', message: 'Order already processed' },
      2003: { status: 'failed', message: 'Order expired' },
      4000: { status: 'failed', message: 'Invalid request' },
      4001: { status: 'failed', message: 'Order canceled by user' },
      4100: { status: 'failed', message: 'Transaction declined by bank' },
      5000: { status: 'failed', message: 'System maintenance' }
    }

    return statusMap[resultCode] || { status: 'failed', message: 'Unknown error' }
  }
}

export const momoProvider = new MoMoProvider()