export default {
  providers: [
    {
      domain: "https://clerk.ibhaveda.com",
      applicationID: "convex",
    },
    {
      domain: "https://clerk.theinteractiveideas.com",
      applicationID: "convex",
    },
    {
      domain: "https://clerk.uhtech.in",
      applicationID: "convex",
    },
    {
      domain: "https://excited-colt-80.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://modern-sheep-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
