# VeridaX — AI-led Crowdfunding & Volunteering Platform

A complete, production-quality full-stack web application that empowers communities through AI-powered crowdfunding and volunteering opportunities.

## 🎯 Project Overview

VeridaX connects volunteers and donors with meaningful community causes through an intelligent, secure platform. Built with modern technologies and best practices, it provides role-based access for both campaign organizers and volunteers.

## ✨ Features

### 🔐 Secure Authentication System
- **Dual Role Support**: Admin (Campaign Organizers) and Volunteer roles
- **JWT-based Authentication**: Secure session management with httpOnly cookies
- **Password Security**: bcrypt hashing with salt rounds
- **Role-based Route Protection**: Frontend and backend authorization
- **Form Validation**: Comprehensive input validation and error handling

### 🎯 Campaign Management
- **Admin Dashboard**: Create, manage, and track campaigns
- **Campaign Types**: Support for both volunteering and crowdfunding campaigns
- **Rich Media**: Image uploads and campaign descriptions
- **Progress Tracking**: Real-time progress bars and analytics
- **Volunteer Management**: View and manage registered volunteers

### 👥 Volunteer Experience
- **Campaign Discovery**: Browse and search campaigns with filters
- **Registration System**: Easy volunteer signup and donation process
- **Impact Tracking**: Monitor volunteering hours and donations made
- **Personal Dashboard**: View joined campaigns and impact metrics

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Framer Motion for engaging interactions
- **Professional Design**: Clean, modern interface with gradient themes
- **Accessibility**: WCAG compliant components and navigation

## 🏗️ Clean Project Structure

The project has a clean, minimal structure with only two main folders:

```
VeridaX/
├── backend/                 # Node.js + Express + MongoDB Backend
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── env.example         # Environment variables template
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   ├── models/
│   │   ├── User.js         # User schema with role support
│   │   ├── Campaign.js     # Campaign schema with virtuals
│   │   └── VolunteerRegistration.js # Registration tracking
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── campaignController.js # Campaign management
│   ├── middleware/
│   │   ├── auth.js         # JWT verification & role checks
│   │   └── validation.js   # Input validation rules
│   └── routes/
│       ├── auth.js         # Authentication endpoints
│       └── campaigns.js    # Campaign CRUD operations
│
├── frontend/               # React Frontend
│   ├── package.json        # Frontend dependencies
│   ├── postcss.config.js   # PostCSS configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── src/
│       ├── App.js          # Main App component
│       ├── index.js        # React entry point
│       ├── index.css       # Global styles
│       ├── components/     # Reusable UI components
│       │   ├── Navbar.js   # Navigation component
│       │   ├── Footer.js   # Footer component
│       │   └── LoadingSpinner.js # Loading component
│       ├── context/
│       │   └── AuthContext.js # Authentication context
│       └── pages/          # Page components
│           ├── LandingPage.js    # Home page
│           ├── CampaignDetails.js # Campaign details
│           ├── NotFound.js       # 404 page
│           ├── auth/             # Authentication pages
│           │   ├── LoginPage.js  # Login form
│           │   └── SignupPage.js # Registration form
│           ├── admin/            # Admin dashboard pages
│           │   ├── Dashboard.js  # Admin dashboard
│           │   ├── CreateCampaign.js # Create campaign
│           │   └── MyCampaigns.js # Manage campaigns
│           └── volunteer/        # Volunteer pages
│               ├── Dashboard.js  # Volunteer dashboard
│               └── Browse.js     # Browse campaigns
│
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# The project structure is clean with only backend/ and frontend/ folders
cd veridax
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

**Configure your `.env` file:**
```env
MONGODB_URI=mongodb://localhost:27017/veridax
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Start the backend:**
```bash
npm run dev    # Development mode
npm start      # Production mode
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Campaigns
- `GET /api/campaigns` - Get all campaigns (public)
- `GET /api/campaigns/:id` - Get single campaign (public)
- `POST /api/campaigns` - Create campaign (admin only)
- `PUT /api/campaigns/:id` - Update campaign (admin only)
- `DELETE /api/campaigns/:id` - Delete campaign (admin only)
- `GET /api/campaigns/my-campaigns` - Get user's campaigns (admin only)
- `POST /api/campaigns/:id/volunteer` - Register as volunteer
- `POST /api/campaigns/:id/donate` - Make donation
- `GET /api/campaigns/:id/volunteers` - Get campaign volunteers (admin only)

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers protection
- **Role-based Access**: Granular permission system

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Mobile**: 320px and up
- **Tablet**: 768px and up
- **Desktop**: 1024px and up
- **Large screens**: 1280px and up

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#3B82F6 to #1E40AF)
- **Secondary**: Gray scale (#F8FAFC to #0F172A)
- **Success**: Green (#22C55E)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Components
- **Buttons**: Multiple variants with hover states
- **Cards**: Consistent shadow and border radius
- **Forms**: Accessible form controls with validation
- **Navigation**: Responsive navigation with mobile menu

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start the server
3. Configure MongoDB Atlas or production database
4. Set up reverse proxy (nginx)

### Frontend Deployment
1. Build the production bundle
   ```bash
   npm run build
   ```
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@veridax.com
- Documentation: [docs.veridax.com](https://docs.veridax.com)

## 🔮 Future Enhancements

- **AI Matching**: Intelligent volunteer-campaign matching
- **Payment Integration**: Stripe/PayPal for donations
- **Real-time Chat**: Communication between organizers and volunteers
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Advanced reporting and insights
- **Social Features**: Volunteer networking and reviews
- **Multi-language Support**: Internationalization
- **Advanced Search**: Elasticsearch integration

---

**Built with ❤️ for communities worldwide**
