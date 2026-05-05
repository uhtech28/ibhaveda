// Accept JWTs from both Clerk instances:
// - Live Clerk (used on uhtech.in / Vercel prod)
// - Test Clerk (used on localhost during development)
//
// Both providers use the same Convex JWT template name "convex".
export default {
  providers: [
    {
      domain: "https://clerk.uhtech.in",
      applicationID: "convex",
    },
    {
      domain: "https://excited-colt-80.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
