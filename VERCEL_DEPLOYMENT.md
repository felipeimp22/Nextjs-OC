# Vercel Deployment Guide

This guide will help you deploy your Next.js restaurant platform to Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com))
- A MongoDB database (MongoDB Atlas recommended)
- Your repository pushed to GitHub

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. **Important**: Under "Network Access", add `0.0.0.0/0` to allow Vercel's serverless functions to connect
4. Create a database user with read/write permissions
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

## Step 2: Generate AUTH_SECRET

**CRITICAL**: NextAuth v5 requires `AUTH_SECRET` (not `NEXTAUTH_SECRET`)

Generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output - you'll need this for Vercel environment variables.

## Step 3: Configure Vercel Environment Variables

1. Go to your project on Vercel Dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Add the following **required** variables:

### Required Variables

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Your MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `AUTH_SECRET` | Generated secret from Step 2 | `your-generated-secret-here` |
| `AUTH_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |

### Optional Variables (for additional features)

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google login |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth client ID | Facebook login |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth secret | Facebook login |
| `STRIPE_TEST_SECRET_KEY` | Stripe test secret key | Payment processing |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Stripe test publishable key | Payment processing |
| `MAPBOX_TOKEN` | Mapbox access token | Delivery distance calculation |
| `SHIPDAY_API_KEY` | Shipday API key | Delivery provider integration |
| `WASABI_ACCESS_KEY` | Wasabi S3 access key | File uploads |
| `WASABI_SECRET_KEY` | Wasabi S3 secret key | File uploads |
| `WASABI_BUCKET` | Wasabi bucket name | File uploads |

**Important**: Make sure to set these for **all environments** (Production, Preview, Development)

## Step 4: Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Click **"Deploy"**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Step 5: Verify Deployment

After deployment:

1. Visit your Vercel deployment URL
2. Try to sign up with a test account
3. Check Vercel logs if there are errors:
   - Go to your project → **Deployments**
   - Click on the latest deployment
   - Click **"Functions"** tab
   - View function logs for errors

## Troubleshooting

### Issue: "Failed to sign up" error

**Cause**: Missing or incorrect `AUTH_SECRET`

**Solution**:
1. Check that `AUTH_SECRET` is set in Vercel environment variables
2. Make sure you're using `AUTH_SECRET` not `NEXTAUTH_SECRET` (NextAuth v5 breaking change)
3. Redeploy after adding the variable

### Issue: Database connection timeout

**Cause**: MongoDB not allowing Vercel IPs

**Solution**:
1. In MongoDB Atlas, go to **Network Access**
2. Add IP address: `0.0.0.0/0` (allows all IPs)
3. Wait a few minutes for changes to propagate

### Issue: Prisma client not found

**Cause**: Prisma client not generated during build

**Solution**:
The build script already includes `prisma generate`:
```json
"build": "prisma generate && npm run schema:combine && next build"
```

If issues persist, add this to `package.json`:
```json
"postinstall": "prisma generate"
```

### Issue: OAuth providers not working

**Cause**: Callback URLs not configured

**Solution**:

For **Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

For **Facebook OAuth**:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. Add Valid OAuth Redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/facebook
   ```

### Issue: Environment variables not updating

**Cause**: Deployment not redeployed after env var changes

**Solution**:
1. After changing environment variables in Vercel
2. Go to **Deployments**
3. Click the **"..." menu** on the latest deployment
4. Select **"Redeploy"**

## Viewing Logs on Vercel

To debug issues in production:

1. Go to your Vercel project
2. Click **"Deployments"**
3. Select the latest deployment
4. Click **"Functions"** tab
5. Click on any function to see its logs
6. Look for console.log outputs and errors

With the improved logging in this codebase, you should see detailed error messages like:
```
❌ CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET is not set!
```

## Production Checklist

Before going live:

- [ ] All required environment variables set
- [ ] MongoDB Atlas IP whitelist configured
- [ ] `AUTH_SECRET` is a strong random string
- [ ] OAuth callback URLs configured (if using social login)
- [ ] Stripe live keys configured (if using payments)
- [ ] Test signup/login flow
- [ ] Test creating a restaurant
- [ ] Test placing an order
- [ ] Monitor Vercel function logs for errors

## Monitoring

After deployment:

1. **Check Vercel Analytics**: Monitor traffic and errors
2. **Check Function Logs**: Look for authentication errors
3. **Set up alerts**: Configure Vercel notifications for failed deployments
4. **Monitor MongoDB**: Check Atlas for connection issues

## Support

If you encounter issues:

1. Check Vercel function logs (detailed error messages available)
2. Verify all environment variables are set correctly
3. Check MongoDB connection and IP whitelist
4. Review this troubleshooting guide
5. Check the [Vercel documentation](https://vercel.com/docs)
6. Check the [NextAuth.js v5 documentation](https://authjs.dev/)

## Common NextAuth v5 Breaking Changes

This project uses NextAuth v5, which has breaking changes from v4:

| v4 | v5 | Notes |
|----|----|----|
| `NEXTAUTH_SECRET` | `AUTH_SECRET` | **Required change** |
| `NEXTAUTH_URL` | `AUTH_URL` | Optional, auto-detected |
| Import from `next-auth` | Import from `@auth/nextauth` | Some packages |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [NextAuth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [MongoDB Atlas with Vercel](https://www.mongodb.com/developer/products/atlas/use-atlas-on-vercel/)
