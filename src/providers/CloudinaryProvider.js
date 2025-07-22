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
  api_secret: env.CLOUDINARY_API_SECRET
})

// Stream-based file upload to Cloudinary cloud storage
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    // Create upload stream with target folder configuration
    const stream = cloudinaryV2.uploader.upload_stream({ folder: folderName }, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })

    // Execute upload by piping file buffer through streamifier
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

export const CloudinaryProvider = { streamUpload }