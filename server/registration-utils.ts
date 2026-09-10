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
