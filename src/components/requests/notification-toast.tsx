"use client"

import { toast } from "@/components/ui/use-toast";

// Utility functions for contribution request notifications

export const notifyRequestSent = () => {
  toast({
    title: "Request Sent",
    description: "Your contribution request has been sent successfully!",
  });
};

export const notifyRequestAccepted = () => {
  toast({
    title: "Request Accepted",
    description: "Your contribution request has been accepted!",
    variant: "default",
  });
};

export const notifyRequestRejected = () => {
  toast({
    title: "Request Rejected",
    description: "Your contribution request has been rejected.",
    variant: "destructive",
  });
};

// Helper to watch for status changes
export const notifyStatusChange = (newStatus: string) => {
  switch (newStatus) {
    case "accepted":
      notifyRequestAccepted();
      break;
    case "rejected":
      notifyRequestRejected();
      break;
    default:
      break;
  }
};