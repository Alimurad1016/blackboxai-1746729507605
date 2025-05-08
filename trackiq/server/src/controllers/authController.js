const jwt = require('jsonwebtoken');
const { formatResponse } = require('../utils');

// Mock user for testing
const mockUser = {
  id: '1',
  email: 'admin@trackiq.com',
  password: 'Admin@123',
  role: 'admin'
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return res.status(400).json(
      formatResponse(false, null, 'Please provide email and password')
    );
  }

  try {
    // Check if credentials match mock user
    if (email === mockUser.email && password === mockUser.password) {
      // Create token
      const token = jwt.sign(
        { id: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
        { expiresIn: '1d' }
      );

      return res.status(200).json(
        formatResponse(true, {
          token,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role
          }
        })
      );
    }

    return res.status(401).json(
      formatResponse(false, null, 'Invalid credentials')
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error logging in user')
    );
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // In a real app, we would fetch the user from the database
    // For now, we'll just return the mock user
    res.status(200).json(
      formatResponse(true, {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      })
    );
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Error getting user info')
    );
  }
};
