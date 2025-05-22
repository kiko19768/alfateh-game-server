# Deployment Guide for Al-Fateh Game Server

This guide will help you deploy the game server using free hosting services.

## 1. MongoDB Atlas Setup

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier)
3. Set up database access:
   - Create a database user
   - Save the username and password
4. Set up network access:
   - Add IP address 0.0.0.0/0 for worldwide access
5. Get your connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

## 2. Railway.app Setup

1. Create a free Railway account at https://railway.app
2. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Login to Railway:
   ```bash
   railway login
   ```
4. Create a new project:
   ```bash
   railway init
   ```
5. Add environment variables:
   ```bash
   railway vars set MONGODB_URI=your_mongodb_connection_string
   railway vars set JWT_SECRET=your_secret_key
   ```

## 3. Deployment Steps

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Railway:
   ```bash
   railway up
   ```

3. Get your deployment URL:
   ```bash
   railway domain
   ```

## 4. Update Client Configuration

1. Update the server URL in the Android client:
   - Open `app/src/main/java/com/alfateh/game/network/NetworkConfig.java`
   - Replace `PROD_WS_URL` with your Railway deployment URL

## 5. Testing the Deployment

1. Test WebSocket connection:
   ```bash
   wscat -c wss://your-railway-url
   ```

2. Monitor server logs:
   ```bash
   railway logs
   ```

## 6. Cloudflare Setup (Optional)

If you want to add a custom domain and SSL:

1. Create a Cloudflare account
2. Add your domain to Cloudflare
3. Create a new DNS record pointing to your Railway URL
4. Enable Cloudflare proxy (orange cloud)

## 7. Monitoring

1. Set up MongoDB Atlas monitoring
2. Use Railway's built-in metrics
3. Monitor server health using the admin panel

## Common Issues

1. Connection Timeouts:
   - Check Railway logs
   - Verify MongoDB connection string
   - Check network rules

2. WebSocket Errors:
   - Ensure proper SSL configuration
   - Check client connection settings
   - Verify WebSocket URL format

3. Database Issues:
   - Check MongoDB Atlas status
   - Verify database credentials
   - Check connection string format

## Scaling (Free Tier Limits)

- MongoDB Atlas:
  - 512MB storage
  - Shared RAM
  - 100 connections

- Railway:
  - 512MB RAM
  - Shared CPU
  - 1GB disk

Monitor these limits and optimize your application accordingly.