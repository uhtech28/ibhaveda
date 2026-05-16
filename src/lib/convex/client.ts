"use client"

import { ConvexReactClient } from "convex/react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.warn("NEXT_PUBLIC_CONVEX_URL is not defined. Please check your environment variables.");
}

const convex = new ConvexReactClient(convexUrl || "http://localhost:3000"); // Placeholder to prevent crash

export default convex
