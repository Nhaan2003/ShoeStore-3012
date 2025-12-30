const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productAdminController = require('../../controllers/admin/product.admin.controller');
const productValidator = require('../../validators/product.validator');
const validationMiddleware = require('../../middlewares/validation.middleware');
const upload = require('../../config/multer');

router.post('/',
  productValidator.createProduct,
  validationMiddleware,
  productAdminController.createProduct
);

router.put('/:productId',
  productValidator.updateProduct,
  validationMiddleware,
  productAdminController.updateProduct
);

router.delete('/:productId',
  productAdminController.deleteProduct
);

router.post('/:productId/images',
  upload.array('images', 10),
  productAdminController.uploadProductImages
);

router.put('/variants/:variantId/stock',
  [
    body('stock_quantity').isInt({ min: 0 }),
    body('adjustment_type').isIn(['set', 'increase', 'decrease']),
    body('reason').notEmpty()
  ],
  validationMiddleware,
  productAdminController.updateVariantStock
);

router.post('/bulk-update',
  productAdminController.bulkUpdateProducts
);

router.get('/export',
  productAdminController.exportProducts
);

module.exports = router;