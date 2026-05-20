import { describe, it, expect } from "vitest";
import {
  LinkStatus,
  ProcessingStatus,
  TokenStatus,
  ErrorCode,
} from "@nutcrack/shared";

describe("Enums", () => {
  describe("LinkStatus", () => {
    it("should have correct values", () => {
      expect(LinkStatus.PENDING).toBe("pending");
      expect(LinkStatus.PUBLISHED).toBe("published");
      expect(LinkStatus.ARCHIVED).toBe("archived");
      expect(LinkStatus.DELETED).toBe("deleted");
    });
  });

  describe("ProcessingStatus", () => {
    it("should have correct values", () => {
      expect(ProcessingStatus.QUEUED).toBe("queued");
      expect(ProcessingStatus.FETCHING).toBe("fetching");
      expect(ProcessingStatus.ANALYZING).toBe("analyzing");
      expect(ProcessingStatus.COMPLETED).toBe("completed");
      expect(ProcessingStatus.FAILED).toBe("failed");
    });
  });

  describe("TokenStatus", () => {
    it("should have correct values", () => {
      expect(TokenStatus.ACTIVE).toBe("active");
      expect(TokenStatus.DISABLED).toBe("disabled");
      expect(TokenStatus.EXPIRED).toBe("expired");
    });
  });

  describe("ErrorCode", () => {
    it("should have all required error codes", () => {
      expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
      expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
      expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ErrorCode.CONFLICT).toBe("CONFLICT");
      expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
      expect(ErrorCode.TOKEN_EXPIRED).toBe("TOKEN_EXPIRED");
      expect(ErrorCode.TOKEN_DISABLED).toBe("TOKEN_DISABLED");
      expect(ErrorCode.AI_CONFIG_MISSING).toBe("AI_CONFIG_MISSING");
      expect(ErrorCode.SCRAPE_FAILED).toBe("SCRAPE_FAILED");
      expect(ErrorCode.AI_ANALYSIS_FAILED).toBe("AI_ANALYSIS_FAILED");
      expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    });
  });
});
