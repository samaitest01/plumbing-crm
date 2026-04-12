# Deployment Guide - Plumbing CRM

This guide will help you deploy the Plumbing CRM application to production using free-tier services.

## Overview

- **Backend**: Deploy to Render (Free tier)
- **Frontend**: Deploy to Vercel (Free tier)
- **Database**: MongoDB Atlas (Free tier)

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in/up
2. Create a new project (e.g., "Plumbing CRM")
3. Build a new cluster:
   - Choose FREE tier (M0)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "plumbing-crm-cluster")
4. Create a database user:
   - Go to Database Access
   - Add new database user
   - Save username and password securely
5. Configure network access:
   - Go to Network Access
   - Add IP address: `0.0.0.0/0` (Allow access from anywhere)
6. Get connection string:
   - Go to your cluster
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/plumbing_crm?retryWrites=true&w=majority`)
   - Replace `<username>` and `<password>` with your database user credentials

## Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - Name: `plumbing-crm-backend`
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

5. **Environment Variables** (Click "Advanced" and add these):
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-strong-random-string>
   PORT=5000
   FRONTEND_URL=<your-vercel-frontend-url>
   ```

   **How to generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your backend URL (e.g., `https://plumbing-crm-backend.onrender.com`)

**Note**: Free tier services on Render spin down after 15 minutes of inactivity and may take 30-50 seconds to start up on first request.

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to frontend directory:
```bash
cd frontend
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy:
```bash
vercel
```

5. Follow the prompts:
   - Set up and deploy? Yes
   - Which scope? Your account
   - Link to existing project? No
   - Project name: `plumbing-crm-frontend`
   - Directory: `./`
   - Override settings? No

6. Set environment variable:
```bash
vercel env add VITE_API_BASE_URL production
```
Enter your backend URL from Render (e.g., `https://plumbing-crm-backend.onrender.com`)

7. Deploy to production:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add Environment Variables:
   ```
   VITE_API_BASE_URL=<your-render-backend-url>
   ```

6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your frontend URL (e.g., `https://plumbing-crm.vercel.app`)

## Step 4: Update Backend CORS Configuration

1. Go back to Render dashboard
2. Open your backend service
3. Update the `FRONTEND_URL` environment variable with your Vercel URL
4. Save changes (service will auto-redeploy)

## Step 5: Initial Setup

1. Visit your deployed frontend URL
2. Click "Register" to create your first admin user
3. Use role "ADMIN" for full access
4. Login and start using the application

## Troubleshooting

### Backend Issues

**Database Connection Fails:**
- Verify MongoDB connection string is correct
- Ensure database user has read/write permissions
- Check that IP `0.0.0.0/0` is whitelisted in MongoDB Atlas

**Service Not Starting:**
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure `JWT_SECRET` is set

**CORS Errors:**
- Ensure `FRONTEND_URL` matches your Vercel deployment URL exactly
- Include protocol (https://) in the URL
- No trailing slash in the URL

### Frontend Issues

**API Calls Failing:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is deployed and running

**Build Fails:**
- Check that all dependencies are in `package.json`
- Verify Node version compatibility
- Check Vercel build logs for specific errors

**Environment Variables Not Working:**
- In Vite, environment variables must start with `VITE_`
- Redeploy after changing environment variables
- Clear cache and rebuild

## Performance Optimization

### Backend
- Render free tier spins down after inactivity
- First request after spin-down takes 30-50 seconds
- Consider upgrading to paid tier for production use

### Frontend
- Vercel automatically optimizes and caches static assets
- Use Vercel's CDN for global distribution
- Enable Vercel Analytics for monitoring

## Security Checklist

- [ ] Changed `JWT_SECRET` from default
- [ ] Set strong database user password
- [ ] Configured proper CORS origins
- [ ] Environment variables are not in code
- [ ] HTTPS is enabled (automatic on Vercel and Render)
- [ ] MongoDB network access is configured
- [ ] Regular backups are enabled in MongoDB Atlas

## Monitoring

### Render
- View logs in Render dashboard
- Set up alerts for service downtime
- Monitor resource usage

### Vercel
- Enable Vercel Analytics
- Monitor function invocations
- Check build logs for issues

### MongoDB Atlas
- Monitor database performance
- Set up alerts for connection issues
- Review query performance

## Updating the Application

1. Push changes to your GitHub repository
2. Vercel: Auto-deploys on push (if GitHub integration is set up)
3. Render: Auto-deploys on push (if auto-deploy is enabled)

Or manually trigger deployments from respective dashboards.

## Cost Considerations

All services listed have free tiers:

- **Render Free Tier**: 750 hours/month, spins down after inactivity
- **Vercel Free Tier**: 100GB bandwidth, unlimited deployments
- **MongoDB Atlas Free Tier**: 512MB storage, shared CPU

For production use with guaranteed uptime:
- Consider upgrading Render to Starter tier ($7/month)
- Vercel Pro for advanced features ($20/month)
- MongoDB Atlas M2+ for dedicated resources

## Backup Strategy

1. **Database Backups**:
   - MongoDB Atlas automatic backups (on paid tiers)
   - Manual exports via `mongodump`

2. **Code Backups**:
   - GitHub repository serves as version control
   - Tag releases for important versions

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service provider documentation
3. Check application logs
4. Open an issue on GitHub repository
