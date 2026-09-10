export const PARTICIPATION_FEES = {
  male: 55_000,
  female: 35_000,
} as const;

export const BANK_DETAILS = {
  bankName: "기업은행",
  accountNumber: "986-041314-01-019",
  accountHolder: "ㅇㅎㅇ",
} as const;

export const EVENT_TIMES = ["19:00", "20:30", "22:00"] as const;

export const REGISTRATION_STATUS = ["pending", "paid", "confirmed", "cancelled"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUS)[number];

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "입금대기",
  paid: "입금확인",
  confirmed: "참가확정",
  cancelled: "취소",
};
