// Generate random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store PIN temporarily (in production, use Redis or database with TTL)
// For now, we'll store PIN in user document and validate with timestamp
const createPINRecord = (pin, expiryMinutes = 10) => {
  return {
    pin,
    expiryTime: Date.now() + (expiryMinutes * 60 * 1000),
    attempts: 0,
    maxAttempts: 5
  }
}

// Check if PIN is still valid and matches
const validatePIN = (storedPINRecord, inputPIN) => {
  if (!storedPINRecord) {
    return {
      valid: false,
      message: 'No PIN record found'
    }
  }

  // Check if PIN has expired
  if (Date.now() > storedPINRecord.expiryTime) {
    return {
      valid: false,
      message: 'PIN has expired. Please register again.'
    }
  }

  // Check if max attempts exceeded
  if (storedPINRecord.attempts >= storedPINRecord.maxAttempts) {
    return {
      valid: false,
      message: 'Maximum PIN attempts exceeded. Please register again.'
    }
  }

  // Check if PIN matches
  if (storedPINRecord.pin !== inputPIN) {
    return {
      valid: false,
      message: 'PIN is incorrect',
      remainingAttempts: storedPINRecord.maxAttempts - storedPINRecord.attempts - 1
    }
  }

  return {
    valid: true,
    message: 'PIN is valid'
  }
}

// Increment failed attempts
const incrementPINAttempts = (storedPINRecord) => {
  return {
    ...storedPINRecord,
    attempts: storedPINRecord.attempts + 1
  }
}

export const PINVerificationHelper = {
  generatePIN,
  createPINRecord,
  validatePIN,
  incrementPINAttempts
}
