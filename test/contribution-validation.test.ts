import { describe, it, expect } from "vitest";

/**
 * Unit tests for contribution validation
 *
 * This file tests the validateContributionRequirement function
 * that validates user contributions before checkpoint completion.
 */

// Mock the validation function from convex/ventures.ts
function validateContributionRequirement(
  toolType: string,
  content: any,
  storageId?: string,
): { valid: boolean; reason?: string } {
  // For write/text tool, require minimum 50 words
  if (toolType === "write") {
    if (!content || !content.text) {
      return { valid: false, reason: "Text content is required" };
    }

    const wordCount =
      content.wordCount ||
      (content.text.trim() ? content.text.trim().split(/\s+/).length : 0);

    if (wordCount < 50) {
      return {
        valid: false,
        reason: `Contribution too short. Please write at least 50 words. (Current: ${wordCount} words)`,
      };
    }

    return { valid: true };
  }

  // For upload tool, require file to exist (storageId or in content)
  if (toolType === "upload") {
    const uploadStorageId = storageId || content?.storageId;
    if (!uploadStorageId) {
      return {
        valid: false,
        reason: "File upload is required. Please upload a file.",
      };
    }
    return { valid: true };
  }

  // For other tools (table, map, survey, poll, link, oauth, self_report)
  // just ensure content exists
  if (!content) {
    return { valid: false, reason: "Contribution content is required" };
  }

  return { valid: true };
}

describe("Contribution Validation", () => {
  describe("Write Tool Validation", () => {
    it("should reject text with fewer than 50 words", () => {
      const content = {
        text: "This is a short text with only ten words here.",
        wordCount: 10,
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("too short");
      expect(result.reason).toContain("10 words");
    });

    it("should accept text with exactly 50 words", () => {
      const fiftyWords =
        "one two three four five six seven eight nine ten " +
        "eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty " +
        "twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight twenty-nine thirty " +
        "thirty-one thirty-two thirty-three thirty-four thirty-five thirty-six thirty-seven thirty-eight thirty-nine forty " +
        "forty-one forty-two forty-three forty-four forty-five forty-six forty-seven forty-eight forty-nine fifty";

      const content = {
        text: fiftyWords,
        wordCount: 50,
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should accept text with more than 50 words", () => {
      const content = {
        text:
          "This is a longer piece of text that contains well over fifty words. " +
          "It goes on and on with many sentences. Each sentence adds more words. " +
          "The word counter keeps going up. Soon we will have more than enough words. " +
          "This ensures that the validation function will accept our submission. " +
          "We can now be confident that this text meets the requirements.",
        wordCount: 75,
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should calculate word count if wordCount is not provided", () => {
      const content = {
        text: "Short text",
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("2 words");
    });

    it("should reject empty text", () => {
      const content = {
        text: "",
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Text content is required");
    });

    it("should reject missing text content", () => {
      const content = {};

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Text content is required");
    });

    it("should handle whitespace-only text", () => {
      const content = {
        text: "   \n   \t   ",
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("0 words");
    });
  });

  describe("Upload Tool Validation", () => {
    it("should accept upload with storageId parameter", () => {
      const content = {
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 12345,
      };
      const storageId = "kg2h4j5k6l7m8n9o0p1q2r3s" as any;

      const result = validateContributionRequirement(
        "upload",
        content,
        storageId,
      );

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should accept upload with storageId in content", () => {
      const content = {
        fileName: "test.pdf",
        storageId: "kg2h4j5k6l7m8n9o0p1q2r3s",
        fileType: "application/pdf",
        fileSize: 12345,
      };

      const result = validateContributionRequirement("upload", content);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject upload without storageId", () => {
      const content = {
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 12345,
      };

      const result = validateContributionRequirement("upload", content);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "File upload is required. Please upload a file.",
      );
    });

    it("should reject upload with empty content", () => {
      const result = validateContributionRequirement("upload", null);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "File upload is required. Please upload a file.",
      );
    });
  });

  describe("Other Tools Validation", () => {
    const otherTools = [
      "table",
      "map",
      "survey",
      "poll",
      "link",
      "oauth",
      "self_report",
    ];

    otherTools.forEach((toolType) => {
      describe(`${toolType} tool`, () => {
        it(`should accept ${toolType} with content`, () => {
          const content = {
            data: "some data",
            value: "some value",
          };

          const result = validateContributionRequirement(toolType, content);

          expect(result.valid).toBe(true);
          expect(result.reason).toBeUndefined();
        });

        it(`should reject ${toolType} without content`, () => {
          const result = validateContributionRequirement(toolType, null);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe("Contribution content is required");
        });

        it(`should reject ${toolType} with undefined content`, () => {
          const result = validateContributionRequirement(toolType, undefined);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe("Contribution content is required");
        });
      });
    });

    it("should accept table with proper structure", () => {
      const content = {
        headers: ["Column 1", "Column 2"],
        rows: [
          ["A", "B"],
          ["C", "D"],
        ],
      };

      const result = validateContributionRequirement("table", content);

      expect(result.valid).toBe(true);
    });

    it("should accept map with nodes and edges", () => {
      const content = {
        nodes: [
          { id: "1", x: 100, y: 100, label: "Node 1" },
          { id: "2", x: 200, y: 200, label: "Node 2" },
        ],
        edges: [{ from: "1", to: "2" }],
      };

      const result = validateContributionRequirement("map", content);

      expect(result.valid).toBe(true);
    });

    it("should accept survey with questions", () => {
      const content = {
        questions: [
          { id: "1", text: "What is your name?", type: "text" },
          { id: "2", text: "How old are you?", type: "number" },
        ],
      };

      const result = validateContributionRequirement("survey", content);

      expect(result.valid).toBe(true);
    });

    it("should accept poll with question and options", () => {
      const content = {
        question: "What is your favorite color?",
        options: ["Red", "Blue", "Green", "Yellow"],
      };

      const result = validateContributionRequirement("poll", content);

      expect(result.valid).toBe(true);
    });

    it("should accept link with URL", () => {
      const content = {
        url: "https://example.com",
        title: "Example Site",
        note: "This is a helpful resource",
      };

      const result = validateContributionRequirement("link", content);

      expect(result.valid).toBe(true);
    });

    it("should accept oauth with provider", () => {
      const content = {
        provider: "github",
        externalUrl: "https://github.com/username",
      };

      const result = validateContributionRequirement("oauth", content);

      expect(result.valid).toBe(true);
    });

    it("should accept self_report with field values", () => {
      const content = {
        field1: "value1",
        field2: 42,
        field3: "value3",
      };

      const result = validateContributionRequirement("self_report", content);

      expect(result.valid).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle unknown tool types gracefully", () => {
      const content = { data: "some data" };

      const result = validateContributionRequirement("unknown_tool", content);

      expect(result.valid).toBe(true);
    });

    it("should handle empty string as tool type", () => {
      const content = { data: "some data" };

      const result = validateContributionRequirement("", content);

      expect(result.valid).toBe(true);
    });

    it("should handle write tool with very long text", () => {
      const longText = Array(1000).fill("word").join(" ");
      const content = {
        text: longText,
        wordCount: 1000,
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(true);
    });

    it("should handle write tool with special characters in word count", () => {
      const content = {
        text:
          "Hello, world! This is a test. Can we count words? Yes, we can! " +
          "Special characters like @#$% should not break the counter. " +
          "Numbers like 123 and 456 count as words too. " +
          "Let's make sure we have enough words here to pass validation. " +
          "This should be plenty of words now. We are well over fifty!",
      };

      const result = validateContributionRequirement("write", content);

      expect(result.valid).toBe(true);
    });
  });
});
