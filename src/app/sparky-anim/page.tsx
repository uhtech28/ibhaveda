import { SparkyAnimClient } from "./SparkyAnimClient";

export const metadata = {
  title: "Sparky Animation Demo · Ibhaveda",
  description:
    "State machine demo — talk → idle → roll (on inactivity) → cheer (on continue).",
};

export default function SparkyAnimPage() {
  return <SparkyAnimClient />;
}
