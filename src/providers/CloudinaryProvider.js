import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '~/config/environment'

/*
Reference documentation:
https://cloudinary.com/blog/node_js_file_upload_to_a_local_server_or_to_the_cloud
*/

// Configure Cloudinary v2 with environment credentials
const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  // Add timeout configuration for API requests
  api_request_timeout: 30000, // 30 seconds
  secure: true
})

// Stream-based file upload to Cloudinary cloud storage with timeout
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    let uploadTimeout
    let uploadCompleted = false

    try {
      // Set 30-second timeout for upload
      uploadTimeout = setTimeout(() => {
        if (!uploadCompleted) {
          uploadCompleted = true
          const timeoutErr = new Error('Cloudinary upload timeout - request exceeded 30 seconds')
          timeoutErr.statusCode = 504
          reject(timeoutErr)
        }
      }, 30000)

      // Create upload stream with target folder configuration
      const stream = cloudinaryV2.uploader.upload_stream(
        { 
          folder: folderName,
          timeout: 30000,
          resource_type: 'auto'
        },
        (err, result) => {
          uploadCompleted = true
          clearTimeout(uploadTimeout)
          
          if (err) {
            console.error('[CloudinaryProvider] Upload error:', err?.message)
            reject(err)
          } else {
            console.log('[CloudinaryProvider] Upload successful:', { 
              publicId: result.public_id, 
              size: result.bytes 
            })
            resolve(result)
          }
        }
      )

      // Handle stream errors
      stream.on('error', (streamErr) => {
        if (!uploadCompleted) {
          uploadCompleted = true
          clearTimeout(uploadTimeout)
          console.error('[CloudinaryProvider] Stream error:', streamErr?.message)
          reject(streamErr)
        }
      })

      // Execute upload by piping file buffer through streamifier
      streamifier.createReadStream(fileBuffer).pipe(stream)
    } catch (error) {
      clearTimeout(uploadTimeout)
      console.error('[CloudinaryProvider] Stream creation error:', error?.message)
      reject(error)
    }
  })
}

export const CloudinaryProvider = { streamUpload }