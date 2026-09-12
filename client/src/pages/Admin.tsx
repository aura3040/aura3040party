import { useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck, CheckCircle2, CircleDollarSign, Loader2, LogIn, LogOut, Search, Users } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { REGISTRATION_STATUS, STATUS_LABELS, type RegistrationStatus } from "@shared/registration";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

const statusStyles: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
  paid: "bg-blue-50 text-blue-700 ring-blue-600/15",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-500/15",
};

export default function Admin() {
  const { user, loading, logout, refresh } = useAuth();
  const isAdmin = user?.role === "admin";
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">("all");
  const utils = trpc.useUtils();
  const adminLogin = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      toast.success("관리자로 로그인했습니다.");
      setPassword("");
      await utils.auth.me.invalidate();
      await refresh();
    },
    onError: error => toast.error(error.message || "로그인에 실패했습니다."),
  });
  const registrations = trpc.registration.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const updateStatus = trpc.registration.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("상태를 변경했습니다.");
      utils.registration.list.invalidate();
    },
    onError: error => toast.error(error.message || "상태 변경에 실패했습니다."),
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (registrations.data ?? []).filter(item => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSearch = !keyword || [item.name, item.nickname, item.phone, item.payerName ?? "", item.referenceCode].some(value => value.toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [registrations.data, search, statusFilter]);

  const summary = useMemo(() => {
    const items = registrations.data ?? [];
    return {
      total: items.length,
      pending: items.filter(item => item.status === "pending").length,
      paid: items.filter(item => item.status === "paid").length,
      confirmed: items.filter(item => item.status === "confirmed").length,
    };
  }, [registrations.data]);

  if (loading) return <Centered><Loader2 className="animate-spin text-[#9a7337]" /></Centered>;

  if (!user) {
    return (
      <Centered>
        <div className="w-full max-w-sm text-center">
          <span className="font-display text-5xl text-gold-gradient">A</span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">자체 관리자 비밀번호로 로그인합니다. Manus 결제가 필요 없습니다.</p>
          <form
            className="mt-7 space-y-3 text-left"
            onSubmit={event => {
              event.preventDefault();
              adminLogin.mutate({ password });
            }}
          >
            <label className="block text-xs font-semibold text-zinc-500">
              관리자 비밀번호
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="admin-input mt-2"
                placeholder="비밀번호 입력"
              />
            </label>
            <button type="submit" disabled={adminLogin.isPending || !password} className="admin-primary w-full disabled:opacity-60">
              {adminLogin.isPending ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
              {adminLogin.isPending ? "로그인 중..." : "로그인"}
            </button>
          </form>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900"><ArrowLeft size={14} /> 신청 화면으로</Link>
        </div>
      </Centered>
    );
  }

  if (!isAdmin) {
    return <Centered><div className="text-center"><h1 className="text-xl font-bold">접근 권한이 없습니다.</h1><p className="mt-2 text-sm text-zinc-500">관리자 계정으로 로그인해 주세요.</p><button onClick={() => logout()} className="admin-primary mt-6">다른 계정으로 로그인</button></div></Centered>;
  }

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#181715]">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3"><span className="font-display text-3xl text-[#9a7337]">A</span><div><p className="text-xs font-bold tracking-[0.14em]">AURA 3040</p><p className="text-[10px] text-zinc-400">신청 관리</p></div></div>
          <div className="flex items-center gap-4"><span className="hidden text-xs text-zinc-500 sm:block">{user.name ?? user.email}</span><button onClick={() => logout()} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-black"><LogOut size={15} /> 로그아웃</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-[#9a7337]">ADMIN</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">참가 신청 관리</h1></div>
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-black"><ArrowLeft size={14} /> 고객 신청 화면</Link>
        </div>

        <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={Users} label="전체 신청" value={summary.total} />
          <SummaryCard icon={CircleDollarSign} label="입금대기" value={summary.pending} />
          <SummaryCard icon={CheckCircle2} label="입금확인" value={summary.paid} />
          <SummaryCard icon={CalendarCheck} label="참가확정" value={summary.confirmed} />
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-black/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input value={search} onChange={event => setSearch(event.target.value)} className="admin-input pl-9" placeholder="이름, 닉네임, 연락처 검색" /></div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as RegistrationStatus | "all")} className="admin-input sm:w-36"><option value="all">전체 상태</option>{REGISTRATION_STATUS.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
          </div>

          {registrations.isLoading ? (
            <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-[#9a7337]" /></div>
          ) : registrations.error ? (
            <div className="p-12 text-center text-sm text-red-600">신청 목록을 불러오지 못했습니다.</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center"><Users className="mx-auto text-zinc-300" /><p className="mt-3 text-sm font-medium">표시할 신청 내역이 없습니다.</p></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1280px] text-left text-xs">
                  <thead className="bg-zinc-50 text-[10px] font-semibold tracking-[0.08em] text-zinc-500"><tr>{["신청일", "참가일", "시간", "이름", "닉네임", "성별", "출생연도", "연락처", "인원", "결제금액", "입금자명", "입금상태", "참가확정상태", "상태관리"].map(label => <th key={label} className="whitespace-nowrap px-4 py-3">{label}</th>)}</tr></thead>
                  <tbody className="divide-y divide-black/6">
                    {filtered.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-50/70">
                        <td className="whitespace-nowrap px-4 py-4 text-zinc-500">{formatDateTime(item.createdAt)}</td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium">{item.eventDate}</td>
                        <td className="px-4 py-4">{item.eventTime}</td>
                        <td className="px-4 py-4 font-semibold">{item.name}</td>
                        <td className="px-4 py-4">{item.nickname}</td>
                        <td className="px-4 py-4">{item.gender === "male" ? "남" : "여"}</td>
                        <td className="px-4 py-4">{item.birthYear}</td>
                        <td className="whitespace-nowrap px-4 py-4">{item.phone}</td>
                        <td className="px-4 py-4">{item.partySize}명</td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">{formatMoney(item.totalAmount)}원</td>
                        <td className="px-4 py-4">{item.payerName || "-"}</td>
                        <td className="px-4 py-4">{item.status === "pending" ? "입금대기" : item.status === "cancelled" ? "-" : "입금확인"}</td>
                        <td className="px-4 py-4">{item.status === "confirmed" ? "참가확정" : item.status === "cancelled" ? "취소" : "대기"}</td>
                        <td className="px-4 py-4"><StatusSelect value={item.status} disabled={updateStatus.isPending} onChange={status => updateStatus.mutate({ id: item.id, status })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-black/8 lg:hidden">
                {filtered.map(item => (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-base font-bold">{item.name} <span className="font-normal text-zinc-400">· {item.nickname}</span></p><p className="mt-1 text-xs text-zinc-500">{item.eventDate} {item.eventTime} · {item.partySize}명</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[item.status]}`}>{STATUS_LABELS[item.status]}</span></div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-black/6 py-4 text-xs"><MobileRow label="신청일" value={formatDateTime(item.createdAt)} /><MobileRow label="성별 / 출생" value={`${item.gender === "male" ? "남" : "여"} / ${item.birthYear}`} /><MobileRow label="연락처" value={item.phone} /><MobileRow label="결제금액" value={`${formatMoney(item.totalAmount)}원`} /><MobileRow label="입금자명" value={item.payerName || "-"} /><MobileRow label="참가상태" value={item.status === "confirmed" ? "참가확정" : item.status === "cancelled" ? "취소" : "대기"} /></dl>
                    <div className="mt-4"><StatusSelect value={item.status} disabled={updateStatus.isPending} onChange={status => updateStatus.mutate({ id: item.id, status })} full /></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-[#f5f4f1] px-5 text-[#181715]">{children}</div>;
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="rounded-xl border border-black/8 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between"><p className="text-xs text-zinc-500">{label}</p><Icon size={17} className="text-[#9a7337]" /></div><p className="mt-4 text-2xl font-bold">{value}<span className="ml-1 text-xs font-normal text-zinc-400">건</span></p></div>;
}

function StatusSelect({ value, onChange, disabled, full = false }: { value: RegistrationStatus; onChange: (status: RegistrationStatus) => void; disabled: boolean; full?: boolean }) {
  return <select value={value} onChange={event => onChange(event.target.value as RegistrationStatus)} disabled={disabled} className={`rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#9a7337] ${full ? "w-full" : "w-28"}`}>{REGISTRATION_STATUS.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>;
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] text-zinc-400">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
