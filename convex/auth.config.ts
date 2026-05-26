export default {
  providers: [
    {
      domain: "clerk.theinteractiveideas.com",
      applicationID: "convex",
    },
    {
      domain: "clerk.uhtech.in",
      applicationID: "convex",
    },
    {
      domain: "excited-colt-80.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "modern-sheep-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};