# TrackIQ - Inventory Management System

TrackIQ is a comprehensive inventory and production management system built with the MERN stack (MongoDB, Express.js, React, Node.js) and Tailwind CSS.

## Features

- 🏢 Brand Management
- 📦 Raw Materials Tracking
- 🛠️ Production Planning & Execution
- 📊 Inventory Management
- 📝 Bill of Materials (BOM)
- 📈 Real-time Analytics
- 👥 User Management & Authentication
- 🔒 Role-based Access Control

## Project Structure

```
trackiq/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── context/       # React context
│       └── utils/         # Utility functions
│
└── server/                # Backend Node.js/Express application
    ├── src/
    │   ├── config/       # Configuration files
    │   ├── controllers/  # Route controllers
    │   ├── middleware/   # Custom middleware
    │   ├── models/       # Mongoose models
    │   ├── routes/       # API routes
    │   ├── scripts/      # Utility scripts
    │   └── utils/        # Helper functions
    └── tests/            # Test files
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trackiq.git
cd trackiq
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables:
```bash
# In server directory
cp .env.example .env
# Edit .env with your configuration
```

4. Seed the database:
```bash
cd server
npm run seed
```

5. Start the development servers:
```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Users

After running the seed script, you can log in with these default users:

1. Admin User
   - Email: admin@trackiq.com
   - Password: Admin@123

2. Manager User
   - Email: manager@trackiq.com
   - Password: Manager@123

## API Documentation

The API endpoints are organized by resource:

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- POST /api/v1/auth/forgotpassword
- PUT /api/v1/auth/resetpassword/:resettoken

### Brands
- GET /api/v1/brands
- POST /api/v1/brands
- GET /api/v1/brands/:id
- PUT /api/v1/brands/:id
- DELETE /api/v1/brands/:id

For detailed API documentation, visit `/api/v1/docs` when running the server.

## Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## Deployment

### Server Deployment
1. Set production environment variables
2. Build the application:
```bash
cd server
npm run build
```

### Client Deployment
1. Build the React application:
```bash
cd client
npm run build
```
2. Deploy the contents of the `build` directory to your hosting provider

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@trackiq.com or create an issue in the repository.
