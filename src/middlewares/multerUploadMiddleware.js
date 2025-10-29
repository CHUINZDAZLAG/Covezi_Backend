import multer from 'multer'
import { LIMIT_COMMON_FILE_SIZE, ALLOW_COMMON_FILE_TYPES } from '~/utils/validators'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

/* ** Hầu hết những thứ bên dưới đều có ở docs của multer, chỉ là anh tổ chức lại sao cho khoa học và gọn
gàng nhất có thể
https://www.npmjs.com/package/multer
*/
// Function Kiểm tra loại file nào được chấp nhận
const customFileFilter = (req, file, callback) => {
  // For multer, check file we use mimetype
  console.log('[MULTER] File received:', { fieldname: file.fieldname, originalname: file.originalname, mimetype: file.mimetype, size: file.size })
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Only accept jpg, jpeg and png'
    console.error('[MULTER] File type rejected:', file.mimetype)
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }
  // If file is valid
  console.log('[MULTER] File accepted')
  return callback(null, true)
}

// Initialize function upload coverd by multer
const upload = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})

// Wrapper for uploadAny to add logging - accepts any file fields including coverImage
const uploadAnyWithLogging = () => {
  console.log('[MULTER_INIT] uploadAnyWithLogging function created - USING FIELDS METHOD')
  return (req, res, next) => {
    console.log('═══════════════════════════════════════')
    console.log('[MULTER] uploadAny middleware called - NEW VERSION WITH FIELDS')
    console.log('[MULTER] URL:', req.url)
    console.log('[MULTER] Method:', req.method)
    console.log('[MULTER] Content-Type:', req.headers['content-type'])
    console.log('[MULTER] Content-Length:', req.headers['content-length'])
    console.log('═══════════════════════════════════════')
    
    // Use fields() to properly handle coverImage field and other fields
    upload.fields([{ name: 'coverImage' }, { name: 'images', maxCount: 10 }])(req, res, (err) => {
      console.log('═══════════════════════════════════════')
      console.log('[MULTER] uploadAny completed')
      console.log('[MULTER] req.files exists:', !!req.files)
      if (req.files) {
        console.log('[MULTER] req.files keys:', Object.keys(req.files))
        Object.keys(req.files).forEach(key => {
          const files = req.files[key]
          if (Array.isArray(files)) {
            console.log(`[MULTER] Field "${key}" (array):`, files.map(f => ({
              fieldname: f.fieldname,
              originalname: f.originalname,
              mimetype: f.mimetype,
              size: f.size
            })))
          } else {
            console.log(`[MULTER] File "${key}":`, {
              fieldname: files.fieldname,
              originalname: files.originalname,
              encoding: files.encoding,
              mimetype: files.mimetype,
              size: files.size
            })
          }
        })
      }
      console.log('[MULTER] req.body keys:', Object.keys(req.body))
      console.log('═══════════════════════════════════════')
      
      if (err) {
        console.error('[MULTER] Error:', err.message)
        return next(err)
      }
      next()
    })
  }
}

// Export different upload methods
export const multerUploadMiddleware = { 
  upload,
  uploadSingle: (fieldName) => upload.single(fieldName),
  uploadMultiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  uploadFields: (fields) => upload.fields(fields),
  // Upload with any field names but allow text fields to pass through
  uploadAny: () => uploadAnyWithLogging()
}