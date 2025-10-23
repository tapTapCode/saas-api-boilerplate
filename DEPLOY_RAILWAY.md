# Deploy to Railway - Quick Guide

## Step-by-Step Deployment

### 1. Sign Up for Railway (2 minutes)
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repos

### 2. Deploy Backend (10 minutes)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `saas-api-boilerplate`
4. Railway will detect it's a monorepo

**Configure Backend Service**:
1. Click "Add Service" → "Database" → "PostgreSQL"
2. Click on your app service
3. Go to "Settings" → "Root Directory" → Set to `backend`
4. Add environment variables:
   - `DATABASE_URL`: (Railway will auto-set from PostgreSQL)
   - `JWT_SECRET`: `your-production-secret-key-here`
   - `STRIPE_SECRET_KEY`: `sk_test_...` (your Stripe test key)
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...` (leave placeholder for now)
   - `FRONTEND_URL`: (will add after frontend deploys)
   - `PORT`: `4000`

5. Click "Deploy"
6. Wait for deployment (~2 minutes)
7. Copy your backend URL (e.g., `https://your-app.railway.app`)

### 3. Deploy Frontend (10 minutes)

**Option A: Deploy to Vercel (Recommended for Next.js)**

1. Go to https://vercel.com
2. "Import Project" → Connect GitHub
3. Select `saas-api-boilerplate`
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Your Railway backend URL + `/api/v1`

5. Click "Deploy"
6. Get your frontend URL (e.g., `https://your-app.vercel.app`)

**Option B: Deploy Both on Railway**

1. In Railway, add another service
2. Select same GitHub repo
3. Set root directory to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend URL + `/api/v1`

### 4. Update Backend with Frontend URL (2 minutes)

1. Go back to Railway backend service
2. Update environment variable:
   - `FRONTEND_URL`: Your frontend URL (from Vercel or Railway)
3. Redeploy (automatic)

### 5. Update README with Live Links

Add this to your project README:

```markdown
## 🚀 Live Demo

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app/api/v1
- **API Docs**: https://your-backend.railway.app/api/docs
```

## Troubleshooting

### Database Connection Issues
- Railway auto-configures `DATABASE_URL`
- Check "Variables" tab to verify it's set

### Build Failures
- Check logs in Railway dashboard
- Ensure `package.json` has correct scripts
- Verify Node version compatibility

### CORS Errors
- Make sure `FRONTEND_URL` matches exactly
- No trailing slash in URLs

## Cost
- Railway: Free tier includes $5/month credit
- Vercel: Free for hobby projects
- **Total**: $0 for development/portfolio

## What to Do After Deployment

1. Test registration: `curl -X POST https://your-backend.railway.app/api/v1/auth/register`
2. Visit frontend URL in browser
3. Update GitHub README with live links
4. Add to your resume/cover letter
