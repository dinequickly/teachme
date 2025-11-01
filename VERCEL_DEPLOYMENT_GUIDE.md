# Vercel Deployment Guide

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Supabase project with credentials
- ✅ Code pushed to GitHub repository

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Add study sets dashboard feature"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

**Note:** Make sure `.env.local` is in your `.gitignore` file (it should be by default)

### 2. Import Project to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js settings

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy (run from project root)
vercel
```

### 3. Configure Environment Variables

In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production, Preview, Development |

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configure Supabase Authentication

**CRITICAL:** Update your Supabase Auth settings to allow your Vercel domain:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**

2. Add your Vercel URLs to **Site URL**:
   ```
   https://your-project-name.vercel.app
   ```

3. Add to **Redirect URLs** (add ALL of these):
   ```
   https://your-project-name.vercel.app/auth/confirm
   https://your-project-name.vercel.app/dashboard
   https://your-project-name.vercel.app/**
   
   # If you have a custom domain:
   https://yourdomain.com/auth/confirm
   https://yourdomain.com/dashboard
   https://yourdomain.com/**
   ```

4. Add to **Additional Redirect URLs**:
   ```
   http://localhost:3000/**
   https://your-project-name.vercel.app/**
   ```

### 5. Deploy!

#### Via Dashboard:
- Click **Deploy** in Vercel
- Wait for build to complete (usually 1-2 minutes)

#### Via CLI:
```bash
# Production deployment
vercel --prod
```

Your site will be live at: `https://your-project-name.vercel.app`

### 6. Verify Deployment

Check these pages work correctly:

1. ✅ **Home Page**: `https://your-project-name.vercel.app/`
2. ✅ **Login**: `https://your-project-name.vercel.app/login`
3. ✅ **Register**: `https://your-project-name.vercel.app/register`
4. ✅ **Dashboard** (after login): `https://your-project-name.vercel.app/dashboard`
5. ✅ **Create Set**: `https://your-project-name.vercel.app/sets/new`

## Post-Deployment Testing

### Test Authentication Flow

1. **Register a new user:**
   - Go to `/register`
   - Enter email and password
   - Check if confirmation email is sent (if email confirmation is enabled)

2. **Login:**
   - Go to `/login`
   - Enter credentials
   - Verify redirect to dashboard works

3. **Create a Study Set:**
   - Go to `/sets/new`
   - Create a study set with flashcards
   - Verify it saves and redirects correctly

4. **View Study Sets:**
   - Check dashboard shows your study sets
   - Click on a study set to view details

## Troubleshooting

### Issue: "Invalid redirect URL" or Auth errors

**Solution:**
- Double-check Redirect URLs in Supabase Auth settings
- Make sure you added your Vercel domain with `/**` wildcard
- Wait a few minutes after updating Supabase settings

### Issue: Environment variables not working

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify variables are set for "Production" environment
3. Redeploy the project:
   ```bash
   # Via CLI
   vercel --prod
   
   # Or via dashboard
   # Go to Deployments → click ... → Redeploy
   ```

### Issue: "Cannot find module" or build errors

**Solution:**
1. Make sure all dependencies are in `package.json`
2. Check `pnpm-lock.yaml` is committed to git
3. Verify Node.js version in `package.json`:
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

### Issue: Database queries returning no data

**Solution:**
1. Check Supabase connection in production:
   - Open browser console on your Vercel deployment
   - Look for any CORS or network errors
2. Verify environment variables are correct
3. Check Supabase database has the test data:
   ```sql
   SELECT COUNT(*) FROM "StudySet";
   SELECT COUNT(*) FROM "Term";
   ```

### Issue: Page shows "You must be logged in"

**Solution:**
- This is expected for protected routes
- Log in first, then access `/dashboard` or `/sets/new`
- If logged in but still seeing this, clear cookies and try again

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push

# Vercel will automatically build and deploy
```

**Branch Previews:**
- Every branch gets its own preview URL
- Main branch deploys to production
- Pull requests get preview deployments

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `studyapp.com`)
4. Follow DNS configuration instructions

### Update Supabase with Custom Domain

After adding custom domain, update Supabase Auth settings:

1. Add to **Site URL**: `https://yourdomain.com`
2. Add to **Redirect URLs**: 
   ```
   https://yourdomain.com/auth/confirm
   https://yourdomain.com/dashboard
   https://yourdomain.com/**
   ```

## Performance Optimization

### Enable Edge Functions (Optional)

In `next.config.ts`, add:
```typescript
export default {
  // ... existing config
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
```

### Enable Analytics

1. Go to Vercel Dashboard → **Analytics**
2. Click **Enable**
3. Monitor your app's performance

## Security Checklist

Before going to production:

- [ ] Environment variables are set correctly
- [ ] `.env.local` is in `.gitignore`
- [ ] Supabase Redirect URLs are configured
- [ ] Row Level Security (RLS) enabled on database tables
- [ ] CORS configured correctly
- [ ] Rate limiting considered (optional)

## Database Security (Supabase RLS)

### Enable Row Level Security

Protect your data by enabling RLS:

```sql
-- Enable RLS on StudySet table
ALTER TABLE "StudySet" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own study sets
CREATE POLICY "Users can view own study sets"
ON "StudySet"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Policy: Users can insert their own study sets
CREATE POLICY "Users can insert own study sets"
ON "StudySet"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can update their own study sets
CREATE POLICY "Users can update own study sets"
ON "StudySet"
FOR UPDATE
USING (auth.uid()::text = "userId");

-- Policy: Users can delete their own study sets
CREATE POLICY "Users can delete own study sets"
ON "StudySet"
FOR DELETE
USING (auth.uid()::text = "userId");

-- Repeat for Term table
ALTER TABLE "Term" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view terms of their study sets"
ON "Term"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "StudySet"
    WHERE "StudySet"."id" = "Term"."studySetId"
    AND "StudySet"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can insert terms to their study sets"
ON "Term"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "StudySet"
    WHERE "StudySet"."id" = "Term"."studySetId"
    AND "StudySet"."userId" = auth.uid()::text
  )
);
```

## Monitoring

### Check Deployment Status

```bash
# Via CLI
vercel ls

# View logs
vercel logs your-deployment-url
```

### Dashboard Monitoring

- Go to Vercel Dashboard → **Deployments**
- Click on a deployment to see:
  - Build logs
  - Function logs
  - Analytics
  - Performance metrics

## Useful Commands

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# View environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Remove a project
vercel remove your-project-name
```

## Next Steps After Deployment

1. **Test thoroughly** - Create accounts, study sets, flashcards
2. **Monitor errors** - Check Vercel logs for any issues
3. **Set up analytics** - Enable Vercel Analytics
4. **Enable RLS** - Secure your database with Row Level Security
5. **Custom domain** - Add your own domain (optional)
6. **Set up email** - Configure Supabase email templates

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: https://vercel.com/support

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Environment variables added in Vercel
- [ ] Supabase Redirect URLs updated
- [ ] Initial deployment successful
- [ ] Auth tested (register/login)
- [ ] Dashboard accessible
- [ ] Study set creation works
- [ ] Flashcards display correctly
- [ ] Production URL working

---

## Your Current Setup

Your app is running locally at: `http://localhost:3000`

**Supabase Project URL**: `https://dlzbwysemaiqlmakuija.supabase.co`

Once deployed, your production URL will be: `https://your-project-name.vercel.app`

**Remember to update Supabase Auth Redirect URLs with your Vercel URL!**

