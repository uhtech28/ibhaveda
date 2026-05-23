# PRODUCTION DEPLOYMENT CHECKLIST

Use this checklist before deploying to production.

---

## PRE-DEPLOYMENT

### Code Quality
- [x] TypeScript compiles without errors (`npm run build`)
- [x] ESLint passes with no critical errors
- [x] No console.error() in production code
- [x] Dead code removed
- [x] Duplicate code eliminated

### Performance
- [x] Bundle size < 500KB per route
- [x] React.memo applied to frequently re-rendering components
- [x] useMemo/useCallback for expensive operations
- [x] Convex queries optimized
- [x] Phaser object pooling implemented

### Security
- [x] All user inputs validated
- [x] File uploads whitelist enforced
- [x] Authentication on all protected routes
- [x] No API keys in source code
- [x] Environment variables secured
- [x] XSS protection enabled

### Testing
- [ ] Manual testing on desktop (Chrome, Firefox, Safari, Edge)
- [ ] Manual testing on tablet (iPad/Android)
- [ ] Manual testing on mobile (iPhone/Android)
- [ ] Test user signup/login flow
- [ ] Test venture creation flow
- [ ] Test checkpoint completion flow
- [ ] Test tool submissions (all 9 tools)
- [ ] Test file uploads
- [ ] Test audio recording
- [ ] Test badge awarding
- [ ] Test level-up sequence

---

## DEPLOYMENT

### Environment Setup
- [ ] Set up production environment variables in Vercel/hosting
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_CONVEX_URL
  - CONVEX_DEPLOY_KEY
  - NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY (if using)

### Convex Deployment
- [ ] Deploy Convex schema: `npx convex deploy --prod`
- [ ] Verify all tables created
- [ ] Verify all indexes created
- [ ] Test queries in production Convex dashboard

### Next.js Deployment
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify build succeeds
- [ ] Check deployment logs for errors
- [ ] Test deployed URL

### DNS & Domain
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate
- [ ] Configure CDN (Vercel handles automatically)

---

## POST-DEPLOYMENT

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor Core Web Vitals
  - Largest Contentful Paint (LCP) < 2.5s
  - First Input Delay (FID) < 100ms
  - Cumulative Layout Shift (CLS) < 0.1
- [ ] Monitor bundle size growth
- [ ] Monitor Convex query performance
- [ ] Set up uptime monitoring

### User Testing
- [ ] Test signup flow with real users
- [ ] Test venture creation
- [ ] Test all 9 tools
- [ ] Test mobile responsiveness
- [ ] Test cross-browser compatibility

### Performance Validation
- [ ] Run Lighthouse audit (target: 90+ performance score)
- [ ] Test load time on slow 3G
- [ ] Verify Phaser runs at 60 FPS
- [ ] Check bundle size hasn't increased

### Security Validation
- [ ] Run security audit: `npm audit`
- [ ] Verify authentication works
- [ ] Test file upload limits
- [ ] Verify input validation
- [ ] Check for exposed API keys

---

## ROLLBACK PLAN

If critical issues arise post-deployment:

1. **Immediate Rollback**
   ```bash
   vercel rollback
   ```

2. **Convex Rollback**
   - Redeploy previous Convex snapshot
   - Or manually revert schema changes

3. **Database Backup**
   - Convex handles automatic backups
   - Can export data if needed

4. **Monitoring**
   - Monitor error rates
   - Check user reports
   - Review analytics

---

## PRODUCTION URLS

- **Production App:** https://your-domain.vercel.app
- **Convex Dashboard:** https://dashboard.convex.dev
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## SUPPORT CONTACTS

- **Technical Lead:** [Your contact]
- **DevOps:** [Your contact]
- **QA Team:** [Your contact]
- **On-call:** [Your contact]

---

## SUCCESS CRITERIA

Deployment is considered successful when:

- ✅ All critical user flows work (signup, venture, tools)
- ✅ No errors in production logs (first 24 hours)
- ✅ Core Web Vitals meet targets
- ✅ User feedback is positive
- ✅ Performance meets benchmarks
- ✅ No security vulnerabilities detected

---

**Status:** Ready for deployment ✅  
**Last Updated:** April 21, 2026  
**Agent:** Agent 5 - Performance & Security
