# AdventureBlox - Configuration Guide

This guide addresses all configuration issues and provides setup instructions for production deployment.

---

## ✅ COMPLETED CONFIGURATIONS

### 1. TypeScript Database Types
**Status:** ✅ **COMPLETE**

Generated TypeScript types from Supabase database schema.

**Location:** `backend/src/types/database.ts`

**Usage Example:**
```typescript
import { Database } from './types/database';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
```

**To Regenerate:**
```bash
cd backend
supabase gen types typescript --linked > src/types/database.ts
```

---

### 2. Row Level Security (RLS) Policies
**Status:** ✅ **PARTIAL** - Some tables have RLS, others need it

**Tables WITH RLS Policies:**
- ✅ `user_accounts` - Users can only manage their own accounts
- ✅ `blocked_users` - Users can only manage their own blocks
- ✅ `game_favorites` - Users can manage their own favorites
- ✅ `events` - Public read access
- ✅ `user_ads` - Users can manage their own ads
- ✅ `chat_groups` - Members can access their groups
- ✅ `chat_group_members` - Members can see group membership
- ✅ `chat_group_messages` - Members can see group messages

**Tables MISSING RLS Policies:**
- ⚠️ `users` - **CRITICAL** - No RLS policies
- ⚠️ `profiles` - **CRITICAL** - No RLS policies
- ⚠️ `groups` - Needs policies for privacy
- ⚠️ `group_members` - Needs policies
- ⚠️ `group_roles` - Needs policies
- ⚠️ `group_wall_posts` - Needs policies
- ⚠️ `messages` - **CRITICAL** - No RLS policies
- ⚠️ `notifications` - **CRITICAL** - No RLS policies
- ⚠️ `transactions` - **CRITICAL** - No RLS policies
- ⚠️ `inventory_items` - Needs policies
- ⚠️ `items` - Needs policies
- ⚠️ `reports` - Needs policies
- ⚠️ `premium_subscriptions` - **CRITICAL** - No RLS policies
- ⚠️ `user_badges` - Needs policies

**Recommendation:** Create a new migration to add RLS policies for all missing tables.

---

### 3. Production Environment Variables
**Status:** ✅ **COMPLETE** - Templates created

**Files Created:**
- `backend/.env.production.example` - Backend production config template
- `frontend/.env.production.example` - Frontend production config template

**Setup Instructions:**

#### Backend Production Setup
```bash
cd backend
cp .env.production.example .env.production
# Edit .env.production with your production values
```

**Required Changes:**
1. Generate strong JWT secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `FRONTEND_URL` to your production domain
3. Update `DATABASE_URL` with production Supabase credentials
4. Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
5. Configure email provider (SendGrid recommended)
6. Set up Redis for production (optional but recommended)
7. Configure Stripe keys if using payments

#### Frontend Production Setup
```bash
cd frontend
cp .env.production.example .env.production
# Edit .env.production with your production values
```

**Required Changes:**
1. Update `NEXT_PUBLIC_API_URL` to your backend API URL
2. Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Configure analytics (Google Analytics, Mixpanel)
4. Set up reCAPTCHA keys
5. Configure Stripe publishable key if using payments

---

## ⚠️ CONFIGURATIONS NEEDING ATTENTION

### 1. Redis Configuration
**Status:** ⚠️ **NOT IMPLEMENTED**

**Current State:**
- Redis configuration exists in `.env` files
- Not actually used in the codebase

**Recommended Use Cases:**
1. **Session Storage** - Store JWT refresh tokens
2. **Rate Limiting** - Prevent API abuse
3. **Caching** - Cache frequently accessed data
4. **Real-time Presence** - Track online users
5. **Message Queues** - Background job processing

**Implementation Steps:**

1. **Install Redis Client:**
```bash
cd backend
npm install ioredis
npm install --save-dev @types/ioredis
```

2. **Create Redis Client:**
```typescript
// backend/src/lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_URL || 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export default redis;
```

3. **Use for Rate Limiting:**
```typescript
// backend/src/middleware/rateLimit.ts
import redis from '../lib/redis';

export const rateLimitMiddleware = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate_limit:${ip}`;
  
  const requests = await redis.incr(key);
  
  if (requests === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  if (requests > 100) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  }
  
  next();
};
```

---

### 2. Email/SMS Configuration
**Status:** ⚠️ **NOT IMPLEMENTED**

**Current State:**
- SMTP configuration exists in `.env` files
- No email sending functionality implemented

**Required Email Features:**
1. Email verification on signup
2. Password reset emails
3. Notification emails (optional)
4. Weekly activity summary for parents
5. Moderation action notifications

**Implementation Steps:**

1. **Install Email Library:**
```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

2. **Create Email Service:**
```typescript
// backend/src/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your AdventureBlox account',
    html: `
      <h1>Welcome to AdventureBlox!</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your AdventureBlox password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
};
```

**Recommended Email Provider:**
- **SendGrid** - Free tier: 100 emails/day
- **Mailgun** - Free tier: 5,000 emails/month
- **AWS SES** - Very cheap, requires verification

---

### 3. Missing RLS Policies Migration
**Status:** ⚠️ **NEEDS CREATION**

**Create New Migration:**
```bash
cd backend
supabase migration new add_missing_rls_policies
```

**Migration Content:**
```sql
-- Add RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::TEXT = id);

-- Add RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (
    "profileVisibility" = 'public' OR
    auth.uid()::TEXT = "userId"
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- Add RLS policies for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid()::TEXT = "senderId" OR
    auth.uid()::TEXT = "receiverId"
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "senderId");

-- Add RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::TEXT = "userId");

-- Add RLS policies for groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid()::TEXT = "ownerId");

CREATE POLICY "Group owners can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid()::TEXT = "ownerId");

-- Add RLS policies for group_members table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members are viewable by everyone"
  ON group_members FOR SELECT
  USING (true);

-- Add RLS policies for group_wall_posts table
ALTER TABLE group_wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group wall posts are viewable by everyone"
  ON group_wall_posts FOR SELECT
  USING (true);

CREATE POLICY "Group members can create wall posts"
  ON group_wall_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE "groupId" = group_wall_posts."groupId"
      AND "userId" = auth.uid()::TEXT
    )
  );

-- Add RLS policies for inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
  ON inventory_items FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can update their own inventory"
  ON inventory_items FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- Add RLS policies for items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

-- Add RLS policies for premium_subscriptions table
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid()::TEXT = "userId");

-- Add RLS policies for user_badges table
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Add RLS policies for reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid()::TEXT = "reporterId");

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "reporterId");
```

**Apply Migration:**
```bash
# This will apply to your hosted database
supabase db push
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Generate TypeScript types ✅
- [ ] Create RLS policies migration
- [ ] Set up production environment variables
- [ ] Configure Redis (optional but recommended)
- [ ] Set up email service
- [ ] Configure CDN for static assets
- [ ] Set up error tracking (Sentry)
- [ ] Configure monitoring (New Relic, DataDog)
- [ ] Set up CI/CD pipeline
- [ ] Write deployment documentation

### Security
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable database backups
- [ ] Implement audit logging
- [ ] Set up security headers (Helmet.js)
- [ ] Configure CSP (Content Security Policy)

### Performance
- [ ] Enable database connection pooling ✅
- [ ] Set up Redis caching
- [ ] Configure CDN
- [ ] Optimize images
- [ ] Enable gzip compression
- [ ] Implement lazy loading
- [ ] Set up load balancing

### Monitoring
- [ ] Set up application monitoring
- [ ] Configure error tracking
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up performance monitoring
- [ ] Configure alerts

---

## 📝 NEXT STEPS

1. **Create RLS Policies Migration** (High Priority)
   - Protects sensitive user data
   - Required for production security

2. **Implement Redis** (Medium Priority)
   - Improves performance
   - Enables rate limiting
   - Better session management

3. **Set Up Email Service** (High Priority)
   - Required for email verification
   - Password reset functionality
   - User notifications

4. **Configure Production Environment** (High Priority)
   - Set up production servers
   - Configure environment variables
   - Set up CI/CD pipeline

5. **Implement Rate Limiting** (High Priority)
   - Prevents API abuse
   - Protects against DDoS
   - Required for production

---

## 🔧 USEFUL COMMANDS

### Supabase CLI
```bash
# Generate types
supabase gen types typescript --linked > src/types/database.ts

# Create new migration
supabase migration new migration_name

# Apply migrations to hosted database
supabase db push

# Pull schema from hosted database
supabase db pull

# Fetch remote migrations
supabase migration fetch

# Reset local database
supabase db reset

# Start local Supabase (requires Docker)
supabase start

# Stop local Supabase
supabase stop
```

### Database Management
```bash
# Connect to database
psql $DATABASE_URL

# Run SQL file
psql $DATABASE_URL -f migration.sql

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Development
```bash
# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

---

## 📚 ADDITIONAL RESOURCES

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Socket.IO Documentation](https://socket.io/docs/)

---

**Last Updated:** January 13, 2026
