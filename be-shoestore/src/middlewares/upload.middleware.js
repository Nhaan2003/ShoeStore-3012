const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDirs = ['uploads', 'uploads/products', 'uploads/avatars', 'uploads/brands', 'uploads/categories'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Cấu hình storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        
        // Xác định thư mục dựa trên route
        if (req.baseUrl.includes('products')) {
            uploadPath = 'uploads/products/';
        } else if (req.baseUrl.includes('users') || req.baseUrl.includes('auth')) {
            uploadPath = 'uploads/avatars/';
        } else if (req.baseUrl.includes('brands')) {
            uploadPath = 'uploads/brands/';
        } else if (req.baseUrl.includes('categories')) {
            uploadPath = 'uploads/categories/';
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Lọc file - chỉ cho phép ảnh
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'), false);
    }
};

// Config cho upload ảnh sản phẩm (nhiều ảnh)
const uploadProductImages = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        files: 10 // Tối đa 10 ảnh
    },
    fileFilter: imageFilter
});

// Config cho upload ảnh đơn (avatar, logo...)
const uploadSingleImage = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
    },
    fileFilter: imageFilter
});

// Middleware xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn. Kích thước tối đa là 5MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Số lượng file vượt quá giới hạn cho phép'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

// Hàm xóa file
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

module.exports = {
    uploadProductImages,
    uploadSingleImage,
    handleMulterError,
    deleteFile
};
