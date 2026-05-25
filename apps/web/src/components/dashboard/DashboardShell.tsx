"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Activity,
  AlertTriangle,
  AreaChart as AreaChartIcon,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Database,
  Edit3,
  Flag,
  Gauge,
  Globe2,
  KeyRound,
  Layers3,
  LineChart as LineChartIcon,
  LockKeyhole,
  Mail,
  MessageSquare,
  PieChart as PieChartIcon,
  Radar,
  Save,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  Workflow,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar as RadarShape,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis
} from "recharts";
import { toast } from "sonner";
import { ZyNexApiError, zynexApi } from "@/lib/api";

type DashboardPage =
  | "overview"
  | "profile"
  | "conversations"
  | "inference"
  | "providers"
  | "recharge"
  | "billing"
  | "security"
  | "sessions"
  | "alerts"
  | "audit"
  | "datasets"
  | "settings";

type ApiUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
  role?: string;
  statusCode?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  profile?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    avatarUrl?: string | null;
  } | null;
};

const navItems: Array<{ id: DashboardPage; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <Gauge size={18} /> },
  { id: "profile", label: "My Profile", icon: <UserRound size={18} /> },
  { id: "conversations", label: "Conversations", icon: <MessageSquare size={18} /> },
  { id: "inference", label: "Inference Logs", icon: <ClipboardList size={18} /> },
  { id: "providers", label: "Providers", icon: <Bot size={18} /> },
  { id: "recharge", label: "Recharge", icon: <CircleDollarSign size={18} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} /> },
  { id: "security", label: "Security", icon: <ShieldCheck size={18} /> },
  { id: "sessions", label: "Sessions", icon: <Workflow size={18} /> },
  { id: "alerts", label: "Alerts", icon: <Bell size={18} /> },
  { id: "audit", label: "Audit Trail", icon: <Activity size={18} /> },
  { id: "datasets", label: "Datasets", icon: <Database size={18} /> },
  { id: "settings", label: "Settings", icon: <Layers3 size={18} /> }
];

const latency = [
  { time: "09:00", avg: 312, p95: 720, errors: 3 },
  { time: "10:00", avg: 348, p95: 812, errors: 5 },
  { time: "11:00", avg: 302, p95: 760, errors: 2 },
  { time: "12:00", avg: 406, p95: 908, errors: 6 },
  { time: "13:00", avg: 378, p95: 850, errors: 4 },
  { time: "14:00", avg: 334, p95: 790, errors: 2 }
];

const providerMix = [
  { name: "Claude", value: 42, color: "#4F46E5" },
  { name: "OpenAI", value: 31, color: "#06B6D4" },
  { name: "Gemini", value: 17, color: "#10B981" },
  { name: "Mistral", value: 10, color: "#64748B" }
];

const tokenUsage = [
  { day: "Mon", prompt: 42, completion: 28, cache: 18 },
  { day: "Tue", prompt: 58, completion: 34, cache: 26 },
  { day: "Wed", prompt: 53, completion: 39, cache: 22 },
  { day: "Thu", prompt: 71, completion: 48, cache: 35 },
  { day: "Fri", prompt: 66, completion: 44, cache: 31 },
  { day: "Sat", prompt: 38, completion: 24, cache: 17 }
];

const rechargeTrend = [
  { date: "01", credits: 1200, spend: 890, bonus: 80 },
  { date: "05", credits: 1800, spend: 1120, bonus: 120 },
  { date: "10", credits: 2400, spend: 1380, bonus: 160 },
  { date: "15", credits: 2100, spend: 1540, bonus: 140 },
  { date: "20", credits: 3100, spend: 1980, bonus: 240 },
  { date: "25", credits: 3800, spend: 2320, bonus: 310 }
];

const riskRadar = [
  { metric: "PII", value: 82 },
  { metric: "Prompt", value: 68 },
  { metric: "Access", value: 91 },
  { metric: "Billing", value: 74 },
  { metric: "Latency", value: 64 },
  { metric: "Errors", value: 58 }
];

const scatter = [
  { tokens: 600, latency: 410 },
  { tokens: 980, latency: 520 },
  { tokens: 1240, latency: 680 },
  { tokens: 1800, latency: 790 },
  { tokens: 2200, latency: 930 },
  { tokens: 3100, latency: 1190 }
];

const rows = [
  ["ZyNexReq9001", "Claude", "Success", "812ms", "12.4k"],
  ["ZyNexReq9002", "OpenAI", "Success", "640ms", "8.8k"],
  ["ZyNexReq9003", "Gemini", "Retry", "1.2s", "18.1k"],
  ["ZyNexReq9004", "Claude", "Success", "732ms", "9.3k"]
];

export function DashboardShell() {
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const pageTitle = navItems.find((item) => item.id === activePage)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[282px] shrink-0 border-r border-[#E8EEF7] bg-white px-3 py-4 lg:block">
          <div className="flex items-center gap-3 px-2">
            <img src="/assets/zynex-logos/zynex_favicon.svg" alt="ZyNex" className="h-10 w-10 rounded-full" />
            <div>
              <p className="font-display text-3xl font-bold leading-none">ZyNex</p>
              <p className="font-body text-xs font-semibold text-[#64748B]">Control dashboard</p>
            </div>
          </div>
          <nav className="mt-7 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left font-body text-sm font-semibold transition ${
                  activePage === item.id ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]"
                }`}
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {activePage === item.id && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#E8EEF7] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">Production analytics</p>
                <h1 className="font-display text-3xl font-semibold leading-none sm:text-4xl">{pageTitle}</h1>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#E8EEF7] bg-[#F8FAFC] px-3 py-2 font-body text-xs font-semibold text-[#475569]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live workspace
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`shrink-0 rounded-full border px-3 py-2 font-body text-xs font-semibold ${
                    activePage === item.id ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-[#E8EEF7] bg-white text-[#475569]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4 sm:p-6">
            {activePage === "overview" && <OverviewPage />}
            {activePage === "profile" && <ProfilePage />}
            {activePage === "conversations" && <StaticPage kind="conversations" />}
            {activePage === "inference" && <StaticPage kind="inference" />}
            {activePage === "providers" && <StaticPage kind="providers" />}
            {activePage === "recharge" && <RechargePage />}
            {activePage === "billing" && <StaticPage kind="billing" />}
            {activePage === "security" && <StaticPage kind="security" />}
            {activePage === "sessions" && <StaticPage kind="sessions" />}
            {activePage === "alerts" && <StaticPage kind="alerts" />}
            {activePage === "audit" && <StaticPage kind="audit" />}
            {activePage === "datasets" && <StaticPage kind="datasets" />}
            {activePage === "settings" && <StaticPage kind="settings" />}
          </div>
        </main>
      </div>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<MessageSquare />} label="Conversations" value="18,420" delta="+12.8%" />
        <MetricCard icon={<Clock3 />} label="P95 latency" value="908ms" delta="-4.1%" />
        <MetricCard icon={<Sparkles />} label="Tokens used" value="4.8M" delta="+18.2%" />
        <MetricCard icon={<AlertTriangle />} label="Error rate" value="0.38%" delta="-0.06%" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <ChartCard title="Latency and errors" icon={<AreaChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={latency}>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="p95" fill="#EEF2FF" stroke="#4F46E5" />
              <Line type="monotone" dataKey="avg" stroke="#06B6D4" strokeWidth={2} />
              <Bar dataKey="errors" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Provider mix" icon={<PieChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={providerMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>
                {providerMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard title="Token usage" icon={<BarChart3 size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tokenUsage}>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="prompt" stackId="a" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completion" stackId="a" fill="#06B6D4" />
              <Bar dataKey="cache" stackId="a" fill="#94A3B8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Risk radar" icon={<Radar size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={riskRadar}>
              <PolarGrid stroke="#E8EEF7" />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <RadarShape dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.24} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Token to latency" icon={<LineChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="tokens" name="Tokens" />
              <YAxis dataKey="latency" name="Latency" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatter} fill="#4F46E5" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable title="Recent inference requests" columns={["Request", "Provider", "Status", "Latency", "Tokens"]} rows={rows} />
    </div>
  );
}

function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changeModal, setChangeModal] = useState<null | "email" | "phone">(null);
  const [pendingValue, setPendingValue] = useState("");
  const [otp, setOtp] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const profile = useMemo(() => {
    const fallbackName = session?.user?.name || "ZyNex Operator";
    const [firstName = "ZyNex", ...rest] = fallbackName.split(/\s+/);
    return {
      firstName: user?.profile?.firstName || firstName,
      lastName: user?.profile?.lastName || rest.join(" ") || "User",
      email: user?.email || session?.user?.email || "",
      phoneCountryCode: user?.phoneCountryCode || "+91",
      phoneNumber: user?.phoneNumber || "",
      dateOfBirth: user?.profile?.dateOfBirth?.slice(0, 10) || "",
      role: user?.role || "MEMBER",
      statusCode: user?.statusCode || "01"
    };
  }, [session?.user, user]);

  const [form, setForm] = useState(profile);

  useEffect(() => {
    zynexApi<ApiUser | null>("/api/v1/auth/ZyNexAPI01AuthMe")
      .then((nextUser) => setUser(nextUser))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  async function saveProfile() {
    try {
      setSaving(true);
      const updated = await zynexApi<ApiUser>("/api/v1/auth/ZyNexAPI01AuthProfile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth || undefined
        })
      });
      setUser(updated);
      setEditing(false);
      toast.success("Code: PROFILE_UPDATED", { description: "Message: Profile saved successfully." });
    } catch (error) {
      showDashboardError(error);
    } finally {
      setSaving(false);
    }
  }

  async function startChange() {
    try {
      if (changeModal === "email") {
        await zynexApi("/api/v1/auth/ZyNexAPI01AuthEmailChangeStart", {
          method: "POST",
          body: JSON.stringify({ newEmail: pendingValue })
        });
      } else {
        await zynexApi("/api/v1/auth/ZyNexAPI01AuthPhoneChangeStart", {
          method: "POST",
          body: JSON.stringify({ countryCode: "+91", phoneNumber: pendingValue.replace(/\D/g, "") })
        });
      }
      toast.success("Code: OTP_SENT", { description: "Message: Verification code sent." });
    } catch (error) {
      showDashboardError(error);
    }
  }

  async function verifyChange() {
    try {
      const updated = changeModal === "email"
        ? await zynexApi<ApiUser>("/api/v1/auth/ZyNexAPI01AuthEmailChangeVerify", {
          method: "POST",
          body: JSON.stringify({ newEmail: pendingValue, code: otp })
        })
        : await zynexApi<ApiUser>("/api/v1/auth/ZyNexAPI01AuthPhoneChangeVerify", {
          method: "POST",
          body: JSON.stringify({ countryCode: "+91", phoneNumber: pendingValue.replace(/\D/g, ""), code: otp })
        });
      setUser(updated);
      setChangeModal(null);
      setPendingValue("");
      setOtp("");
      toast.success("Code: CONTACT_UPDATED", { description: "Message: Contact detail verified and updated." });
    } catch (error) {
      showDashboardError(error);
    }
  }

  const deletePhrase = `delete my profile ${profile.firstName} ${profile.lastName}`;

  async function deleteAccount() {
    try {
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthAccount", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });
      toast.success("Code: ACCOUNT_DELETED", { description: "Message: Your account and related data were permanently deleted." });
      window.location.href = "/";
    } catch (error) {
      showDashboardError(error);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">My profile</p>
            <h2 className="font-display text-3xl font-semibold">Personal and contact details</h2>
          </div>
          <button
            type="button"
            onClick={() => editing ? saveProfile() : setEditing(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111827] px-4 font-body text-sm font-semibold text-white"
          >
            {editing ? <Save size={16} /> : <Edit3 size={16} />}
            {editing ? saving ? "Saving" : "Save" : "Edit"}
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProfileInput label="First name" value={form.firstName} disabled={!editing} onChange={(value) => setForm({ ...form, firstName: value })} icon={<UserRound size={17} />} />
          <ProfileInput label="Last name" value={form.lastName} disabled={!editing} onChange={(value) => setForm({ ...form, lastName: value })} icon={<UserRound size={17} />} />
          <ProfileInput label="Email address" value={form.email} disabled onChange={() => {}} icon={<Mail size={17} />} action={editing ? "Change" : undefined} onAction={() => { setChangeModal("email"); setPendingValue(form.email); }} />
          <ProfileInput label="Phone number" value={form.phoneNumber ? `🇮🇳 +91 ${form.phoneNumber}` : "Not added"} disabled onChange={() => {}} icon={<Smartphone size={17} />} action={editing ? "Change" : undefined} onAction={() => { setChangeModal("phone"); setPendingValue(form.phoneNumber); }} />
          <ProfileInput label="Date of birth" value={form.dateOfBirth} disabled={!editing} onChange={(value) => setForm({ ...form, dateOfBirth: value })} icon={<Clock3 size={17} />} type="date" />
          <ProfileInput label="Country" value="🇮🇳 India" disabled onChange={() => {}} icon={<Flag size={17} />} />
          <ProfileInput label="Role" value={form.role} disabled onChange={() => {}} icon={<LockKeyhole size={17} />} />
          <ProfileInput label="Status" value={form.statusCode === "01" ? "Active" : form.statusCode} disabled onChange={() => {}} icon={<CheckCircle2 size={17} />} />
        </div>
      </Panel>
      <Panel>
        <div className="grid place-items-center text-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#111827] font-display text-3xl font-bold text-white">
            {session?.user?.image ? <img src={session.user.image} alt="" className="h-full w-full object-cover" /> : `${profile.firstName[0] || "Z"}${profile.lastName[0] || "N"}`.toUpperCase()}
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold">{profile.firstName} {profile.lastName}</h3>
          <p className="mt-1 font-body text-sm text-[#64748B]">{profile.email || "No email connected"}</p>
        </div>
        <div className="mt-6 space-y-3">
          <StatusRow label="Email verified" value={Boolean(profile.email)} />
          <StatusRow label="Phone connected" value={Boolean(profile.phoneNumber)} />
          <StatusRow label="Two active sessions max" value />
          <StatusRow label="Notification emails" value />
        </div>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-body text-sm font-bold text-red-700">Danger zone</p>
          <p className="mt-1 font-body text-xs leading-5 text-red-700/80">
            Permanently delete your profile, sessions, conversations, inference logs, billing references, and account records.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-3 h-10 rounded-full bg-red-600 px-4 font-body text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete my profile
          </button>
        </div>
      </Panel>
      {changeModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E8EEF7] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">Verify change</p>
                <h3 className="font-display text-2xl font-semibold">Change {changeModal}</h3>
              </div>
              <button type="button" onClick={() => setChangeModal(null)} className="grid h-9 w-9 place-items-center rounded-full border border-[#E8EEF7]"><X size={17} /></button>
            </div>
            <div className="mt-5 space-y-3">
              <ProfileInput label={changeModal === "email" ? "New email" : "New phone"} value={pendingValue} disabled={false} onChange={setPendingValue} icon={changeModal === "email" ? <Mail size={17} /> : <Smartphone size={17} />} />
              <button type="button" onClick={startChange} className="h-10 w-full rounded-full border border-[#DDE5F0] font-body text-sm font-semibold text-[#253248]">Send verification code</button>
              <ProfileInput label="Verification code" value={otp} disabled={false} onChange={setOtp} icon={<KeyRound size={17} />} />
              <button type="button" onClick={verifyChange} className="h-10 w-full rounded-full bg-[#4F46E5] font-body text-sm font-semibold text-white">Verify and update</button>
            </div>
          </div>
        </div>
      )}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-xs font-bold uppercase text-red-600">Permanent deletion</p>
                <h3 className="font-display text-2xl font-semibold">Delete your ZyNex profile?</h3>
              </div>
              <button type="button" onClick={() => setDeleteOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#E8EEF7]"><X size={17} /></button>
            </div>
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-body text-sm leading-6 text-red-800">
              This action permanently removes your profile, login sessions, provider accounts, terms records, conversations,
              messages, inference logs, redaction events, error events, and verification records. You will lose access immediately.
            </div>
            <label className="mt-4 block">
              <span className="font-body text-sm font-semibold text-[#334155]">
                Type <span className="font-bold text-red-600">"{deletePhrase}"</span> to confirm.
              </span>
              <input
                value={deleteConfirmation}
                onPaste={(event) => event.preventDefault()}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-[#DDE5F0] px-3 font-body text-sm font-semibold outline-none focus:border-red-500"
              />
            </label>
            <button
              type="button"
              disabled={deleteConfirmation !== deletePhrase}
              onClick={deleteAccount}
              className="mt-4 h-11 w-full rounded-full bg-red-600 font-body text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Permanently delete my profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RechargePage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <RechargePlan name="Starter" credits="25K" price="₹499" tone="slate" />
        <RechargePlan name="Growth" credits="150K" price="₹1,999" tone="indigo" />
        <RechargePlan name="Scale" credits="600K" price="₹6,999" tone="cyan" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Recharge credits vs spend" icon={<AreaChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={rechargeTrend}>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="credits" stroke="#4F46E5" fill="#EEF2FF" />
              <Area dataKey="spend" stroke="#06B6D4" fill="#ECFEFF" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Credit utilization" icon={<PieChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={320}>
            <RadialBarChart innerRadius="24%" outerRadius="88%" data={[{ name: "Used", value: 68, fill: "#4F46E5" }, { name: "Reserved", value: 22, fill: "#06B6D4" }, { name: "Bonus", value: 10, fill: "#94A3B8" }]}>
              <RadialBar dataKey="value" cornerRadius={8} />
              <Legend />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable title="Recharge history" columns={["Invoice", "Plan", "Credits", "Amount", "Status"]} rows={[
        ["INV-2026-051", "Growth", "150K", "₹1,999", "Paid"],
        ["INV-2026-042", "Starter", "25K", "₹499", "Paid"],
        ["INV-2026-037", "Bonus", "10K", "₹0", "Applied"]
      ]} />
    </div>
  );
}

function StaticPage({ kind }: { kind: Exclude<DashboardPage, "overview" | "profile" | "recharge"> }) {
  const config = staticPageConfig[kind];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {config.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title={config.chartTitle} icon={config.icon}>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={latency}>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line dataKey="avg" stroke="#4F46E5" strokeWidth={2} />
              <Line dataKey="p95" stroke="#06B6D4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Panel>
          <h3 className="font-display text-2xl font-semibold">{config.sideTitle}</h3>
          <div className="mt-4 space-y-3">
            {config.items.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E8EEF7] bg-[#F8FAFC] p-3">
                <CheckCircle2 size={17} className="text-emerald-500" />
                <span className="font-body text-sm font-semibold text-[#334155]">{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <DataTable title={config.tableTitle} columns={config.columns} rows={config.rows} />
    </div>
  );
}

const staticPageConfig: Record<Exclude<DashboardPage, "overview" | "profile" | "recharge">, {
  icon: React.ReactNode;
  chartTitle: string;
  sideTitle: string;
  tableTitle: string;
  metrics: Array<{ icon: React.ReactNode; label: string; value: string; delta: string }>;
  items: string[];
  columns: string[];
  rows: string[][];
}> = {
  conversations: pageConfig(<MessageSquare />, "Conversation depth", "Workflow coverage", "Conversation queue"),
  inference: pageConfig(<ClipboardList />, "Inference latency", "Trace completeness", "Inference log stream"),
  providers: pageConfig(<Server />, "Provider health", "Model routing", "Provider matrix"),
  billing: pageConfig(<CreditCard />, "Billing trend", "Payment controls", "Billing entries"),
  security: pageConfig(<ShieldCheck />, "Security posture", "Access policies", "Security checks"),
  sessions: pageConfig(<Workflow />, "Session activity", "Session policy", "Session list"),
  alerts: pageConfig(<Bell />, "Alert volume", "Notification routes", "Alert inbox"),
  audit: pageConfig(<Activity />, "Audit events", "Compliance signals", "Audit records"),
  datasets: pageConfig(<Database />, "Dataset ingestion", "Storage health", "Dataset registry"),
  settings: pageConfig(<Globe2 />, "Configuration drift", "Environment controls", "Config values")
};

function pageConfig(icon: React.ReactNode, chartTitle: string, sideTitle: string, tableTitle: string) {
  return {
    icon,
    chartTitle,
    sideTitle,
    tableTitle,
    metrics: [
      { icon, label: "Active", value: "128", delta: "+8.2%" },
      { icon: <CheckCircle2 />, label: "Healthy", value: "99.6%", delta: "+1.1%" },
      { icon: <AlertTriangle />, label: "Needs review", value: "7", delta: "-3" }
    ],
    items: ["Policy aligned", "Exports enabled", "Owner assigned", "Last reviewed today"],
    columns: ["ID", "Owner", "State", "Updated", "Score"],
    rows: [
      ["ZYN-001", "Platform", "Active", "Today", "98"],
      ["ZYN-002", "Security", "Review", "Yesterday", "86"],
      ["ZYN-003", "Ops", "Active", "2 days ago", "91"]
    ]
  };
}

function MetricCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">{icon}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-1 font-body text-xs font-bold text-emerald-600">{delta}</span>
      </div>
      <p className="mt-4 font-body text-sm font-semibold text-[#64748B]">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </Panel>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">{icon}</span>
        <h3 className="font-body text-sm font-bold uppercase text-[#334155]">{title}</h3>
      </div>
      {children}
    </Panel>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-[#E8EEF7] bg-white p-5 shadow-[0_18px_50px_rgba(15,36,66,0.06)] ${className}`}>{children}</section>;
}

function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <Panel>
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-[#E8EEF7] text-left font-body text-xs font-bold uppercase text-[#64748B]">
              {columns.map((column) => <th key={column} className="py-3 pr-4">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-b border-[#F1F5F9] font-body text-sm font-semibold text-[#334155]">
                {row.map((cell) => <td key={cell} className="py-3 pr-4">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ProfileInput({ label, value, disabled, onChange, icon, action, onAction, type = "text" }: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  action?: string;
  onAction?: () => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="font-body text-xs font-bold uppercase text-[#64748B]">{label}</span>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-[#DDE5F0] bg-white px-3">
        <span className="text-[#64748B]">{icon}</span>
        <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent font-body text-sm font-semibold text-[#111827] outline-none disabled:text-[#475569]" />
        {action && <button type="button" onClick={onAction} className="font-body text-xs font-bold text-[#4F46E5]">{action}</button>}
      </div>
    </label>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E8EEF7] p-3">
      <span className="font-body text-sm font-semibold text-[#334155]">{label}</span>
      <CheckCircle2 size={18} className={value ? "text-emerald-500" : "text-slate-300"} />
    </div>
  );
}

function RechargePlan({ name, credits, price, tone }: { name: string; credits: string; price: string; tone: "slate" | "indigo" | "cyan" }) {
  const toneClass = tone === "indigo" ? "border-[#4F46E5] bg-[#EEF2FF]" : tone === "cyan" ? "border-cyan-200 bg-cyan-50" : "border-[#E8EEF7] bg-white";
  return (
    <section className={`rounded-lg border p-5 shadow-[0_18px_50px_rgba(15,36,66,0.06)] ${toneClass}`}>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">{name}</p>
      <p className="mt-3 font-display text-4xl font-semibold">{credits}</p>
      <p className="mt-1 font-body text-sm font-semibold text-[#64748B]">AI credits</p>
      <div className="mt-5 flex items-end justify-between">
        <span className="font-display text-3xl font-semibold">{price}</span>
        <button type="button" className="rounded-full bg-[#111827] px-4 py-2 font-body text-sm font-semibold text-white">Recharge</button>
      </div>
    </section>
  );
}

function showDashboardError(error: unknown) {
  if (error instanceof ZyNexApiError) {
    toast.error(`Code: ${error.code}`, { description: `Message: ${error.message}` });
    return;
  }
  toast.error("Code: SYS001", { description: `Message: ${error instanceof Error ? error.message : "Unexpected dashboard error"}` });
}
