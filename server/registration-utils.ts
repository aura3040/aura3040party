import { PARTICIPATION_FEES } from "@shared/registration";
import { randomUUID } from "node:crypto";

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function calculateRegistrationAmount(gender: "male" | "female", partySize: number) {
  return PARTICIPATION_FEES[gender] * partySize;
}

export function createReferenceCode() {
  const time = Date.now().toString(36).toUpperCase();
  const random = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  return `AURA-${time}-${random}`;
}

/** Calendar date in Asia/Seoul as YYYY-MM-DD (avoids UTC midnight skew). */
export function getKstDateString(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Validate eventDate is today-or-later in KST and Tue–Sat. */
export function assertEventDateAllowed(eventDate: string, now: Date = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { ok: false as const, message: "오늘 이후의 날짜를 선택해 주세요." };
  }
  const todayKst = getKstDateString(now);
  if (eventDate < todayKst) {
    return { ok: false as const, message: "오늘 이후의 날짜를 선택해 주세요." };
  }
  const selectedDate = new Date(`${eventDate}T12:00:00+09:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return { ok: false as const, message: "오늘 이후의 날짜를 선택해 주세요." };
  }
  const day = selectedDate.getDay();
  if (day === 0 || day === 1) {
    return {
      ok: false as const,
      message: "참가일은 화요일부터 토요일까지 선택할 수 있습니다.",
    };
  }
  return { ok: true as const };
}
