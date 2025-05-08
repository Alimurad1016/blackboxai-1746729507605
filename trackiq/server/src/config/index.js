const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || 'localhost',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trackiq',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      maxPoolSize: 10
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // limit each IP
  },

  // Security
  security: {
    bcryptSaltRounds: 10,
    passwordMinLength: 8,
    passwordResetTokenExpires: 10 * 60 * 1000 // 10 minutes
  },

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },

  // File Upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    storage: process.env.STORAGE_PATH || 'uploads/'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  },

  // Business Logic Constants
  business: {
    minimumOrderQuantity: 1,
    maximumOrderQuantity: 10000,
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr'],
    stockThresholds: {
      low: 10,
      critical: 5
    }
  },

  // Cache Configuration
  cache: {
    ttl: 60 * 60, // 1 hour
    checkPeriod: 60 * 60 // 1 hour
  },

  // API Versioning
  api: {
    currentVersion: 'v1',
    supportedVersions: ['v1']
  }
};

// Validate required environment variables in production
if (config.isProduction) {
  const requiredEnvVars = [
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required in production`);
    }
  });

  // Additional production-specific validations
  if (config.jwt.secret === 'your-secret-key-development-only') {
    throw new Error('JWT_SECRET must be changed in production');
  }
}

module.exports = config;
