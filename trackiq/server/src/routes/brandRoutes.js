const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getBrands)
  .post(authorize('admin'), createBrand);

router
  .route('/:id')
  .get(getBrand)
  .put(authorize('admin'), updateBrand)
  .delete(authorize('admin'), deleteBrand);

module.exports = router;
