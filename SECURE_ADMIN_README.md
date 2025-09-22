# 🔐 MineVote Secure Admin Panel

Production-ready, enterprise-grade admin panel with advanced security features for MineVote Minecraft server voting platform.

## 🚀 Security Features

### 🔒 Authentication & Authorization
- ✅ **Argon2id password hashing** - Industry standard for password security
- ✅ **JWT + Refresh token system** - Short-lived access tokens (15min) + long-lived refresh tokens (7 days)
- ✅ **Role-based access control (RBAC)** - super_admin, admin, moderator, editor roles
- ✅ **Account lockout protection** - 5 failed attempts = 24h lockout
- ✅ **Rate limiting** - IP + username based, configurable limits
- ✅ **Session management** - Secure session tracking with fingerprinting
- ✅ **CSRF protection** - Token-based CSRF protection
- ✅ **2FA ready** - TOTP infrastructure (implementation pending)

### 🛡️ Security Monitoring
- ✅ **Comprehensive audit logging** - All admin actions logged
- ✅ **Auth attempt tracking** - Failed login monitoring
- ✅ **Suspicious activity detection** - IP-based threat detection
- ✅ **Session revocation** - Force logout capabilities
- ✅ **Real-time security dashboard** - Live security metrics

### 🔐 Data Protection
- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Encrypted tokens** - All tokens properly hashed/encrypted
- ✅ **Secure cookies** - HttpOnly, Secure, SameSite cookies
- ✅ **Input validation** - Comprehensive input sanitization
- ✅ **SQL injection protection** - Parameterized queries

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Netlify Functions + Supabase
- **Database**: PostgreSQL (Supabase) with RLS
- **Authentication**: Argon2id + JWT + Refresh tokens
- **Security**: CSRF, Rate limiting, Audit logging
- **Deployment**: Netlify

## 📋 Database Schema

### Core Security Tables
```sql
admin_users          -- Admin user accounts with security fields
admin_sessions       -- Active sessions with fingerprinting
auth_attempts        -- Login attempt tracking
audit_logs          -- Comprehensive audit trail
rate_limits         -- Rate limiting data
csrf_tokens         -- CSRF protection tokens
```

### Content Management Tables
```sql
banners             -- Advertisement management
news                -- News article management
social_accounts     -- Social media accounts
server_monitoring   -- Server status tracking
system_settings     -- Site configuration
```

## 🚀 Quick Setup

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor:
-- 1. secure-admin-schema.sql
-- 2. secure-admin-seed.sql (for test data)
```

### 2. Environment Variables
```bash
# Required variables:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=https://your-site.netlify.app
```

### 3. Create Admin User
```bash
# Install dependencies
cd netlify/functions
npm install

# Create secure admin user
node create-admin-user.js
```

### 4. Deploy
- Deploy to Netlify
- Set environment variables
- Access: `https://your-site.netlify.app/admin`

## 🔐 Security Configuration

### Rate Limiting
```javascript
const RATE_LIMITS = {
  login: { max: 5, window: 15 * 60 * 1000 },     // 5 attempts per 15 minutes
  general: { max: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
  refresh: { max: 10, window: 60 * 1000 }        // 10 refresh attempts per minute
}
```

### Account Lockout
- **Failed attempts**: 5 attempts
- **Lockout duration**: 24 hours
- **Auto-unlock**: After lockout period expires
- **Manual unlock**: By super_admin

### Session Security
- **Access token**: 15 minutes
- **Refresh token**: 7 days
- **Session fingerprinting**: IP + User-Agent + User ID
- **Automatic cleanup**: Expired sessions removed

## 📊 API Endpoints

### Authentication
```
POST /.netlify/functions/admin/secure-auth
  - action: login, refresh, logout, verify
  - Rate limited and monitored
  - Comprehensive error handling
```

### Dashboard
```
GET /.netlify/functions/admin/secure-dashboard
  - Real-time security metrics
  - Auth attempt monitoring
  - Suspicious activity detection
  - CSRF protected
```

## 🔍 Security Monitoring

### Dashboard Metrics
- **Failed login attempts** (last 30 days)
- **Locked accounts** (current)
- **Suspicious IPs** (5+ failed attempts)
- **Rate limit violations**
- **Session activity**

### Audit Trail
- **All admin actions** logged with timestamps
- **IP addresses** and user agents tracked
- **Resource changes** (old/new values)
- **Session management** events
- **Security events** (lockouts, rate limits)

### Real-time Alerts
- **Multiple failed attempts** from same IP
- **Account lockouts**
- **Rate limit violations**
- **Suspicious activity patterns**

## 🛡️ Security Best Practices

### Password Security
- **Argon2id hashing** with secure parameters
- **Minimum complexity** requirements
- **Regular rotation** recommended
- **No password reuse** policy

### Session Management
- **Short-lived access tokens** (15 minutes)
- **Secure refresh tokens** (7 days)
- **Session fingerprinting** for device tracking
- **Automatic cleanup** of expired sessions

### Access Control
- **Principle of least privilege**
- **Role-based permissions**
- **Resource-level access control**
- **Regular permission audits**

### Monitoring & Logging
- **Comprehensive audit logs**
- **Real-time security monitoring**
- **Automated threat detection**
- **Regular security reviews**

## 🚨 Incident Response

### Account Compromise
1. **Immediate lockout** of compromised account
2. **Session revocation** for all active sessions
3. **Password reset** required
4. **Audit log review** for suspicious activity
5. **Security notification** to other admins

### Brute Force Attacks
1. **Automatic rate limiting** blocks excessive attempts
2. **IP-based blocking** for persistent attacks
3. **Account lockout** after failed attempts
4. **Security alerts** for monitoring team
5. **Log analysis** for attack patterns

### Session Hijacking
1. **Session fingerprinting** detects device changes
2. **Automatic session invalidation** on suspicious activity
3. **Force logout** capabilities for compromised sessions
4. **Security notifications** to affected users

## 📈 Performance & Scalability

### Database Optimization
- **Indexed queries** for fast lookups
- **RLS policies** for efficient filtering
- **Connection pooling** for better performance
- **Query optimization** for large datasets

### Caching Strategy
- **Session caching** for fast authentication
- **Rate limit caching** for performance
- **Dashboard data caching** for real-time updates
- **CDN integration** for static assets

### Monitoring
- **Performance metrics** tracking
- **Error rate monitoring**
- **Response time analysis**
- **Resource usage monitoring**

## 🔧 Maintenance

### Regular Tasks
- **Audit log review** (weekly)
- **Security metrics analysis** (daily)
- **Session cleanup** (automated)
- **Rate limit monitoring** (continuous)
- **Backup verification** (daily)

### Security Updates
- **Dependency updates** (monthly)
- **Security patches** (as needed)
- **Penetration testing** (quarterly)
- **Security training** (annually)

## 📞 Support & Troubleshooting

### Common Issues
1. **Login failures** - Check rate limits and account status
2. **Session timeouts** - Verify token expiration settings
3. **CSRF errors** - Check token validity and headers
4. **Rate limit blocks** - Wait for window reset or contact admin

### Debug Mode
```bash
# Enable debug logging
DEBUG=true
LOG_LEVEL=debug
```

### Emergency Access
- **Super admin** can unlock accounts
- **Manual session cleanup** via database
- **Emergency password reset** procedures
- **Backup admin accounts** for recovery

## 📝 License

This secure admin panel is part of the MineVote project and follows the same license terms.

---

**⚠️ Security Notice**: This admin panel implements enterprise-grade security features. Ensure all security configurations are properly set up before production deployment.
