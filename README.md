# Vikareta Admin Panel

A comprehensive administrative interface for the Vikareta B2B marketplace platform, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Management
- **Dashboard**: Real-time platform overview with key metrics and recent activity
- **User Management**: Complete user lifecycle management with verification workflows
- **Product Management**: Product catalog oversight with approval/rejection workflows
- **Order Management**: Order tracking, status updates, and dispute resolution
- **Transaction Management**: Financial transaction monitoring and reporting
- **Category Management**: Product category organization and hierarchy

### Analytics & Reporting
- **Platform Analytics**: Comprehensive charts and metrics using Recharts
- **Real-time Data**: Live updates of platform statistics
- **Export Functionality**: Data export capabilities for reporting

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **CSRF Protection**: Cross-site request forgery protection
- **Role-based Access**: Granular permission system
- **Session Management**: Secure session handling with refresh tokens

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Headless UI
- **Charts**: Recharts for data visualization
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React

## 🏗 Architecture

### Frontend Structure
```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Admin dashboard pages
│   ├── login/            # Authentication
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── layout/          # Layout components
│   ├── providers/       # Context providers
│   └── ui/             # UI components
├── lib/                 # Utilities and API clients
│   ├── api/            # API client configuration
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
├── config/             # Configuration files
└── types/              # TypeScript type definitions
```

### Backend Integration
- **API Base URL**: `https://api.vikareta.com/api`
- **Admin Endpoints**: `/api/admin/*`
- **Authentication**: `/api/auth/*`
- **Real-time Updates**: WebSocket support ready

## 🔧 Configuration

### Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.vikareta.com/api
NEXT_PUBLIC_APP_URL=https://admin.vikareta.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Vikareta_Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@vikareta.com
```

### API Client Features
- **Automatic Token Refresh**: Seamless token renewal
- **Request Interceptors**: Automatic auth header injection
- **Error Handling**: Comprehensive error management
- **CSRF Protection**: Built-in CSRF token handling
- **Retry Logic**: Automatic retry for failed requests

## 📊 Dashboard Features

### Key Metrics
- Total Users with growth indicators
- Active Products count
- Order statistics and trends
- Revenue tracking and analytics

### Real-time Components
- Recent activity feed
- Pending product approvals
- Transaction monitoring
- User verification queue

### Quick Actions
- Direct navigation to critical tasks
- One-click approval/rejection workflows
- Bulk operations support
- Export and reporting tools

## 🔐 Security Features

### Authentication Flow
1. **Login**: Email/password with CSRF protection
2. **Token Management**: JWT with refresh token rotation
3. **Session Handling**: Secure session management
4. **Auto-logout**: Automatic logout on token expiry

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin

### Input Validation
- XSS protection with input sanitization
- SQL injection prevention
- CSRF token validation
- Rate limiting on API endpoints

## 🎨 UI/UX Features

### Design System
- Consistent color palette and typography
- Responsive design for all screen sizes
- Accessible components with ARIA support
- Loading states and error handling

### User Experience
- Intuitive navigation with breadcrumbs
- Search and filter capabilities
- Pagination for large datasets
- Real-time notifications
- Keyboard shortcuts support

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Tablet Support**: Enhanced tablet experience
- **Desktop**: Full-featured desktop interface
- **Print Styles**: Print-optimized layouts

## 🚀 Performance Optimizations

### Next.js Features
- **App Router**: Latest Next.js routing system
- **Server Components**: Optimized rendering
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Bundle Analysis**: Built-in bundle analyzer

### Loading Strategies
- **Lazy Loading**: Components loaded on demand
- **Prefetching**: Strategic route prefetching
- **Caching**: Intelligent caching strategies
- **Compression**: Gzip compression enabled

## 🔄 CI/CD Pipeline

### Deployment Status
- ✅ Centralized Helm Chart Integration
- ✅ ArgoCD Image Updater Support
- ✅ Automatic Deployment Pipeline
- ✅ Production SSL with Cloudflare

### Build Process
1. **TypeScript Compilation**: Type checking and compilation
2. **ESLint**: Code quality and style checking
3. **Build Optimization**: Production build optimization
4. **Docker Containerization**: Multi-stage Docker builds
5. **Kubernetes Deployment**: Automated K8s deployment

## 🧪 Development

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting (if configured)
- **Hot Reload**: Instant development feedback

### API Integration
The admin panel integrates with the Vikareta backend API:
- **Base URL**: `https://api.vikareta.com/api`
- **Admin Routes**: `/api/admin/*`
- **Authentication**: JWT-based with refresh tokens
- **Error Handling**: Comprehensive error management

## 📈 Monitoring & Analytics

### Built-in Analytics
- User activity tracking
- Performance monitoring
- Error tracking and reporting
- Usage statistics

### Health Checks
- API connectivity monitoring
- Authentication status checks
- Real-time system health indicators

## 🔮 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket-based notifications
- **Advanced Analytics**: More detailed reporting and insights
- **Bulk Operations**: Enhanced bulk management capabilities
- **Mobile App**: React Native mobile application
- **API Documentation**: Interactive API documentation

### Technical Improvements
- **PWA Support**: Progressive Web App capabilities
- **Offline Mode**: Limited offline functionality
- **Advanced Caching**: Redis-based caching
- **Microservices**: Service-oriented architecture

## 📞 Support

For technical support or questions about the admin panel:
- **Email**: admin@vikareta.com
- **Documentation**: Internal wiki and API docs
- **Issue Tracking**: Internal issue management system

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Build Status**: ✅ Production Ready

<!-- Build trigger: Wed Jan 15 12:00:00 IST 2025 -->
