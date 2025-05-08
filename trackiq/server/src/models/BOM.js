const mongoose = require('mongoose');

const bomItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: [true, 'Raw material is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['kg', 'g', 'l', 'ml', 'pieces', 'boxes', 'rolls', 'meters'],
      message: '{VALUE} is not a supported unit'
    }
  },
  wastagePercent: {
    type: Number,
    default: 0,
    min: [0, 'Wastage percentage cannot be negative'],
    max: [100, 'Wastage percentage cannot exceed 100']
  },
  notes: String
});

const bomSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinishedProduct',
      required: [true, 'Product is required']
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required']
    },
    version: {
      type: String,
      required: [true, 'Version number is required'],
      default: '1.0'
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'archived'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft'
    },
    batchSize: {
      quantity: {
        type: Number,
        required: [true, 'Batch size quantity is required'],
        min: [1, 'Batch size must be at least 1']
      },
      unit: {
        type: String,
        required: [true, 'Batch size unit is required'],
        enum: {
          values: ['pieces', 'cartons'],
          message: '{VALUE} is not a valid batch size unit'
        }
      }
    },
    materials: [bomItemSchema],
    processSteps: [{
      stepNumber: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['minutes', 'hours'],
          default: 'minutes'
        }
      },
      qualityChecks: [{
        name: String,
        description: String,
        required: Boolean
      }]
    }],
    costings: {
      materialCost: {
        type: Number,
        default: 0
      },
      laborCost: {
        type: Number,
        default: 0
      },
      overheadCost: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    approvals: [{
      stage: {
        type: String,
        enum: ['draft', 'review', 'approved'],
        required: true
      },
      approver: {
        name: String,
        role: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      },
      comments: String
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
bomSchema.index({ product: 1, brand: 1, version: 1 }, { unique: true });
bomSchema.index({ brand: 1 });
bomSchema.index({ status: 1 });

// Virtual for total cost per unit
bomSchema.virtual('costPerUnit').get(function() {
  const totalCost = 
    this.costings.materialCost + 
    this.costings.laborCost + 
    this.costings.overheadCost;
  return this.batchSize.quantity > 0 ? totalCost / this.batchSize.quantity : 0;
});

// Pre-save middleware to calculate material costs
bomSchema.pre('save', async function(next) {
  if (this.isModified('materials')) {
    let totalMaterialCost = 0;
    
    // Populate materials to get current costs
    const populatedBOM = await this.populate('materials.material');
    
    for (const item of this.materials) {
      const material = item.material;
      if (material && material.pricing) {
        const quantity = item.quantity * (1 + item.wastagePercent / 100);
        totalMaterialCost += quantity * material.pricing.costPerUnit;
      }
    }
    
    this.costings.materialCost = totalMaterialCost;
  }
  next();
});

// Instance method to calculate materials needed for a production quantity
bomSchema.methods.calculateMaterialsNeeded = function(productionQuantity) {
  const scaleFactor = productionQuantity / this.batchSize.quantity;
  
  return this.materials.map(item => ({
    material: item.material,
    quantity: item.quantity * scaleFactor * (1 + item.wastagePercent / 100),
    unit: item.unit
  }));
};

// Instance method to validate material availability
bomSchema.methods.validateMaterialAvailability = async function(productionQuantity) {
  const materialsNeeded = this.calculateMaterialsNeeded(productionQuantity);
  const shortages = [];

  for (const need of materialsNeeded) {
    const material = await mongoose.model('RawMaterial').findById(need.material);
    if (!material) {
      shortages.push({
        material: need.material,
        required: need.quantity,
        available: 0,
        unit: need.unit
      });
      continue;
    }

    if (material.stock.current < need.quantity) {
      shortages.push({
        material: material._id,
        name: material.name,
        required: need.quantity,
        available: material.stock.current,
        unit: need.unit
      });
    }
  }

  return shortages;
};

// Static method to get active BOMs for a brand
bomSchema.statics.getActiveBOMsByBrand = function(brandId) {
  return this.find({
    brand: brandId,
    status: 'active'
  })
    .populate('product', 'name code')
    .populate('materials.material', 'name code stock.current');
};

const BOM = mongoose.model('BOM', bomSchema);

module.exports = BOM;
