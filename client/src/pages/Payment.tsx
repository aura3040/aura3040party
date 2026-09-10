import { useState, type FormEvent } from "react";
import { Check, CheckCircle2, Clipboard, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { BANK_DETAILS } from "@shared/registration";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export default function Payment({ params }: { params: { referenceCode: string } }) {
  const [payerName, setPayerName] = useState("");
  const query = trpc.registration.getByReference.useQuery({ referenceCode: params.referenceCode }, { retry: false });
  const reportPayment = trpc.registration.reportPayment.useMutation({
    onSuccess: () => {
      toast.success("입금 완료 알림이 접수되었습니다.");
      query.refetch();
    },
    onError: error => toast.error(error.message || "처리 중 문제가 발생했습니다."),
  });

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
      toast.success("계좌번호를 복사했습니다.");
    } catch {
      toast.error("계좌번호를 복사하지 못했습니다.");
    }
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reportPayment.mutate({ referenceCode: params.referenceCode, payerName });
  }

  if (query.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#0b0b0c] text-white"><Loader2 className="animate-spin text-[#d2aa62]" /></div>;
  }

  if (query.error || !query.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0b0c] px-5 text-white">
        <div className="w-full max-w-sm text-center">
          <p className="font-display text-5xl text-gold-gradient">A</p>
          <h1 className="mt-5 text-xl font-bold">신청 내역을 찾을 수 없습니다.</h1>
          <p className="mt-3 text-sm text-white/45">신청번호를 확인하거나 처음부터 다시 신청해 주세요.</p>
          <Link href="/" className="primary-button mt-7 w-full">신청 화면으로</Link>
        </div>
      </div>
    );
  }

  const registration = query.data;
  const reported = Boolean(registration.payerName);
  const bankReady = !BANK_DETAILS.accountNumber.includes("입력 필요");

  return (
    <div className="min-h-screen bg-[#0b0b0c] px-4 py-6 text-white sm:py-12">
      <main className="mx-auto max-w-lg">
        <header className="mb-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#c9a15a]/40 bg-[#c9a15a]/10 text-[#dfba73]"><Check size={23} /></div>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.28em] text-[#d6ae63]">APPLICATION COMPLETE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">참가 신청이 완료되었습니다.</h1>
          <p className="mt-3 text-sm text-white/45">아래 계좌로 결제금액을 입금해 주세요.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#151516] shadow-[0_28px_80px_rgba(0,0,0,.4)]">
          <div className="border-b border-white/8 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-white/35">신청번호</span>
              <span className="font-mono text-xs text-[#deb873]">{registration.referenceCode}</span>
            </div>
            <dl className="mt-5 space-y-3">
              <Row label="참가일" value={formatDate(registration.eventDate)} />
              <Row label="참가시간" value={registration.eventTime} />
              <Row label="신청자명" value={registration.name} />
              <Row label="참가인원" value={`${registration.partySize}명`} />
            </dl>
          </div>

          <div className="bg-[#c59a50] p-5 text-[#15120e] sm:p-7">
            <p className="text-[10px] font-bold tracking-[0.18em]">TOTAL PAYMENT</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-semibold">총 결제금액</span>
              <strong className="text-3xl tracking-[-0.045em]">{formatMoney(registration.totalAmount)}<span className="ml-1 text-base">원</span></strong>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <h2 className="text-sm font-bold">계좌이체 안내</h2>
            <dl className="mt-5 space-y-3">
              <Row label="은행명" value={BANK_DETAILS.bankName} />
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-white/38">계좌번호</dt>
                <dd className="flex items-center gap-2 text-right text-sm font-semibold">
                  {BANK_DETAILS.accountNumber}
                  {bankReady && <button type="button" onClick={copyAccount} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 hover:text-white" aria-label="계좌번호 복사"><Clipboard size={14} /></button>}
                </dd>
              </div>
              <Row label="예금주" value={BANK_DETAILS.accountHolder} />
            </dl>
            {!bankReady && (
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/8 p-4 text-xs leading-5 text-amber-100/70">운영 전 관리자에게 실제 은행명, 계좌번호, 예금주 정보를 설정해 달라고 요청하세요.</div>
            )}
          </div>
        </section>

        {reported ? (
          <section className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-300" size={28} />
            <h2 className="mt-3 text-base font-bold">입금 알림을 접수했습니다.</h2>
            <p className="mt-2 text-xs leading-5 text-white/45"><strong className="text-white/70">{registration.payerName}</strong> 님의 입금 확인 후 참가가 확정됩니다.</p>
          </section>
        ) : (
          <form onSubmit={submitPayment} className="mt-4 rounded-2xl border border-white/10 bg-[#151516] p-5 sm:p-7">
            <label className="field-label">입금자명 <span className="required">필수</span>
              <input className="field-input" value={payerName} onChange={event => setPayerName(event.target.value)} placeholder="실제 입금자명" minLength={2} maxLength={100} required />
            </label>
            <button type="submit" disabled={reportPayment.isPending} className="primary-button mt-5 w-full">
              {reportPayment.isPending ? "처리 중..." : "입금 완료했습니다"}
              {!reportPayment.isPending && <Check size={18} />}
            </button>
          </form>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/[0.035] p-4 text-[11px] leading-5 text-white/38">
          <Clock3 size={15} className="mt-0.5 shrink-0 text-[#c9a15a]" /> 입금 확인은 순차적으로 처리됩니다. 신청자명과 입금자명이 다르면 반드시 실제 입금자명을 입력해 주세요.
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/25"><ShieldCheck size={13} /> 결제정보는 참가 확인 목적으로만 사용됩니다.</div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-5"><dt className="text-xs text-white/38">{label}</dt><dd className="text-right text-sm font-semibold">{value}</dd></div>;
}
