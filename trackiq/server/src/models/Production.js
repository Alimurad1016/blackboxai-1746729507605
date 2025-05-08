const mongoose = require('mongoose');

const productionItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  quantityUsed: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: true
  },
  wastage: {
    type: Number,
    default: 0,
    min: [0, 'Wastage cannot be negative']
  },
  cost: {
    type: Number,
    required: true,
    min: [0, 'Cost cannot be negative']
  }
});

const qualityCheckSchema = new mongoose.Schema({
  parameter: {
    type: String,
    required: true
  },
  expected: String,
  actual: String,
  status: {
    type: String,
    enum: ['passed', 'failed', 'warning'],
    required: true
  },
  notes: String,
  checkedBy: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const productionSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinishedProduct',
      required: true
    },
    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      required: true
    },
    status: {
      type: String,
      enum: {
        values: [
          'planned',
          'in-progress',
          'completed',
          'quality-check',
          'approved',
          'rejected'
        ],
        message: '{VALUE} is not a valid status'
      },
      default: 'planned'
    },
    quantity: {
      planned: {
        type: Number,
        required: true,
        min: [1, 'Planned quantity must be at least 1']
      },
      produced: {
        type: Number,
        default: 0,
        min: [0, 'Produced quantity cannot be negative']
      },
      rejected: {
        type: Number,
        default: 0,
        min: [0, 'Rejected quantity cannot be negative']
      }
    },
    schedule: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      actualStartDate: Date,
      actualEndDate: Date
    },
    materials: [productionItemSchema],
    costs: {
      materials: {
        type: Number,
        default: 0
      },
      labor: {
        type: Number,
        default: 0
      },
      overhead: {
        type: Number,
        default: 0
      },
      additional: [{
        description: String,
        amount: Number
      }],
      currency: {
        type: String,
        default: 'USD'
      }
    },
    qualityChecks: [qualityCheckSchema],
    staff: [{
      role: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      hours: Number
    }],
    machine: {
      name: String,
      code: String,
      hours: Number
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
    issues: [{
      type: {
        type: String,
        enum: ['material', 'quality', 'machine', 'staff', 'other'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
      },
      reportedBy: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      resolution: {
        action: String,
        by: String,
        date: Date
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
productionSchema.index({ batchNumber: 1 });
productionSchema.index({ brand: 1 });
productionSchema.index({ product: 1 });
productionSchema.index({ status: 1 });
productionSchema.index({ 'schedule.startDate': 1 });
productionSchema.index({ 'schedule.endDate': 1 });

// Virtual for total cost
productionSchema.virtual('totalCost').get(function() {
  const additionalCosts = this.costs.additional.reduce((sum, cost) => sum + cost.amount, 0);
  return this.costs.materials + this.costs.labor + this.costs.overhead + additionalCosts;
});

// Virtual for cost per unit
productionSchema.virtual('costPerUnit').get(function() {
  return this.quantity.produced > 0 ? this.totalCost / this.quantity.produced : 0;
});

// Virtual for efficiency
productionSchema.virtual('efficiency').get(function() {
  if (!this.quantity.produced) return 0;
  return ((this.quantity.produced - this.quantity.rejected) / this.quantity.produced) * 100;
});

// Pre-save middleware
productionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate batch number
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({
      batchNumber: new RegExp(`^${prefix}`)
    });
    this.batchNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  if (this.isModified('materials')) {
    // Calculate total material cost
    this.costs.materials = this.materials.reduce((sum, item) => sum + item.cost, 0);
  }

  if (this.isModified('staff')) {
    // Calculate labor cost (assuming a fixed rate per hour)
    const HOURLY_RATE = 15; // This should come from configuration
    this.costs.labor = this.staff.reduce((sum, person) => {
      return sum + (person.hours || 0) * HOURLY_RATE;
    }, 0);
  }

  next();
});

// Instance method to validate production completion
productionSchema.methods.validateCompletion = async function() {
  const issues = [];

  // Check quantities
  if (this.quantity.produced === 0) {
    issues.push('No production quantity recorded');
  }

  // Check quality checks
  const failedChecks = this.qualityChecks.filter(check => check.status === 'failed');
  if (failedChecks.length > 0) {
    issues.push(`${failedChecks.length} quality checks failed`);
  }

  // Check material usage
  const bom = await mongoose.model('BOM').findById(this.bom);
  if (bom) {
    const expectedMaterials = new Set(bom.materials.map(m => m.material.toString()));
    const usedMaterials = new Set(this.materials.map(m => m.material.toString()));
    
    if (expectedMaterials.size !== usedMaterials.size) {
      issues.push('Material usage does not match BOM specifications');
    }
  }

  return issues;
};

// Static method to get production summary by date range
productionSchema.statics.getProductionSummary = async function(startDate, endDate, brandId) {
  const match = {
    'schedule.startDate': { $gte: startDate },
    'schedule.endDate': { $lte: endDate }
  };
  if (brandId) match.brand = brandId;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$product',
        totalProduced: { $sum: '$quantity.produced' },
        totalRejected: { $sum: '$quantity.rejected' },
        totalCost: {
          $sum: {
            $add: ['$costs.materials', '$costs.labor', '$costs.overhead']
          }
        },
        batches: { $count: {} }
      }
    },
    {
      $lookup: {
        from: 'finishedproducts',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
};

const Production = mongoose.model('Production', productionSchema);

module.exports = Production;
