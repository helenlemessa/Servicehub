// backend/middleware/upload.js - COMPLETELY FIXED
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Storage for images using Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    // Map common extensions to Cloudinary formats
    let format = 'jpg';
    if (ext === '.png') format = 'png';
    if (ext === '.gif') format = 'gif';
    if (ext === '.webp') format = 'webp';
    if (ext === '.avif') format = 'avif';
    if (ext === '.bmp') format = 'bmp';
    if (ext === '.svg') format = 'svg';
    
    return {
      folder: 'service-marketplace/images',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
      format: format
    };
  },
});

// Improved file filter - accept all common image formats
const fileFilter = (req, file, cb) => {
  console.log('Uploading file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });
  
  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Allowed extensions and mime types
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg'];
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/avif', 'image/bmp', 'image/svg+xml'
  ];
  
  const isValidByExt = allowedExtensions.includes(ext);
  const isValidByMime = allowedMimeTypes.includes(file.mimetype);
  
  if (isValidByExt || isValidByMime) {
    cb(null, true);
  } else {
    console.log(`Rejected file: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Only image files are allowed. Received: ${file.originalname} (${file.mimetype})`), false);
  }
};

// Multer instance for images
const uploadImages = multer({ 
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Memory storage for media (voice, files)
const uploadMedia = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'];
    const allowedVoiceMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    const allowedFileMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    // Also check extensions for files
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedDocExt = ['.pdf', '.doc', '.docx', '.txt'];
    
    if (allowedImageMimes.includes(file.mimetype) || 
        allowedVoiceMimes.includes(file.mimetype) || 
        allowedFileMimes.includes(file.mimetype) ||
        allowedDocExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, audio, PDF, Word, TXT'), false);
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, type) => {
  return new Promise((resolve, reject) => {
    let uploadOptions = {
      folder: `service-marketplace/${type}s`,
    };
    
    if (type === 'image') {
      uploadOptions.transformation = [{ width: 800, height: 800, crop: 'limit' }];
    } else if (type === 'voice') {
      uploadOptions.resource_type = 'auto';
      uploadOptions.format = 'mp3';
    } else {
      uploadOptions.resource_type = 'raw';
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
    
    uploadStream.end(file.buffer);
  });
};

module.exports = { 
  uploadImages, 
  uploadMedia, 
  uploadToCloudinary 
};