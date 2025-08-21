# Vikareta Platform - Unified Authentication System

A secure, consistent authentication system across all Vikareta modules with enhanced security features and standardized naming conventions.

## 🔐 Security Features

- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **Cross-Domain SSO**: Secure single sign-on across all Vikareta domains
- **Session Management**: Activity tracking, timeout handling, and automatic cleanup
- **Type Safety**: Full TypeScript support with runtime validation
- **User Validation**: Prevents cross-user contamination during token refresh

## 📁 File Structure

```
/lib/auth/vikareta/
├── vikareta-auth-types.ts      # Unified type definitions & constants
├── vikareta-sso-client.ts      # Secure SSO client implementation
├── vikareta-cross-domain.ts    # Cross-domain authentication utilities
├── vikareta-session.ts         # Session management with activity tracking
├── index.ts                    # Main exports
└── hooks/
    └── use-vikareta-auth.tsx   # React hook for authentication
```

## 🏗️ Architecture Benefits

### **Before (Inconsistent)**
```
❌ dashboard/sso-client.ts
❌ admin/cross-domain-auth.ts (in utils/)
❌ web/secure-cross-domain-auth.ts
❌ Different cookie names per module
❌ Scattered security implementations
❌ No unified session management
```

### **After (Unified & Secure)**
```
✅ vikareta/vikareta-sso-client.ts
✅ vikareta/vikareta-cross-domain.ts
✅ vikareta/vikareta-session.ts
✅ Consistent 'vikareta_*' cookie naming
✅ Centralized security standards
✅ Unified session management
```

## 🔑 Cookie Naming Standards

| Purpose | Cookie Name | Security |
|---------|-------------|----------|
| Access Token | `vikareta_access_token` | HttpOnly, Secure, SameSite |
| Refresh Token | `vikareta_refresh_token` | HttpOnly, Secure, SameSite |
| Session ID | `vikareta_session_id` | HttpOnly, Secure, SameSite |
| CSRF Token | `XSRF-TOKEN` | Secure, SameSite |

## 🚀 Usage Examples

### Basic Authentication Hook
```tsx
import { useVikaretaAuth } from '@/lib/auth/vikareta';

function LoginComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    hasRole, 
    canAccess 
  } = useVikaretaAuth();

  const handleLogin = async (credentials) => {
    const success = await login(credentials);
    if (success) {
      // Handle successful login
    }
  };

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.firstName}!</p>
          {canAccess('admin') && <AdminPanel />}
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### Manual SSO Client Usage
```tsx
import { vikaretaSSOClient } from '@/lib/auth/vikareta';

// Initialize authentication
const authState = await vikaretaSSOClient.initialize();

// Perform login
const loginResult = await vikaretaSSOClient.login({
  email: 'user@example.com',
  password: 'password'
});

// Check authentication status
const isAuth = vikaretaSSOClient.isAuthenticated();
const user = vikaretaSSOClient.getCurrentUser();

// Refresh token
const refreshSuccess = await vikaretaSSOClient.refreshToken();

// Logout
await vikaretaSSOClient.logout();
```

### Cross-Domain Operations
```tsx
import { vikaretaCrossDomainAuth } from '@/lib/auth/vikareta';

// Get current domain
const domain = vikaretaCrossDomainAuth.getCurrentDomain();

// Sync authentication across domains
await vikaretaCrossDomainAuth.syncSSOAcrossDomains(authData);

// Navigate to login with return URL
vikaretaCrossDomainAuth.navigateToLogin();

// Handle post-login redirect
vikaretaCrossDomainAuth.handlePostLoginRedirect(searchParams);

// Secure logout from all domains
await vikaretaCrossDomainAuth.logoutFromAllDomains();
```

### Session Management
```tsx
import { vikaretaSessionManager } from '@/lib/auth/vikareta';

// Start session tracking
vikaretaSessionManager.startSession(sessionId);

// Update activity (automatically tracked)
vikaretaSessionManager.updateActivity();

// Check session status
const isExpired = vikaretaSessionManager.isSessionExpired();
const sessionInfo = vikaretaSessionManager.getSessionInfo();

// Validate session with server
const isValid = await vikaretaSessionManager.validateSession(sessionId);

// Stop session tracking
vikaretaSessionManager.stopSession();
```

## 🛡️ Security Implementation Details

### **Token Management**
- Access tokens: 1 hour expiry, stored in HttpOnly cookies
- Refresh tokens: 7 days expiry, automatic rotation
- Session tokens: Activity-based expiry (30 minutes idle)

### **Cross-Domain Security**
- Domain validation for all redirect URLs
- Signed SSO tokens with 5-minute expiry
- iframe-based cross-domain communication
- CSRF token validation on all requests

### **Session Security**
- Activity tracking with automatic timeout
- Heartbeat mechanism for session validation
- Concurrent session detection
- Secure session cleanup on logout

### **Data Validation**
- Runtime type checking for all auth data
- User ID validation during token refresh
- Session integrity verification
- Corrupted data automatic cleanup

## 🔄 Migration Guide

### From Old Auth System
```tsx
// Old inconsistent imports
import { SSOClient } from '@/lib/auth/sso-client';
import { crossDomainAuth } from '@/lib/utils/cross-domain-auth';

// New unified imports
import { useVikaretaAuth, vikaretaSSOClient } from '@/lib/auth/vikareta';
```

### Cookie Migration
The system automatically handles cookie migration from old names to new standardized names:
- `adminToken` → `vikareta_access_token`
- `authToken` → `vikareta_access_token`
- `dashboard_token` → `vikareta_access_token`

## 📊 Benefits

### **Security Improvements**
- ✅ Consistent security standards across all modules
- ✅ Protection against XSS, CSRF, and session hijacking
- ✅ Secure cross-domain authentication
- ✅ Activity-based session management

### **Developer Experience**
- ✅ Single import point for all auth functionality
- ✅ Type-safe API with full TypeScript support
- ✅ Consistent naming conventions
- ✅ Comprehensive error handling

### **Maintainability**
- ✅ Centralized authentication logic
- ✅ Easier testing and debugging
- ✅ Consistent behavior across all modules
- ✅ Future-proof architecture

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_MAIN_HOST=vikareta.com
NEXT_PUBLIC_DASHBOARD_HOST=dashboard.vikareta.com
NEXT_PUBLIC_ADMIN_HOST=admin.vikareta.com
NEXT_PUBLIC_API_HOST=api.vikareta.com
```

### Security Configuration
```tsx
// vikareta-auth-types.ts
export const VIKARETA_AUTH_CONSTANTS = {
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 3600,     // 1 hour
    REFRESH_TOKEN: 604800,  // 7 days
    SSO_TOKEN: 300         // 5 minutes
  }
};
```

This unified authentication system ensures secure, consistent authentication across all Vikareta platforms while maintaining backward compatibility and providing enhanced security features.