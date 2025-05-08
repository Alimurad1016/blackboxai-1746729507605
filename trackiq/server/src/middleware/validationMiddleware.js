const { validationResult, body, param, query } = require('express-validator');

/**
 * Process validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(
      JSON.stringify({
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      })
    );
  }
  next();
};

/**
 * Brand validation rules
 */
const brandValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Brand name is required')
      .isLength({ max: 100 })
      .withMessage('Brand name cannot exceed 100 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Brand code is required')
      .isLength({ max: 10 })
      .withMessage('Brand code cannot exceed 10 characters')
      .matches(/^[A-Za-z0-9-]+$/)
      .withMessage('Brand code can only contain letters, numbers, and hyphens'),
    validate
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid brand ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Brand name cannot exceed 100 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage('Brand code cannot exceed 10 characters')
      .matches(/^[A-Za-z0-9-]+$/)
      .withMessage('Brand code can only contain letters, numbers, and hyphens'),
    validate
  ]
};

/**
 * Raw Material validation rules
 */
const rawMaterialValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Material name is required')
      .isLength({ max: 200 })
      .withMessage('Material name cannot exceed 200 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Material code is required')
      .isLength({ max: 20 })
      .withMessage('Material code cannot exceed 20 characters'),
    body('brand')
      .isMongoId()
      .withMessage('Invalid brand ID'),
    body('unit')
      .isIn(['kg', 'g', 'l', 'ml', 'pieces', 'boxes', 'rolls', 'meters'])
      .withMessage('Invalid unit of measurement'),
    body('stock.minimum')
      .isFloat({ min: 0 })
      .withMessage('Minimum stock must be a positive number'),
    body('pricing.costPerUnit')
      .isFloat({ min: 0 })
      .withMessage('Cost per unit must be a positive number'),
    validate
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid material ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Material name cannot exceed 200 characters'),
    body('pricing.costPerUnit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost per unit must be a positive number'),
    validate
  ]
};

/**
 * Finished Product validation rules
 */
const finishedProductValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 200 })
      .withMessage('Product name cannot exceed 200 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Product code is required')
      .isLength({ max: 20 })
      .withMessage('Product code cannot exceed 20 characters'),
    body('brand')
      .isMongoId()
      .withMessage('Invalid brand ID'),
    body('packaging.type')
      .isIn(['carton', 'box', 'bag', 'bottle', 'other'])
      .withMessage('Invalid packaging type'),
    body('packaging.unitsPerPackage')
      .isInt({ min: 1 })
      .withMessage('Units per package must be at least 1'),
    validate
  ]
};

/**
 * BOM validation rules
 */
const bomValidation = {
  create: [
    body('product')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('brand')
      .isMongoId()
      .withMessage('Invalid brand ID'),
    body('batchSize.quantity')
      .isInt({ min: 1 })
      .withMessage('Batch size must be at least 1'),
    body('batchSize.unit')
      .isIn(['pieces', 'cartons'])
      .withMessage('Invalid batch size unit'),
    body('materials.*.material')
      .isMongoId()
      .withMessage('Invalid material ID'),
    body('materials.*.quantity')
      .isFloat({ min: 0 })
      .withMessage('Material quantity must be a positive number'),
    validate
  ]
};

/**
 * Production validation rules
 */
const productionValidation = {
  create: [
    body('product')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('brand')
      .isMongoId()
      .withMessage('Invalid brand ID'),
    body('bom')
      .isMongoId()
      .withMessage('Invalid BOM ID'),
    body('quantity.planned')
      .isInt({ min: 1 })
      .withMessage('Planned quantity must be at least 1'),
    body('schedule.startDate')
      .isISO8601()
      .withMessage('Invalid start date'),
    body('schedule.endDate')
      .isISO8601()
      .withMessage('Invalid end date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.schedule.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    validate
  ]
};

/**
 * Inventory validation rules
 */
const inventoryValidation = {
  transaction: [
    body('type')
      .isIn(['in', 'out', 'adjustment', 'production-use', 'production-output'])
      .withMessage('Invalid transaction type'),
    body('itemType')
      .isIn(['raw-material', 'finished-product'])
      .withMessage('Invalid item type'),
    body('item')
      .isMongoId()
      .withMessage('Invalid item ID'),
    body('quantity.value')
      .isFloat({ min: 0 })
      .withMessage('Quantity must be a positive number'),
    body('reference.type')
      .isIn(['production', 'purchase', 'sale', 'return', 'adjustment', 'transfer'])
      .withMessage('Invalid reference type'),
    validate
  ]
};

/**
 * User validation rules
 */
const userValidation = {
  create: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('role')
      .isIn(['admin', 'manager', 'supervisor', 'operator', 'viewer'])
      .withMessage('Invalid role'),
    validate
  ],
  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ]
};

/**
 * Common query parameter validation rules
 */
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate
  ],
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    validate
  ]
};

module.exports = {
  brandValidation,
  rawMaterialValidation,
  finishedProductValidation,
  bomValidation,
  productionValidation,
  inventoryValidation,
  userValidation,
  queryValidation
};
