# 🎯 Supabase Redirect URLs Setup

## Your Vercel Production URL
```
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app
```

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
Open: https://supabase.com/dashboard/project/dlzbwysemaiqlmakuija

### 2. Navigate to Authentication Settings
Click: **Authentication** → **URL Configuration**

### 3. Update Site URL
Set **Site URL** to:
```
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app
```

### 4. Add Redirect URLs

Add these URLs to **Redirect URLs** (click "Add URL" for each):

```
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/**
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/auth/confirm
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/dashboard
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/login
https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/register
http://localhost:3000/**
```

### 5. Save Changes
Click **Save** at the bottom of the page

---

## Test Your Deployment

Once Supabase is updated, test these:

1. **Homepage**: https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app
2. **Register**: https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/register
3. **Login**: https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/login
4. **Dashboard** (after login): https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/dashboard
5. **Create Set**: https://next-supabase-starter-1npbiufiv-dinequicklys-projects.vercel.app/sets/new

---

## ✅ Deployment Complete!

Your app is live and ready to use! 🚀

