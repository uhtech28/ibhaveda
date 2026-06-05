/**
 * Phase calculation for the depleting timer ring.
 *
 * The ring's colour shifts purple → gold → red at well-defined
 * thresholds; we test the boundary conditions to lock in the
 * configured behaviour.
 */

import { describe, expect, it } from "vitest";
import { phaseFor } from "../src/lib/combat/theme";

describe("phaseFor", () => {
  it("full at 100% remaining", () => {
    expect(phaseFor(1)).toBe("full");
  });

  it("full just above the warning threshold", () => {
    expect(phaseFor(0.51)).toBe("full");
  });

  it("warning exactly at the warning threshold", () => {
    expect(phaseFor(0.5)).toBe("warning");
  });

  it("warning just above the danger threshold", () => {
    expect(phaseFor(0.21)).toBe("warning");
  });

  it("danger at and below the danger threshold", () => {
    expect(phaseFor(0.2)).toBe("danger");
    expect(phaseFor(0.05)).toBe("danger");
    expect(phaseFor(0)).toBe("danger");
  });
});
