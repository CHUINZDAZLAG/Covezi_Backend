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
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Only accept jpg, jpeg and png'
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }
  // If file is valid
  return callback(null, true)
}

// Initialize function upload coverd by multer
const upload = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})

// Export different upload methods
export const multerUploadMiddleware = { 
  upload,
  uploadSingle: (fieldName) => upload.single(fieldName),
  uploadMultiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  uploadFields: (fields) => upload.fields(fields),
  // Upload with any field names but allow text fields to pass through
  uploadAny: () => upload.any()
}