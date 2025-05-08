require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const Brand = require('../models/Brand');
const RawMaterial = require('../models/RawMaterial');
const FinishedProduct = require('../models/FinishedProduct');

// Sample data
const users = [
  {
    username: 'admin',
    email: 'admin@trackiq.com',
    password: 'Admin@123',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      department: 'Administration',
      position: 'System Administrator'
    }
  },
  {
    username: 'manager',
    email: 'manager@trackiq.com',
    password: 'Manager@123',
    role: 'manager',
    profile: {
      firstName: 'Production',
      lastName: 'Manager',
      department: 'Production',
      position: 'Production Manager'
    }
  }
];

const brands = [
  {
    name: 'EcoFresh Foods',
    code: 'ECO-001',
    description: 'Organic food products manufacturer',
    status: 'active',
    contactPerson: {
      name: 'John Smith',
      email: 'john@ecofresh.com',
      phone: '+1-555-0123'
    }
  },
  {
    name: 'Pure Naturals',
    code: 'PURE-001',
    description: 'Natural cosmetics manufacturer',
    status: 'active',
    contactPerson: {
      name: 'Sarah Johnson',
      email: 'sarah@purenaturals.com',
      phone: '+1-555-0124'
    }
  }
];

const rawMaterials = [
  {
    name: 'Organic Wheat Flour',
    code: 'RM-001',
    description: 'Premium organic wheat flour',
    category: 'Grains',
    unit: 'kg',
    stock: {
      current: 1000,
      minimum: 100,
      maximum: 5000
    },
    pricing: {
      costPerUnit: 2.5,
      currency: 'USD'
    }
  },
  {
    name: 'Natural Coconut Oil',
    code: 'RM-002',
    description: 'Cold-pressed coconut oil',
    category: 'Oils',
    unit: 'l',
    stock: {
      current: 500,
      minimum: 50,
      maximum: 2000
    },
    pricing: {
      costPerUnit: 8.0,
      currency: 'USD'
    }
  }
];

const finishedProducts = [
  {
    name: 'Organic Whole Wheat Bread',
    code: 'FP-001',
    description: 'Freshly baked organic whole wheat bread',
    category: 'Bakery',
    packaging: {
      type: 'box',
      unitsPerPackage: 1,
      weightPerUnit: {
        value: 500,
        unit: 'g'
      }
    },
    inventory: {
      inStock: {
        pieces: 100,
        cartons: 10
      },
      minimum: {
        pieces: 20,
        cartons: 2
      }
    },
    pricing: {
      manufacturingCost: 3.5,
      sellingPrice: 7.0,
      currency: 'USD'
    }
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Clear database
const clearDB = async () => {
  try {
    await Promise.all([
      User.deleteMany(),
      Brand.deleteMany(),
      RawMaterial.deleteMany(),
      FinishedProduct.deleteMany()
    ]);
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Seed database
const seedDB = async () => {
  try {
    // Create users
    const createdUsers = await Promise.all(
      users.map(async user => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        const permissions = User.getDefaultPermissions(user.role);
        return User.create({
          ...user,
          password: hashedPassword,
          permissions
        });
      })
    );
    console.log(`${createdUsers.length} users created`);

    // Create brands
    const createdBrands = await Brand.create(brands);
    console.log(`${createdBrands.length} brands created`);

    // Create raw materials with brand reference
    const materialsWithBrand = rawMaterials.map(material => ({
      ...material,
      brand: createdBrands[0]._id
    }));
    const createdMaterials = await RawMaterial.create(materialsWithBrand);
    console.log(`${createdMaterials.length} raw materials created`);

    // Create finished products with brand reference
    const productsWithBrand = finishedProducts.map(product => ({
      ...product,
      brand: createdBrands[0]._id
    }));
    const createdProducts = await FinishedProduct.create(productsWithBrand);
    console.log(`${createdProducts.length} finished products created`);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await clearDB();
    await seedDB();
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
};

// Run script
main();
