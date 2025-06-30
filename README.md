# Handbook Frontend

A modern Next.js web application for the Handbook Management System - enabling employees to share feedback, praise, and suggestions within their organization.

## 📋 Overview

This frontend provides a user-friendly interface for employees to create, view, and manage expressions (praise/feedback). Built with Next.js 14, TypeScript, and Material-UI, it offers a responsive and intuitive experience for organizational communication.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Access to Handbook Backend API
- External authentication service access

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd handbook-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file:
   ```bash
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:2525
   
   # Authentication
   REACT_APP_URLMAIN_LOGIN=https://auth.company.com
   
   # Application
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

Open [http://localhost:19930](http://localhost:19930) with your browser to see the application.

## 🏗️ Architecture

### Core Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client for API communication
- **React Hook Form** - Form validation and management
- **React Context** - State management for authentication

### Project Structure

```
handbook-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── home/          # Main dashboard
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── (blank-layout-pages)/ # Public pages
│   │   │   └── login-og/      # SSO login page
│   │   └── page.tsx           # Root redirect page
│   ├── components/            # Reusable components
│   │   ├── home/             # Home page components
│   │   │   ├── HomeComponent.tsx  # Main dashboard
│   │   │   └── mockData.ts   # Sample data
│   │   └── layout/           # Layout components
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/                # Custom hooks
│   │   └── useExpressions.ts # Expression management
│   ├── services/             # API services
│   │   ├── apiClient.ts      # HTTP client setup
│   │   └── expressionService.ts # Expression API calls
│   ├── types/                # TypeScript definitions
│   │   ├── expression.ts     # Expression interfaces
│   │   └── auth.ts          # Authentication types
│   └── utils/                # Utility functions
├── public/                   # Static assets
└── tailwind.config.ts       # Tailwind CSS configuration
```

## 🎨 Features

### Core Functionality

- **📝 Expression Management**
  - Create praise and suggestions
  - Public/private visibility settings
  - Draft and publish modes
  - File attachments support

- **🔍 Dashboard Views**
  - Received expressions
  - Sent expressions
  - Personal statistics
  - Time-based filtering (monthly/yearly)

- **👤 User Authentication**
  - SSO integration
  - JWT token management
  - Automatic token refresh
  - Route protection

- **📱 Responsive Design**
  - Mobile-friendly interface
  - Touch gestures support
  - Adaptive layouts
  - Dark/light mode

### User Interface

- **Modern Material Design** - Clean, professional interface
- **Intuitive Navigation** - Easy-to-use sidebar and tabs
- **Real-time Updates** - Live data synchronization
- **Interactive Components** - Smooth animations and transitions

## 🔧 API Integration

### Backend Communication

The frontend communicates with the Handbook Backend API through:

- **Axios HTTP Client** - Centralized API communication
- **JWT Authentication** - Secure token-based requests
- **Error Handling** - Graceful error recovery
- **Loading States** - User feedback during operations

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/expressions/received/:empId` | Load received expressions |
| `GET /api/expressions/sent/:empId` | Load sent expressions |
| `POST /api/expressions` | Create new expression |
| `PUT /api/expressions/:id` | Update expression |
| `DELETE /api/expressions/:id` | Delete expression |

### Data Flow

```
User Interface → useExpressions Hook → ExpressionService → API Client → Backend API
      ↓                ↓                     ↓              ↓
   Loading State → Update State ← Transform Data ← HTTP Response
```

## 🔐 Authentication

### SSO Integration

1. **Login Flow**
   - User clicks login → Redirected to external auth service
   - After authentication → Returns with JWT token
   - Token stored in localStorage → User authenticated

2. **Token Management**
   - Automatic token refresh every 4 minutes
   - Token verification before API calls
   - Logout on token expiration

3. **Route Protection**
   - Protected routes require authentication
   - Automatic redirect to login for unauthenticated users
   - Public routes: `/`, `/login-og`, `/unauthorized`

### AuthContext Usage

```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user, isAuthenticated, logout } = useAuth()
```

## 📱 Components

### HomeComponent

The main dashboard component featuring:

- **Expression Lists** - Received and sent expressions
- **Statistics Cards** - Quick metrics overview
- **Time Filters** - Monthly and yearly views
- **Create Form** - New expression creation modal

### Key Features

```typescript
// Real-time expression management
const { 
  expressions, 
  loading, 
  createExpression, 
  loadReceivedExpressions 
} = useExpressions(userEmpId)

// Time-based filtering
const handleTimeFilterChange = (period, year, month) => {
  // Filter expressions by time period
}
```

## 🎨 Styling

### Design System

- **Material-UI Theme** - Consistent design language
- **Tailwind CSS** - Utility-first styling
- **Custom Components** - Branded interface elements
- **Responsive Breakpoints** - Mobile, tablet, desktop

### Theme Configuration

```typescript
// Custom theme with company branding
const theme = {
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  },
  typography: {
    fontFamily: 'Inter, sans-serif'
  }
}
```

## 🚀 Deployment

### Build Process

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Environment Variables

```bash
# Production environment
NEXT_PUBLIC_API_BASE_URL=https://api.company.com
REACT_APP_URLMAIN_LOGIN=https://auth.company.com
NODE_ENV=production
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] Authentication service reachable
- [ ] Build process completed successfully
- [ ] Static assets optimized

## 🧪 Testing

### Manual Testing

```bash
# Test authentication flow
1. Access http://localhost:19930
2. Should redirect to /home
3. Should redirect to login if not authenticated
4. Login and verify dashboard loads

# Test expression creation
1. Click "+" button
2. Fill out form
3. Submit and verify in expression list
4. Check backend database for new record
```

### Component Testing

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🔍 Troubleshooting

### Common Issues

**Authentication Problems**
- Check external auth service availability
- Verify JWT token format and expiration
- Clear localStorage and retry login
- Check network connectivity

**API Connection Errors**
- Verify backend server is running
- Check API base URL configuration
- Ensure CORS is properly configured
- Test API endpoints manually

**Build/Runtime Errors**
- Check TypeScript compilation errors
- Verify all dependencies are installed
- Clear Next.js cache: `rm -rf .next`
- Restart development server

### Debug Mode

```bash
# Enable verbose logging
DEBUG=handbook:* npm run dev

# Check Network tab in browser DevTools
# Look for failed API requests
# Verify authentication tokens
```

## 🛠️ Development

### Code Standards

- **TypeScript** - Strict mode enabled
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Component Structure** - Functional components with hooks

### Adding New Features

1. **Create Component**
   ```typescript
   // Example component structure
   interface ComponentProps {
     // Define props
   }
   
   const Component: React.FC<ComponentProps> = ({ }) => {
     return <div>Component content</div>
   }
   ```

2. **Add API Integration**
   ```typescript
   // Add to expressionService.ts
   export const newApiFunction = async (data) => {
     return apiClient.post('/api/endpoint', data)
   }
   ```

3. **Update Types**
   ```typescript
   // Add to types/expression.ts
   export interface NewInterface {
     property: string
   }
   ```

### Performance Optimization

- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component
- **Bundle Analysis** - `npm run build` shows bundle size
- **Caching** - API responses cached appropriately

## 📚 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Framework features
- [App Router Guide](https://nextjs.org/docs/app) - New routing system
- [TypeScript Guide](https://nextjs.org/docs/basic-features/typescript) - TS integration

### Material-UI Resources

- [MUI Documentation](https://mui.com/) - Component library
- [Theming Guide](https://mui.com/customization/theming/) - Custom themes
- [Component API](https://mui.com/api/) - Component props

## 🤝 Contributing

### Development Workflow

1. Create feature branch from main
2. Implement changes with proper TypeScript types
3. Test functionality thoroughly
4. Update documentation if needed
5. Submit pull request with clear description

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Components are properly tested
- [ ] API integration works correctly
- [ ] UI is responsive on all devices
- [ ] No console errors or warnings
- [ ] Code follows established patterns

## 📞 Support

For technical support:

- **Frontend Issues** - Check browser console for errors
- **API Problems** - Verify backend server status
- **Authentication** - Contact system administrator
- **UI/UX Feedback** - Submit feature requests

---

**Note**: This frontend requires the Handbook Backend API to be running and accessible for full functionality.