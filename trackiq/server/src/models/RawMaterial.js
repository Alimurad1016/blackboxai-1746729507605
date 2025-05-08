const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
      maxLength: [200, 'Material name cannot exceed 200 characters']
    },
    code: {
      type: String,
      required: [true, 'Material code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      maxLength: [20, 'Material code cannot exceed 20 characters']
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required']
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      enum: {
        values: ['kg', 'g', 'l', 'ml', 'pieces', 'boxes', 'rolls', 'meters'],
        message: '{VALUE} is not a supported unit'
      }
    },
    stock: {
      current: {
        type: Number,
        default: 0,
        min: [0, 'Stock cannot be negative']
      },
      minimum: {
        type: Number,
        default: 0,
        min: [0, 'Minimum stock cannot be negative']
      },
      maximum: {
        type: Number,
        default: 0,
        min: [0, 'Maximum stock cannot be negative']
      }
    },
    pricing: {
      costPerUnit: {
        type: Number,
        required: [true, 'Cost per unit is required'],
        min: [0, 'Cost cannot be negative']
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
    supplier: {
      name: {
        type: String,
        trim: true
      },
      contact: {
        email: {
          type: String,
          trim: true,
          lowercase: true,
          match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
          ]
        },
        phone: {
          type: String,
          trim: true
        }
      },
      leadTime: {
        type: Number,
        min: [0, 'Lead time cannot be negative'],
        default: 0
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
    location: {
      warehouse: String,
      section: String,
      shelf: String,
      bin: String
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
    }],
    metadata: {
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
rawMaterialSchema.index({ code: 1 });
rawMaterialSchema.index({ brand: 1 });
rawMaterialSchema.index({ category: 1 });
rawMaterialSchema.index({ status: 1 });
rawMaterialSchema.index({ 'stock.current': 1 });

// Virtual for total value
rawMaterialSchema.virtual('totalValue').get(function() {
  return this.stock.current * this.pricing.costPerUnit;
});

// Pre-save middleware
rawMaterialSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  if (this.pricing.currency) {
    this.pricing.currency = this.pricing.currency.toUpperCase();
  }
  next();
});

// Instance method to check if reorder is needed
rawMaterialSchema.methods.needsReorder = function() {
  return this.stock.current <= this.stock.minimum;
};

// Instance method to get material summary
rawMaterialSchema.methods.getSummary = function() {
  return {
    id: this._id,
    code: this.code,
    name: this.name,
    currentStock: this.stock.current,
    unit: this.unit,
    value: this.totalValue,
    status: this.status
  };
};

// Static method to get low stock materials
rawMaterialSchema.statics.getLowStock = function() {
  return this.find({
    status: 'active',
    $expr: {
      $lte: ['$stock.current', '$stock.minimum']
    }
  }).populate('brand', 'name code');
};

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);

module.exports = RawMaterial;
