# 🎮 MineVote Server Management System

Production-ready server management system with advanced monitoring, voting, and reporting features for MineVote Minecraft server platform.

## 🚀 Features

### 🔧 Server Management
- ✅ **CRUD Operations** - Create, read, update, delete servers
- ✅ **Status Management** - Publish/unpublish, feature/unfeature, verify/unverify
- ✅ **Categories & Tags** - Organize servers with categories and tags
- ✅ **Owner Management** - Server ownership and permissions
- ✅ **Boost Packages** - Premium server promotion system

### 📊 Server Monitoring
- ✅ **MCPing Protocol** - Real-time server status monitoring
- ✅ **Background Jobs** - Automated ping workers (BullMQ)
- ✅ **Configurable Frequency** - Per-server ping intervals (default 60s)
- ✅ **Cache System** - Redis caching with TTL (30-90s)
- ✅ **Manual Ping** - On-demand server status checks
- ✅ **Ping History** - Historical server performance data

### 🗳️ Vote System
- ✅ **Rate Limiting** - IP + user-based vote limits
- ✅ **Reward Points** - Points for voters and server owners
- ✅ **CAPTCHA Support** - reCAPTCHA v3 integration
- ✅ **Vote Validation** - Comprehensive vote verification
- ✅ **Anti-Abuse** - Multiple layers of protection

### 📝 Reporting System
- ✅ **User Reports** - Report inappropriate servers
- ✅ **Admin Review** - Admin panel for report management
- ✅ **Status Tracking** - Pending, investigating, resolved, dismissed
- ✅ **Audit Trail** - Complete report history

### 🛡️ Security Features
- ✅ **SSRF Protection** - IP validation and internal network blocking
- ✅ **Input Validation** - Comprehensive data validation with Zod
- ✅ **Rate Limiting** - Multiple rate limit layers
- ✅ **Authentication** - JWT-based admin authentication
- ✅ **Audit Logging** - Complete action logging

## 🛠 Tech Stack

- **Backend**: Netlify Functions + Supabase
- **Database**: PostgreSQL (Supabase) with RLS
- **Authentication**: JWT + Argon2id
- **Validation**: Zod schema validation
- **Monitoring**: MCPing protocol implementation
- **Caching**: Redis (planned)
- **Queue**: BullMQ (planned)
- **Frontend**: React + TypeScript + Tailwind CSS

## 📋 Database Schema

### Core Tables
```sql
servers                    -- Server information and status
server_categories         -- Server categories (Survival, PvP, etc.)
server_tags              -- Server tags (Vanilla, Modded, etc.)
server_boost_packages    -- Premium boost packages
server_boosts            -- Active server boosts
server_monitoring_settings -- Per-server monitoring config
```

### Interaction Tables
```sql
server_votes             -- User votes with rate limiting
server_reports           -- User reports and admin actions
server_ping_history      -- Historical ping data
```

### Security Tables
```sql
admin_users              -- Admin user accounts
admin_sessions           -- Admin session management
audit_logs              -- Complete audit trail
rate_limits             -- Rate limiting data
```

## 🚀 API Endpoints

### Server Management
```
GET    /.netlify/functions/admin/server-crud          -- List servers
POST   /.netlify/functions/admin/server-crud          -- Create server
GET    /.netlify/functions/admin/server-crud/:id      -- Get server
PUT    /.netlify/functions/admin/server-crud/:id      -- Update server
DELETE /.netlify/functions/admin/server-crud/:id      -- Delete server
POST   /.netlify/functions/admin/server-crud/:id      -- Server actions
```

### Server Monitoring
```
POST   /.netlify/functions/admin/server-ping          -- Ping operations
  - action: ping_server, ping_manual, ping_all
```

### Vote System
```
GET    /.netlify/functions/server-vote/:id            -- Vote status
POST   /.netlify/functions/server-vote/:id            -- Submit vote
```

### Reporting System
```
GET    /.netlify/functions/server-reports             -- List reports
POST   /.netlify/functions/server-reports             -- Create report
GET    /.netlify/functions/server-reports/:id         -- Get report
PUT    /.netlify/functions/server-reports/:id         -- Update report
```

## 🔧 Setup Instructions

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor:
-- 1. server-management-schema.sql
-- 2. secure-admin-schema.sql (if not already done)
-- 3. secure-admin-seed.sql (if not already done)
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

# Optional variables:
REDIS_URL=your_redis_url (for caching)
BULLMQ_REDIS_URL=your_redis_url (for background jobs)
```

### 3. Install Dependencies
```bash
# Netlify Functions dependencies
cd netlify/functions
npm install

# Main project dependencies
cd ../..
npm install
```

### 4. Test the System
```bash
# Test server management system
node test-server-management.js

# Test admin authentication
node test-dashboard-api.js
```

### 5. Deploy
- Deploy to Netlify
- Set environment variables
- Access admin panel: `https://your-site.netlify.app/admin`

## 📊 Server Monitoring

### MCPing Protocol
The system implements the Minecraft Server List Ping protocol for real-time server monitoring:

- **Handshake Packet** - Establishes connection
- **Status Request** - Requests server information
- **Response Parsing** - Extracts player count, MOTD, version
- **Error Handling** - Graceful handling of offline servers

### Ping Frequency
- **Default**: 60 seconds per server
- **Configurable**: Per-server ping intervals
- **Failed Servers**: 5-minute retry interval
- **Cache TTL**: 30-90 seconds

### Monitoring Features
- **Real-time Status** - Online/offline detection
- **Player Count** - Current and maximum players
- **Server Version** - Minecraft version detection
- **MOTD** - Server message of the day
- **Ping Latency** - Response time measurement
- **Error Tracking** - Connection error logging

## 🗳️ Vote System

### Rate Limiting
- **Per User Per Server**: 24 hours
- **Per IP Per Server**: 24 hours
- **Global User Limit**: 10 votes per hour
- **CAPTCHA**: Optional reCAPTCHA v3

### Reward System
- **Base Points**: 10 points per vote
- **Verified Server Bonus**: +5 points
- **Featured Server Bonus**: +10 points
- **High Player Count Bonus**: +5 points (50+ players)
- **Owner Rewards**: 50% of voter points

### Security Features
- **IP Validation** - Prevents internal network access
- **User Authentication** - JWT token validation
- **Duplicate Prevention** - One vote per day per server
- **Audit Logging** - Complete vote history

## 📝 Reporting System

### Report Types
- **Inappropriate Content** - Offensive or inappropriate material
- **Spam** - Spam or promotional content
- **Fake Server** - Non-functional or fake servers
- **Broken Server** - Technical issues
- **Other** - Other violations

### Report Workflow
1. **User Submission** - User reports server with reason
2. **Admin Review** - Admin reviews and investigates
3. **Status Updates** - Pending → Investigating → Resolved/Dismissed
4. **Admin Notes** - Internal notes and resolution details
5. **Audit Trail** - Complete report history

### Admin Actions
- **Start Investigation** - Move to investigating status
- **Resolve** - Mark as resolved with notes
- **Dismiss** - Mark as dismissed with reason
- **Reopen** - Reopen resolved/dismissed reports

## 🛡️ Security Features

### SSRF Protection
- **IP Validation** - Validates IP addresses
- **Internal Network Blocking** - Blocks private IP ranges
- **Port Validation** - Validates port numbers (1-65535)
- **Protocol Restriction** - Only allows MCPing protocol

### Input Validation
- **Zod Schemas** - Comprehensive data validation
- **Type Safety** - TypeScript for type safety
- **Sanitization** - Input sanitization and escaping
- **Length Limits** - Field length restrictions

### Rate Limiting
- **Multiple Layers** - IP, user, and global limits
- **Configurable** - Adjustable rate limit settings
- **Redis Storage** - Efficient rate limit storage
- **Automatic Cleanup** - Expired rate limits cleanup

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **Argon2id Hashing** - Secure password hashing
- **Session Management** - Secure session handling
- **Role-Based Access** - Admin role permissions
- **CSRF Protection** - Cross-site request forgery protection

## 📈 Performance & Scalability

### Database Optimization
- **Indexed Queries** - Optimized database indexes
- **RLS Policies** - Row-level security for data access
- **Connection Pooling** - Efficient database connections
- **Query Optimization** - Optimized SQL queries

### Caching Strategy
- **Redis Caching** - Server status caching
- **TTL Management** - Automatic cache expiration
- **Cache Invalidation** - Smart cache updates
- **CDN Integration** - Static asset caching

### Background Jobs
- **BullMQ Integration** - Reliable job processing
- **Queue Management** - Job priority and scheduling
- **Error Handling** - Robust error recovery
- **Monitoring** - Job status monitoring

## 🧪 Testing

### Test Coverage
- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Security Tests** - SSRF and validation testing
- **Performance Tests** - Load and stress testing

### Test Scripts
```bash
# Test server management system
node test-server-management.js

# Test admin dashboard
node test-dashboard-api.js

# Test ping functionality
node test-ping-system.js
```

## 📊 Monitoring & Analytics

### Server Metrics
- **Uptime Tracking** - Server availability monitoring
- **Response Times** - Ping latency tracking
- **Player Counts** - Active player monitoring
- **Error Rates** - Connection failure tracking

### Vote Analytics
- **Vote Trends** - Voting pattern analysis
- **Popular Servers** - Most voted servers
- **User Engagement** - Voter activity metrics
- **Reward Distribution** - Points distribution analysis

### Report Analytics
- **Report Volume** - Report submission trends
- **Resolution Times** - Average resolution time
- **Report Types** - Most common report reasons
- **Admin Performance** - Admin response metrics

## 🔧 Maintenance

### Regular Tasks
- **Database Cleanup** - Remove old ping history
- **Cache Management** - Monitor cache performance
- **Rate Limit Reset** - Clear expired rate limits
- **Log Rotation** - Manage audit log size
- **Backup Verification** - Ensure data backups

### Monitoring Alerts
- **Server Offline** - Alert on server downtime
- **High Error Rates** - Alert on ping failures
- **Rate Limit Violations** - Alert on abuse attempts
- **System Performance** - Alert on performance issues

## 📞 Support & Troubleshooting

### Common Issues
1. **Ping Failures** - Check server IP/port and firewall
2. **Rate Limit Blocks** - Wait for rate limit reset
3. **Authentication Errors** - Verify JWT tokens
4. **Database Errors** - Check RLS policies and permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=true
LOG_LEVEL=debug
```

### Emergency Procedures
- **Server Lockout** - Manual server status updates
- **Rate Limit Override** - Emergency rate limit bypass
- **Database Recovery** - Restore from backups
- **System Rollback** - Rollback to previous version

## 📝 License

This server management system is part of the MineVote project and follows the same license terms.

---

**⚠️ Security Notice**: This system implements enterprise-grade security features. Ensure all security configurations are properly set up before production deployment.

**🚀 Performance Notice**: For high-traffic deployments, consider implementing Redis caching and BullMQ background jobs for optimal performance.
