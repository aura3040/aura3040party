import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, Minus, Plus, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { EVENT_TIMES, PARTICIPATION_FEES } from "@shared/registration";

type Gender = "male" | "female" | "";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length < 4) return numbers;
  if (numbers.length < 8) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState<(typeof EVENT_TIMES)[number]>("20:30");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [birthYear, setBirthYear] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const feePerPerson = gender ? PARTICIPATION_FEES[gender] : 0;
  const totalAmount = feePerPerson * partySize;
  const minDate = useMemo(() => dateAfter(0), []);
  const maxDate = useMemo(() => dateAfter(90), []);

  const createRegistration = trpc.registration.create.useMutation({
    onSuccess: registration => navigate(`/payment/${registration.referenceCode}`),
    onError: error => toast.error(error.message || "신청 중 문제가 발생했습니다. 다시 시도해 주세요."),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gender) {
      toast.error("성별을 선택해 주세요.");
      return;
    }
    if (!privacyAgreed) {
      toast.error("개인정보 수집·이용 동의가 필요합니다.");
      return;
    }
    createRegistration.mutate({
      eventDate,
      eventTime,
      name,
      nickname,
      gender,
      birthYear: Number(birthYear),
      phone,
      partySize,
      privacyAgreed: true,
    });
  }

  return (
    <div className="apply-shell min-h-screen bg-[#0b0b0c] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(181,137,68,.18),transparent_34%),radial-gradient(circle_at_95%_40%,rgba(126,86,34,.12),transparent_34%)]" />
      <header className="relative z-10 border-b border-white/8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl text-gold-gradient">A</span>
            <div className="leading-none">
              <p className="text-xs font-bold tracking-[0.2em]">AURA 3040</p>
              <p className="mt-1 text-[9px] tracking-[0.18em] text-white/40">그때그밤</p>
            </div>
          </div>
          <span className="rounded-full border border-[#cba762]/25 bg-[#cba762]/8 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#dfbe7d]">참가신청</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[.74fr_1.26fr] lg:gap-14 lg:py-16">
        <section className="px-1 lg:sticky lg:top-10 lg:h-fit lg:pt-8">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-[#d6ae63]">AURA SOCIAL PARTY</p>
          <h1 className="mt-4 text-3xl font-bold leading-[1.2] tracking-[-0.045em] sm:text-5xl">날짜를 고르고,<br />바로 신청하세요.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">복잡한 회원가입 없이 신청할 수 있습니다. 입력 완료 후 계좌이체 안내가 바로 표시됩니다.</p>
          <div className="mt-7 grid grid-cols-2 gap-2 lg:max-w-sm">
            <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
              <CalendarDays size={18} className="text-[#d6ae63]" />
              <p className="mt-3 text-xs font-semibold">화–토 운영</p>
              <p className="mt-1 text-[11px] text-white/35">신청 가능일</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
              <Clock3 size={18} className="text-[#d6ae63]" />
              <p className="mt-3 text-xs font-semibold">약 1분</p>
              <p className="mt-1 text-[11px] text-white/35">예상 소요시간</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141415] shadow-[0_28px_80px_rgba(0,0,0,.38)]">
          <div className="border-b border-white/8 px-5 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#c9a15a] text-xs font-bold text-black">1</span>
              <div>
                <h2 className="text-base font-bold">참가 정보</h2>
                <p className="mt-0.5 text-[11px] text-white/35">모든 항목을 정확히 입력해 주세요.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="field-label sm:col-span-1">
                날짜 선택 <span className="required">필수</span>
                <input className="field-input" type="date" value={eventDate} onChange={event => setEventDate(event.target.value)} min={minDate} max={maxDate} required />
                <span className="field-help">화요일부터 토요일까지 선택 가능</span>
              </label>

              <fieldset className="field-label sm:col-span-1">
                <legend>시간 선택 <span className="required">필수</span></legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {EVENT_TIMES.map(time => (
                    <button key={time} type="button" onClick={() => setEventTime(time)} className={`select-tile ${eventTime === time ? "select-tile-active" : ""}`} aria-pressed={eventTime === time}>{time}</button>
                  ))}
                </div>
              </fieldset>

              <label className="field-label">이름 <span className="required">필수</span>
                <input className="field-input" value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="실명" minLength={2} maxLength={100} required />
              </label>

              <label className="field-label">닉네임 <span className="required">필수</span>
                <input className="field-input" value={nickname} onChange={event => setNickname(event.target.value)} placeholder="현장에서 사용할 이름" maxLength={100} required />
              </label>

              <fieldset className="field-label">
                <legend>성별 <span className="required">필수</span></legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setGender("male")} className={`select-tile ${gender === "male" ? "select-tile-active" : ""}`} aria-pressed={gender === "male"}>남성</button>
                  <button type="button" onClick={() => setGender("female")} className={`select-tile ${gender === "female" ? "select-tile-active" : ""}`} aria-pressed={gender === "female"}>여성</button>
                </div>
              </fieldset>

              <label className="field-label">출생연도 <span className="required">필수</span>
                <input className="field-input" type="number" inputMode="numeric" value={birthYear} onChange={event => setBirthYear(event.target.value)} placeholder="예: 1988" min="1950" max={new Date().getFullYear() - 19} required />
              </label>

              <label className="field-label sm:col-span-2">휴대전화번호 <span className="required">필수</span>
                <input className="field-input" type="tel" inputMode="tel" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} autoComplete="tel" placeholder="010-0000-0000" pattern="010-[0-9]{3,4}-[0-9]{4}" required />
              </label>

              <div className="field-label sm:col-span-2">
                <span>참가인원 <span className="required">필수</span></span>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/12 bg-black/15 p-2 pl-4">
                  <span className="text-sm text-white/65">신청자 포함</span>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setPartySize(size => Math.max(1, size - 1))} className="step-button" aria-label="참가인원 줄이기"><Minus size={16} /></button>
                    <strong className="w-5 text-center text-base">{partySize}</strong>
                    <button type="button" onClick={() => setPartySize(size => Math.min(10, size + 1))} className="step-button" aria-label="참가인원 늘리기"><Plus size={16} /></button>
                  </div>
                </div>
                <span className="field-help">동반인은 신청자와 동일 요금 기준입니다.</span>
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <input type="checkbox" checked={privacyAgreed} onChange={event => setPrivacyAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c9a15a]" required />
              <span className="text-xs leading-5 text-white/55"><strong className="font-semibold text-white/80">개인정보 수집·이용에 동의합니다.</strong> 신청 확인과 행사 안내를 위해 이름, 연락처, 출생연도를 수집하며 행사 종료 후 30일 이내 파기합니다.</span>
            </label>

            <div className="mt-7 rounded-xl border border-[#c9a15a]/25 bg-[#c9a15a]/8 p-5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>참가비</span>
                <span>{gender ? `${gender === "male" ? "남성" : "여성"} 1인 ${formatMoney(feePerPerson)}원` : "성별을 선택해 주세요"}</span>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-[#c9a15a]/18 pt-4">
                <div>
                  <p className="text-xs font-semibold text-white/65">최종 결제금액</p>
                  <p className="mt-1 text-[10px] text-white/30">{partySize}명 기준</p>
                </div>
                <p className="text-2xl font-bold tracking-[-0.04em] text-[#e2bf79]">{formatMoney(totalAmount)}<span className="ml-1 text-sm">원</span></p>
              </div>
            </div>

            <button type="submit" disabled={createRegistration.isPending} className="primary-button mt-5 w-full">
              {createRegistration.isPending ? "신청 중..." : "참가 신청하기"}
              {!createRegistration.isPending && <ChevronRight size={18} />}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/32">
              <ShieldCheck size={14} /> 신청 후 계좌이체 안내로 바로 이동합니다.
            </div>
          </form>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/7 py-7 text-center text-[10px] text-white/25">
        <p>© 2026 AURA 3040 · <a href="/admin" className="transition-colors hover:text-white/60">관리자</a></p>
      </footer>
    </div>
  );
}
