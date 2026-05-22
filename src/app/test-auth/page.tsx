"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function TestAuthPage() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  const handleGetToken = async () => {
    try {
      const token = await getToken({ template: "convex" });
      console.log("✅ Convex JWT Token:", token);
      alert("Token retrieved! Check console for details.");
    } catch (error) {
      console.error("❌ Failed to get token:", error);
      alert(`Failed to get token: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Diagnostic</h1>
        
        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">Clerk Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Is Loaded:</strong> {isLoaded ? "✅ Yes" : "❌ No"}</p>
            <p><strong>User ID:</strong> {userId || "❌ Not found"}</p>
            <p><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress || "❌ Not found"}</p>
            <p><strong>User Name:</strong> {user?.fullName || "❌ Not found"}</p>
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">Convex Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Current User Query:</strong> {currentUser === undefined ? "⏳ Loading..." : currentUser ? "✅ Found" : "❌ Not found"}</p>
            {currentUser && (
              <>
                <p><strong>Username:</strong> {currentUser.username}</p>
                <p><strong>Display Name:</strong> {currentUser.displayName}</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">JWT Token Test</h2>
          <p className="text-sm text-muted-foreground">
            Click the button below to test if Clerk can generate a Convex JWT token.
            If this fails with a 404 error, the JWT template is not configured correctly.
          </p>
          <button
            onClick={handleGetToken}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Test Get Convex Token
          </button>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
          <h2 className="text-xl font-semibold">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>✅ Clerk should be loaded with a valid user ID</li>
            <li>✅ "Test Get Convex Token" should succeed without 404 error</li>
            <li>✅ Convex should find your user profile (if created)</li>
          </ul>
          <p className="text-sm font-semibold mt-4">If you see a 404 error:</p>
          <p className="text-sm">The JWT template named "convex" does not exist in your Clerk dashboard.</p>
        </div>
      </div>
    </div>
  );
}
