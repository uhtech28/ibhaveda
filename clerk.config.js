/**
 * This is a real JWT template that you can copy-paste into Clerk Dashboard
 * Go to: https://clerk.com/docs/deployments/jwt-templates
 * Click "Create" and select "Template" for Convex
 *
 * Template Name: convex
 * Content should be copied from below:
 */

const convexJWTTemplate = {
  name: 'convex',
  algorithm: 'RS256',
  lifetime: 87600, // 1 day (60 * 24 * 60)
  claims: {
    subject: '{{user.primaryEmailAddress.id}}',
    // Custom claims can be added here
  },
  url: 'https://different-snail-482.convex.cloud/api/auth',
}

module.exports = {
  // This exports the template for reference only
  // You need to create this template in your Clerk Dashboard
  convex: convexJWTTemplate,
}

// INSTRUCTIONS:
// 1. Copy the JWT template configuration above
// 2. Go to your Clerk Dashboard: https://clerk.com/app/organizations/**/jwt-templates
// 3. Click "Create" > "Template"
// 4. Select "Convex" as the template type
// 5. Or manually configure with the settings above:
//    - Name: convex
//    - Algorithm: RS256
//    - Custom endpoint: https://different-snail-482.convex.cloud/api/auth
//    - Lifetime: 1 day (87600 seconds)
// 6. Save the template
// 7. Find the JWT template in your dashboard and copy its Secret ID to CLERK_JWT_SECRET_ID in .env.local
