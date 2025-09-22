# MineVote Admin Panel

Production-ready admin panel for MineVote Minecraft server voting platform.

## 🚀 Features

### Authentication & Security
- ✅ Secure admin login with JWT tokens
- ✅ Role-based access control (RBAC)
- ✅ Account lockout after failed attempts
- ✅ Session management with httpOnly cookies
- ✅ Audit logging for all admin actions

### Dashboard & Analytics
- ✅ Real-time dashboard with key metrics
- ✅ User, server, and vote statistics
- ✅ Banner impression/click tracking
- ✅ Revenue tracking
- ✅ Activity logs

### Content Management
- ✅ Banner management with scheduling
- ✅ News article management
- ✅ Social media account management
- ✅ Server monitoring and management

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Netlify Functions + Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + JWT
- **Deployment**: Netlify

## 📋 Setup Instructions

### 1. Database Setup

Run the following SQL scripts in Supabase SQL Editor:

```sql
-- 1. Create admin schema
-- Run: admin-schema.sql

-- 2. Create admin user
-- Run: admin-seed.sql
```

### 2. Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret key for JWT tokens

### 3. Admin User Creation

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with email: `admin@votesitem.com`
3. Set a strong password
4. Run the `admin-seed.sql` script to link the user to admin role

### 4. Netlify Functions Setup

Install dependencies for Netlify Functions:

```bash
cd netlify/functions
npm install
```

### 5. Deploy to Netlify

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy

## 🔐 Admin Access

### Default Admin User
- **URL**: `https://your-site.netlify.app/admin`
- **Username**: `admin`
- **Password**: Set during user creation

### Roles
- **super_admin**: Full access to all features
- **admin**: Standard admin access
- **moderator**: Limited moderation access
- **editor**: Content editing only

## 📊 API Endpoints

### Authentication
- `POST /.netlify/functions/admin/auth` - Login/logout/verify

### Dashboard
- `GET /.netlify/functions/admin/dashboard` - Dashboard data

### Banners
- `GET /.netlify/functions/admin/banners` - List banners
- `POST /.netlify/functions/admin/banners` - Create banner
- `PUT /.netlify/functions/admin/banners/:id` - Update banner
- `DELETE /.netlify/functions/admin/banners/:id` - Delete banner

### News
- `GET /.netlify/functions/admin/news` - List news
- `POST /.netlify/functions/admin/news` - Create news
- `PUT /.netlify/functions/admin/news/:id` - Update news
- `DELETE /.netlify/functions/admin/news/:id` - Delete news

## 🗄 Database Schema

### Core Tables
- `admin_users` - Admin user accounts
- `admin_sessions` - Active admin sessions
- `audit_logs` - Admin action logs
- `banners` - Advertisement banners
- `news` - News articles
- `social_accounts` - Social media accounts
- `server_monitoring` - Server status tracking
- `system_settings` - Site configuration

## 🔒 Security Features

### Authentication
- JWT tokens with 24h expiration
- HttpOnly cookies for session management
- Account lockout after 5 failed attempts
- 15-minute lockout duration

### Authorization
- Row Level Security (RLS) on all tables
- Role-based permissions
- Resource-level access control

### Audit Trail
- All admin actions logged
- IP address and user agent tracking
- Timestamp and user identification

## 📈 Monitoring

### Metrics Tracked
- User registrations
- Server submissions
- Vote counts
- Banner impressions/clicks
- Revenue tracking
- System performance

### Logs
- Admin login/logout events
- Content modifications
- User management actions
- System configuration changes

## 🚨 Troubleshooting

### Common Issues

1. **Admin login fails**
   - Check if admin user exists in `auth.users`
   - Verify admin user is linked in `admin_users` table
   - Check JWT_SECRET environment variable

2. **Dashboard data not loading**
   - Verify Supabase service role key
   - Check RLS policies
   - Review audit logs for errors

3. **Functions not working**
   - Check Netlify function logs
   - Verify environment variables
   - Test function endpoints directly

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true
```

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor audit logs for suspicious activity
- Review and rotate JWT secrets
- Update admin passwords
- Clean up expired sessions
- Backup database regularly

### Security Updates
- Keep dependencies updated
- Monitor for security advisories
- Regular security audits
- Penetration testing

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review audit logs
3. Check Netlify function logs
4. Contact system administrator

## 📝 License

This admin panel is part of the MineVote project and follows the same license terms.
