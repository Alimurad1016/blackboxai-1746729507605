const mongoose = require('mongoose');

const finishedProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxLength: [200, 'Product name cannot exceed 200 characters']
    },
    code: {
      type: String,
      required: [true, 'Product code is required'],
      trim: true,
      uppercase: true,
      maxLength: [20, 'Product code cannot exceed 20 characters']
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required']
    },
    description: {
      type: String,
      trim: true,
      maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    packaging: {
      type: {
        type: String,
        required: [true, 'Packaging type is required'],
        enum: {
          values: ['carton', 'box', 'bag', 'bottle', 'other'],
          message: '{VALUE} is not a valid packaging type'
        }
      },
      unitsPerPackage: {
        type: Number,
        required: [true, 'Units per package is required'],
        min: [1, 'Units per package must be at least 1']
      },
      weightPerUnit: {
        value: {
          type: Number,
          required: [true, 'Weight per unit is required'],
          min: [0, 'Weight cannot be negative']
        },
        unit: {
          type: String,
          required: [true, 'Weight unit is required'],
          enum: {
            values: ['g', 'kg', 'ml', 'l'],
            message: '{VALUE} is not a valid weight unit'
          }
        }
      }
    },
    inventory: {
      inStock: {
        pieces: {
          type: Number,
          default: 0,
          min: [0, 'Stock cannot be negative']
        },
        cartons: {
          type: Number,
          default: 0,
          min: [0, 'Cartons cannot be negative']
        }
      },
      minimum: {
        pieces: {
          type: Number,
          default: 0,
          min: [0, 'Minimum stock cannot be negative']
        },
        cartons: {
          type: Number,
          default: 0,
          min: [0, 'Minimum cartons cannot be negative']
        }
      }
    },
    pricing: {
      manufacturingCost: {
        type: Number,
        required: [true, 'Manufacturing cost is required'],
        min: [0, 'Cost cannot be negative']
      },
      sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Price cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'discontinued'],
        message: '{VALUE} is not a valid status'
      },
      default: 'active'
    },
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    quality: {
      standards: [{
        name: String,
        value: String,
        unit: String
      }],
      inspectionPoints: [{
        name: String,
        description: String,
        required: Boolean
      }]
    },
    storage: {
      conditions: {
        temperature: {
          min: Number,
          max: Number,
          unit: {
            type: String,
            enum: ['C', 'F'],
            default: 'C'
          }
        },
        humidity: {
          min: Number,
          max: Number,
          unit: {
            type: String,
            default: '%'
          }
        }
      },
      location: {
        warehouse: String,
        section: String,
        shelf: String
      }
    },
    notes: [{
      content: {
        type: String,
        required: true
      },
      author: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
finishedProductSchema.index({ code: 1, brand: 1 }, { unique: true });
finishedProductSchema.index({ brand: 1 });
finishedProductSchema.index({ category: 1 });
finishedProductSchema.index({ status: 1 });
finishedProductSchema.index({ 'inventory.inStock.pieces': 1 });

// Virtual for total pieces (including complete cartons)
finishedProductSchema.virtual('totalPieces').get(function() {
  return (
    this.inventory.inStock.pieces +
    this.inventory.inStock.cartons * this.packaging.unitsPerPackage
  );
});

// Virtual for total value
finishedProductSchema.virtual('totalValue').get(function() {
  return this.totalPieces * this.pricing.sellingPrice;
});

// Pre-save middleware
finishedProductSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  if (this.pricing.currency) {
    this.pricing.currency = this.pricing.currency.toUpperCase();
  }
  next();
});

// Instance method to check if reorder is needed
finishedProductSchema.methods.needsProduction = function() {
  const totalPieces = this.totalPieces;
  const minimumPieces =
    this.inventory.minimum.pieces +
    this.inventory.minimum.cartons * this.packaging.unitsPerPackage;
  return totalPieces <= minimumPieces;
};

// Instance method to get product summary
finishedProductSchema.methods.getSummary = function() {
  return {
    id: this._id,
    code: this.code,
    name: this.name,
    brand: this.brand,
    inStock: {
      pieces: this.inventory.inStock.pieces,
      cartons: this.inventory.inStock.cartons,
      total: this.totalPieces
    },
    value: this.totalValue,
    status: this.status
  };
};

// Static method to get low stock products
finishedProductSchema.statics.getLowStock = function() {
  return this.find({
    status: 'active',
    $expr: {
      $lte: [
        {
          $add: [
            '$inventory.inStock.pieces',
            {
              $multiply: [
                '$inventory.inStock.cartons',
                '$packaging.unitsPerPackage'
              ]
            }
          ]
        },
        {
          $add: [
            '$inventory.minimum.pieces',
            {
              $multiply: [
                '$inventory.minimum.cartons',
                '$packaging.unitsPerPackage'
              ]
            }
          ]
        }
      ]
    }
  }).populate('brand', 'name code');
};

const FinishedProduct = mongoose.model('FinishedProduct', finishedProductSchema);

module.exports = FinishedProduct;
