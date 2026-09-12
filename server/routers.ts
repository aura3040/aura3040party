import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { EVENT_TIMES, REGISTRATION_STATUS } from "@shared/registration";
import {
  assertEventDateAllowed,
  calculateRegistrationAmount,
  createReferenceCode,
  normalizePhone,
} from "./registration-utils";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV, LOCAL_ADMIN_OPEN_ID } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 접근할 수 있습니다." });
  }
  return next({ ctx });
});

const registrationInput = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventTime: z.enum(EVENT_TIMES),
  name: z.string().trim().min(2).max(100),
  nickname: z.string().trim().min(1).max(100),
  gender: z.enum(["male", "female"]),
  birthYear: z.number().int().min(1950).max(new Date().getFullYear() - 19),
  phone: z.string().min(10).max(20),
  partySize: z.number().int().min(1).max(10),
  privacyAgreed: z.literal(true),
});

function toPaymentSummary(registration: NonNullable<Awaited<ReturnType<typeof db.getRegistrationByReference>>>) {
  return {
    referenceCode: registration.referenceCode,
    eventDate: registration.eventDate,
    eventTime: registration.eventTime,
    name: registration.name,
    partySize: registration.partySize,
    totalAmount: registration.totalAmount,
    payerName: registration.payerName,
    status: registration.status,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminLogin: publicProcedure
      .input(z.object({ password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.adminPassword) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "관리자 비밀번호가 설정되지 않았습니다.",
          });
        }
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "비밀번호가 올바르지 않습니다.",
          });
        }
        if (!ENV.cookieSecret || !ENV.appId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "세션 설정(JWT_SECRET / VITE_APP_ID)이 없습니다.",
          });
        }

        await db.upsertUser({
          openId: LOCAL_ADMIN_OPEN_ID,
          name: "관리자",
          email: null,
          loginMethod: "password",
          role: "admin",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(LOCAL_ADMIN_OPEN_ID, {
          name: "관리자",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true as const, name: "관리자" };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
  registration: router({
    create: publicProcedure.input(registrationInput).mutation(async ({ input }) => {
      const phone = normalizePhone(input.phone);
      if (!/^01\d{8,9}$/.test(phone)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "휴대전화번호를 확인해 주세요." });
      }
      const dateCheck = assertEventDateAllowed(input.eventDate);
      if (!dateCheck.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: dateCheck.message });
      }
      const feePerPerson = calculateRegistrationAmount(input.gender, 1);
      return db.createRegistration({
        ...input,
        phone,
        referenceCode: createReferenceCode(),
        feePerPerson,
        totalAmount: feePerPerson * input.partySize,
        status: "pending",
      });
    }),
    getByReference: publicProcedure
      .input(z.object({ referenceCode: z.string().min(10).max(40) }))
      .query(async ({ input }) => {
        const registration = await db.getRegistrationByReference(input.referenceCode);
        if (!registration) throw new TRPCError({ code: "NOT_FOUND", message: "신청 내역을 찾을 수 없습니다." });
        return toPaymentSummary(registration);
      }),
    reportPayment: publicProcedure
      .input(z.object({ referenceCode: z.string().min(10).max(40), payerName: z.string().trim().min(2).max(100) }))
      .mutation(async ({ input }) => {
        const registration = await db.reportRegistrationPayment(input.referenceCode, input.payerName);
        if (!registration) throw new TRPCError({ code: "NOT_FOUND", message: "신청 내역을 찾을 수 없습니다." });
        return toPaymentSummary(registration);
      }),
    list: adminProcedure.query(() => db.listRegistrations()),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(REGISTRATION_STATUS) }))
      .mutation(({ input }) => db.updateRegistrationStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
