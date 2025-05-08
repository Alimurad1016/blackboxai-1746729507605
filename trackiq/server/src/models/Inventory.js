const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: {
      values: ['in', 'out', 'adjustment', 'production-use', 'production-output'],
      message: '{VALUE} is not a valid transaction type'
    },
    required: true
  },
  itemType: {
    type: String,
    enum: {
      values: ['raw-material', 'finished-product'],
      message: '{VALUE} is not a valid item type'
    },
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  quantity: {
    value: {
      type: Number,
      required: true,
      validate: {
        validator: function(v) {
          return v !== 0;
        },
        message: 'Quantity cannot be zero'
      }
    },
    unit: {
      type: String,
      required: true
    }
  },
  reference: {
    type: {
      type: String,
      enum: ['production', 'purchase', 'sale', 'return', 'adjustment', 'transfer'],
      required: true
    },
    number: {
      type: String,
      required: true
    }
  },
  batch: {
    number: String,
    expiryDate: Date,
    manufacturingDate: Date
  },
  location: {
    from: {
      warehouse: String,
      section: String,
      shelf: String,
      bin: String
    },
    to: {
      warehouse: String,
      section: String,
      shelf: String,
      bin: String
    }
  },
  cost: {
    perUnit: Number,
    total: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  qualityCheck: {
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    checkedBy: String,
    date: Date,
    notes: String
  },
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  performedBy: {
    type: String,
    required: true
  },
  approvedBy: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const inventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: {
        values: ['raw-material', 'finished-product'],
        message: '{VALUE} is not a valid item type'
      },
      required: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'itemType',
      required: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
    },
    currentStock: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        required: true
      }
    },
    batches: [{
      number: String,
      quantity: Number,
      manufacturingDate: Date,
      expiryDate: Date,
      location: {
        warehouse: String,
        section: String,
        shelf: String,
        bin: String
      }
    }],
    value: {
      average: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    limits: {
      minimum: {
        type: Number,
        default: 0
      },
      maximum: {
        type: Number,
        default: 0
      },
      reorderPoint: {
        type: Number,
        default: 0
      }
    },
    transactions: [inventoryTransactionSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
inventorySchema.index({ itemType: 1, item: 1, brand: 1 }, { unique: true });
inventorySchema.index({ brand: 1 });
inventorySchema.index({ 'currentStock.value': 1 });
inventorySchema.index({ 'batches.expiryDate': 1 });

// Virtual for item details
inventorySchema.virtual('itemDetails', {
  ref: function() {
    return this.itemType === 'raw-material' ? 'RawMaterial' : 'FinishedProduct';
  },
  localField: 'item',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update value calculations
inventorySchema.pre('save', function(next) {
  if (this.isModified('transactions')) {
    // Calculate new average value
    const totalValue = this.transactions.reduce((sum, trans) => {
      if (trans.cost && trans.cost.total) {
        return sum + trans.cost.total;
      }
      return sum;
    }, 0);

    const totalQuantity = this.transactions.reduce((sum, trans) => {
      if (trans.type === 'in' || trans.type === 'production-output') {
        return sum + trans.quantity.value;
      }
      return sum;
    }, 0);

    if (totalQuantity > 0) {
      this.value.average = totalValue / totalQuantity;
    }

    // Update total value
    this.value.total = this.currentStock.value * this.value.average;
    this.value.lastUpdated = new Date();
  }
  next();
});

// Instance method to add a transaction
inventorySchema.methods.addTransaction = async function(transactionData) {
  // Validate transaction
  if (!transactionData.quantity || !transactionData.type) {
    throw new Error('Invalid transaction data');
  }

  // Calculate new stock level
  let newStock = this.currentStock.value;
  if (['in', 'production-output'].includes(transactionData.type)) {
    newStock += transactionData.quantity.value;
  } else if (['out', 'production-use'].includes(transactionData.type)) {
    newStock -= transactionData.quantity.value;
  } else if (transactionData.type === 'adjustment') {
    newStock = transactionData.quantity.value;
  }

  // Validate stock level
  if (newStock < 0) {
    throw new Error('Insufficient stock');
  }

  // Add transaction
  this.transactions.push(transactionData);
  this.currentStock.value = newStock;

  // Save changes
  return this.save();
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function(brandId) {
  return this.find({
    brand: brandId,
    $expr: {
      $lte: ['$currentStock.value', '$limits.reorderPoint']
    }
  }).populate('itemDetails');
};

// Static method to get inventory value by brand
inventorySchema.statics.getInventoryValue = async function(brandId) {
  const result = await this.aggregate([
    { $match: { brand: mongoose.Types.ObjectId(brandId) } },
    {
      $group: {
        _id: '$itemType',
        totalValue: { $sum: '$value.total' }
      }
    }
  ]);

  return {
    rawMaterials: result.find(r => r._id === 'raw-material')?.totalValue || 0,
    finishedProducts: result.find(r => r._id === 'finished-product')?.totalValue || 0
  };
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
