const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    // Ensure Cloudinary credentials exist
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Convert buffer to base64 string for Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'veridax/campaigns',
      use_filename: true,
      unique_filename: true,
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageURL: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    const message = error?.message || 'Failed to upload image';
    res.status(500).json({
      success: false,
      message
    });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
