const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true,
      maxLength: [100, 'Brand name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Brand code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      maxLength: [10, 'Brand code cannot exceed 10 characters']
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid status'
      },
      default: 'active'
    },
    logo: {
      type: String,
      trim: true
    },
    contactPerson: {
      name: {
        type: String,
        trim: true
      },
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
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
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
brandSchema.index({ name: 1 });
brandSchema.index({ code: 1 });
brandSchema.index({ status: 1 });

// Virtual for getting the total number of products
brandSchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brand',
  count: true
});

// Pre-save middleware to convert brand code to uppercase
brandSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Instance method to get brand summary
brandSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    status: this.status,
    productsCount: this.productsCount || 0
  };
};

// Static method to get active brands
brandSchema.statics.getActiveBrands = function() {
  return this.find({ status: 'active' })
    .select('name code status')
    .sort('name');
};

// Compound index for unique brand code per status
brandSchema.index({ code: 1, status: 1 }, { unique: true });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
