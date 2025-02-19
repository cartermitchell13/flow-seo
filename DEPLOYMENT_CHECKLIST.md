# Flow-SEO Production Deployment Checklist

## 1. Database Migration
- [x] Create Neon database configuration (`neon-database.ts`)
- [x] Add Neon database dependencies to `package.json`
- [x] Install new dependencies (`npm install`)
- [x] Create Neon database and get connection URL
- [x] Create `.env.production` for production configuration
- [x] Add database migration script (if needed for existing data) - N/A, no existing data

## 2. Environment Variables Setup
- [x] Update `.env.example` with all required variables
- [ ] Set up the following variables in Vercel project settings:
  - [x] `POSTGRES_URL` (from Neon project)
  - [x] `ENCRYPTION_KEY` (added to .env.production)
  - [x] `WEBFLOW_CLIENT_ID` (added to .env.production)
  - [x] `WEBFLOW_CLIENT_SECRET` (added to .env.production)
  - [ ] `PRODUCTION_OAUTH_CALLBACK_URL` (will set after Vercel deployment)
  - [x] `NODE_ENV="production"`

## 3. Code Updates
- [x] Update database imports across the codebase:
  - [x] Updated jwt.ts
  - [x] Updated auth.ts
  - [x] Updated api-keys.ts
  - [x] Updated route.ts files
  - [x] Created db/index.ts for centralized database access
  - [x] Created missing auth/session.ts utility
  - [x] Fixed parallel pages issue (page.tsx and route.ts conflict)
- [ ] Update CORS configuration in `next.config.mjs`:
  - [ ] Add production domain to `allowedOrigins`
  - [ ] Update `Access-Control-Allow-Origin` header

## 4. Webflow Configuration
- [ ] Update Webflow Developer Settings:
  - [ ] Update OAuth callback URL to production URL
  - [ ] Verify Webflow app settings are configured for production
  - [ ] Test OAuth flow in development with production callback URL

## 5. Designer Extension Updates
- [ ] Update environment variables in designer extension:
  - [ ] Set `VITE_NEXTJS_API_URL` to production backend URL
  - [ ] Update any other environment-specific configurations
- [ ] Build designer extension for production:
  - [ ] Run `npm run build:prod`
  - [ ] Verify build output

## 6. Deployment
- [ ] Deploy to Vercel:
  - [ ] Push latest code to repository
  - [ ] Connect repository to Vercel project
  - [ ] Verify build settings in Vercel
  - [ ] Deploy and monitor build logs
- [ ] Upload designer extension build to Webflow

## 7. Testing
- [ ] Test OAuth flow in production
- [ ] Test API key storage and retrieval
- [ ] Test alt text generation and saving
- [ ] Verify CORS is working correctly
- [ ] Test end-to-end workflow
- [ ] Monitor error logs and performance

## 8. Post-Deployment
- [ ] Set up monitoring (optional):
  - [ ] Configure error tracking
  - [ ] Set up performance monitoring
  - [ ] Configure alerts
- [ ] Document deployment process
- [ ] Create backup and recovery plan

## Notes
- Keep track of all production URLs and credentials in a secure location
- Document any issues encountered during deployment
- Create rollback plan for critical failures

## Current Status
 In Progress - Completing items in order...

---
*This checklist will be updated as tasks are completed. Each section should be thoroughly tested before moving to the next.*
