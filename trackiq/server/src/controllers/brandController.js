const { formatResponse } = require('../utils');

// Mock brands data store
let brands = [
  {
    id: '1',
    name: 'EcoFresh Foods',
    code: 'ECO-001',
    description: 'Organic food products manufacturer',
    status: 'active',
    contactPerson: {
      name: 'John Smith',
      email: 'john@ecofresh.com',
      phone: '+1-555-0123'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Private
exports.getBrands = async (req, res) => {
  try {
    res.status(200).json(
      formatResponse(true, {
        count: brands.length,
        brands
      })
    );
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error getting brands')
    );
  }
};

// @desc    Get single brand
// @route   GET /api/v1/brands/:id
// @access  Private
exports.getBrand = async (req, res) => {
  try {
    const brand = brands.find(b => b.id === req.params.id);

    if (!brand) {
      return res.status(404).json(
        formatResponse(false, null, 'Brand not found')
      );
    }

    res.status(200).json(
      formatResponse(true, brand)
    );
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error getting brand')
    );
  }
};

// @desc    Create brand
// @route   POST /api/v1/brands
// @access  Private
exports.createBrand = async (req, res) => {
  try {
    const newBrand = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    brands.push(newBrand);

    res.status(201).json(
      formatResponse(true, newBrand, 'Brand created successfully')
    );
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error creating brand')
    );
  }
};

// @desc    Update brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = async (req, res) => {
  try {
    const index = brands.findIndex(b => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json(
        formatResponse(false, null, 'Brand not found')
      );
    }

    brands[index] = {
      ...brands[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json(
      formatResponse(true, brands[index], 'Brand updated successfully')
    );
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error updating brand')
    );
  }
};

// @desc    Delete brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = async (req, res) => {
  try {
    const index = brands.findIndex(b => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json(
        formatResponse(false, null, 'Brand not found')
      );
    }

    brands.splice(index, 1);

    res.status(200).json(
      formatResponse(true, null, 'Brand deleted successfully')
    );
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error deleting brand')
    );
  }
};
