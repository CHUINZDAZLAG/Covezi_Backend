// MongoDB ObjectId validation pattern (24-character hexadecimal string)
export const OBJECT_ID_RULE = /^[0-9a-fA-F]{24}$/
export const OBJECT_ID_RULE_MESSAGE = 'Your string fails to match the Object Id pattern!'

// Regular expressions and custom validation messages for form validation
export const FIELD_REQUIRED_MESSAGE = 'This field is required.'

// Email validation pattern (basic format: user@domain.extension)
export const EMAIL_RULE = /^\S+@\S+\.\S+$/
export const EMAIL_RULE_MESSAGE = 'Email is invalid. (example@gmail.com)'

// Password strength requirements: at least 1 letter, 1 number, 8-256 characters
export const PASSWORD_RULE = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d\W]{8,256}$/
export const PASSWORD_RULE_MESSAGE = 'Password must include at least 1 letter, a number, and at least 8 characters.'
export const PASSWORD_CONFIRMATION_MESSAGE = 'Password Confirmation does not match!'

// File upload constraints for security and performance
export const LIMIT_COMMON_FILE_SIZE = 10485760 // 10 MB in bytes
export const ALLOW_COMMON_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']