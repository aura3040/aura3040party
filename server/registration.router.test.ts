import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

describe("registration router", () => {
  it("rejects malformed mobile numbers before database access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.registration.create({
        eventDate: "2026-09-11",
        eventTime: "20:30",
        name: "테스트",
        nickname: "별빛",
        gender: "female",
        birthYear: 1988,
        phone: "020-123-4567",
        partySize: 1,
        privacyAgreed: true,
      }),
    ).rejects.toThrow("휴대전화번호를 확인해 주세요.");
  });

  it("blocks non-admin users from applicant records", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.registration.list()).rejects.toThrow("관리자만 접근할 수 있습니다.");
  });
});
