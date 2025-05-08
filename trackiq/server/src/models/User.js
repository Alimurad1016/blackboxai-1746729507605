const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    enum: [
      'brands',
      'raw-materials',
      'finished-products',
      'bom',
      'production',
      'inventory',
      'reports',
      'users',
      'settings'
    ],
    required: true
  },
  actions: [{
    type: String,
    enum: ['view', 'create', 'edit', 'delete', 'approve'],
    required: true
  }]
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'supervisor', 'operator', 'viewer'],
        message: '{VALUE} is not a valid role'
      },
      required: [true, 'Role is required']
    },
    permissions: [permissionSchema],
    profile: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      department: String,
      position: String,
      avatar: String
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended'],
        message: '{VALUE} is not a valid status'
      },
      default: 'active'
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
      },
      language: {
        type: String,
        default: 'en'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        }
      }
    },
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password was changed after a certain time
userSchema.methods.changedPasswordAfter = function(timestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return timestamp < changedTimestamp;
  }
  return false;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Method to check permissions
userSchema.methods.hasPermission = function(module, action) {
  if (this.role === 'admin') return true;

  const modulePermissions = this.permissions.find(p => p.module === module);
  return modulePermissions ? modulePermissions.actions.includes(action) : false;
};

// Static method to get default permissions for a role
userSchema.statics.getDefaultPermissions = function(role) {
  const permissions = {
    admin: [
      { module: 'brands', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'raw-materials', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'finished-products', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'bom', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'production', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'inventory', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'reports', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'users', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'settings', actions: ['view', 'edit'] }
    ],
    manager: [
      { module: 'brands', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'raw-materials', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'finished-products', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'bom', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'production', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'inventory', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'reports', actions: ['view', 'create'] }
    ],
    supervisor: [
      { module: 'raw-materials', actions: ['view', 'create', 'edit'] },
      { module: 'finished-products', actions: ['view', 'edit'] },
      { module: 'bom', actions: ['view', 'edit'] },
      { module: 'production', actions: ['view', 'create', 'edit'] },
      { module: 'inventory', actions: ['view', 'create', 'edit'] },
      { module: 'reports', actions: ['view'] }
    ],
    operator: [
      { module: 'raw-materials', actions: ['view'] },
      { module: 'finished-products', actions: ['view'] },
      { module: 'bom', actions: ['view'] },
      { module: 'production', actions: ['view', 'create'] },
      { module: 'inventory', actions: ['view'] }
    ],
    viewer: [
      { module: 'raw-materials', actions: ['view'] },
      { module: 'finished-products', actions: ['view'] },
      { module: 'bom', actions: ['view'] },
      { module: 'production', actions: ['view'] },
      { module: 'inventory', actions: ['view'] },
      { module: 'reports', actions: ['view'] }
    ]
  };

  return permissions[role] || [];
};

const User = mongoose.model('User', userSchema);

module.exports = User;
