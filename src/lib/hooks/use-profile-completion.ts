import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export const useProfileCompletion = () => {
  const { userId } = useAuth();

  const isProfileComplete = useQuery(
    api.users.isProfileComplete,
    userId ? { clerkId: userId } : "skip"
  );

  const isLoading = isProfileComplete === undefined;
  const isComplete = Boolean(isProfileComplete);

  return { isComplete, isLoading };
};