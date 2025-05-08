const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStats
} = require('../controllers/brandController');
const {
  protect,
  checkPermission
} = require('../middleware/authMiddleware');
const {
  brandValidation,
  queryValidation
} = require('../middleware/validationMiddleware');

// Protect all routes
router.use(protect);

// Routes with pagination
router.get(
  '/',
  queryValidation.pagination,
  checkPermission('brands', 'view'),
  getBrands
);

// Individual routes
router
  .route('/')
  .post(
    checkPermission('brands', 'create'),
    brandValidation.create,
    createBrand
  );

router
  .route('/:id')
  .get(
    checkPermission('brands', 'view'),
    getBrand
  )
  .put(
    checkPermission('brands', 'edit'),
    brandValidation.update,
    updateBrand
  )
  .delete(
    checkPermission('brands', 'delete'),
    deleteBrand
  );

// Statistics route
router.get(
  '/:id/stats',
  checkPermission('brands', 'view'),
  getBrandStats
);

module.exports = router;
