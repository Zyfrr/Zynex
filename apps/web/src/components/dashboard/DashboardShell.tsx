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

type AnalyticsOverview = {
  totalInferenceCalls: number;
  totalConversations: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  totalTokens: number;
  providerMix: Array<{ name: string; value: number }>;
  latencyTrend: Array<{ time: string; avg: number; p95: number; errors: number; tokens: number }>;
  tokenTrend: Array<{ day: string; prompt: number; completion: number; cache: number }>;
  recentLogs: Array<{ requestId: string; provider: string; model: string; status: string; latencyMs: number; totalTokens: number; createdAt: string }>;
  recentConversations: Array<{ id: string; title: string; status: string; provider: string; model: string; updatedAt: string; lastMessage: string; lastLatencyMs: number; lastTokens: number }>;
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

const dashboardCodes: Record<DashboardPage, string> = {
  overview: "overview",
  profile: "profile",
  conversations: "conversations",
  inference: "inference-logs",
  providers: "providers",
  recharge: "recharge",
  billing: "billing",
  security: "security",
  sessions: "sessions",
  alerts: "alerts",
  audit: "audit-trail",
  datasets: "datasets",
  settings: "settings"
};

function decodeDashboardPage(code: string | null): DashboardPage | null {
  if (!code) return null;
  const legacyCodes: Record<string, DashboardPage> = {
    "mp_%x9": "profile",
    "mp_%25x9": "profile",
    "st_%x9": "settings",
    "st_%25x9": "settings"
  };
  return legacyCodes[code] || (Object.entries(dashboardCodes).find(([, value]) => value === code)?.[0] as DashboardPage | undefined) || null;
}

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
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const pageTitle = navItems.find((item) => item.id === activePage)?.label || "Dashboard";

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("zx");
    const page = decodeDashboardPage(code);
    if (page) setActivePage(page);
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setAnalyticsLoading(true);
        setAnalytics(await zynexApi<AnalyticsOverview>("/api/v1/analytics/ZyNexAPI01AnalyticsOverview"));
      } catch (error) {
        showDashboardError(error);
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    void loadAnalytics();
  }, []);

  function navigateDashboard(page: DashboardPage, mode?: string) {
    setActivePage(page);
    const params = new URLSearchParams();
    params.set("zx", dashboardCodes[page]);
    if (mode) params.set("cb", mode);
    window.history.pushState(null, "", `/dashboard?${params.toString()}`);
  }

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
                onClick={() => navigateDashboard(item.id)}
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
              <button
                type="button"
                onClick={() => { window.location.href = "/workspace"; }}
                className="rounded-full border border-[#E8EEF7] bg-white px-3 py-2 font-body text-xs font-semibold text-[#475569] hover:border-[#4F46E5] hover:text-[#4F46E5]"
              >
                Back to workspace
              </button>
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
                  onClick={() => navigateDashboard(item.id)}
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
            {activePage === "overview" && <OverviewPage analytics={analytics} loading={analyticsLoading} />}
            {activePage === "profile" && <ProfilePage onEditRoute={() => navigateDashboard("profile", "edit-profile")} />}
            {activePage === "conversations" && <ConversationsDashboardPage analytics={analytics} loading={analyticsLoading} />}
            {activePage === "inference" && <InferenceDashboardPage analytics={analytics} loading={analyticsLoading} />}
            {activePage === "providers" && <ProvidersDashboardPage analytics={analytics} loading={analyticsLoading} />}
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

function OverviewPage({ analytics, loading }: { analytics: AnalyticsOverview | null; loading: boolean }) {
  const liveLatency = analytics?.latencyTrend?.length ? analytics.latencyTrend : emptyLatencyTrend();
  const liveProviderMix = withProviderColors(analytics?.providerMix);
  const liveTokenUsage = analytics?.tokenTrend?.length ? analytics.tokenTrend : emptyTokenTrend();
  const liveRows = analyticsRows(analytics);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<MessageSquare />} label="Conversations" value={loading ? "..." : formatNumber(analytics?.totalConversations || 0)} delta="Live" />
        <MetricCard icon={<Clock3 />} label="P95 latency" value={loading ? "..." : `${analytics?.p95LatencyMs || 0}ms`} delta="Live" />
        <MetricCard icon={<Sparkles />} label="Tokens used" value={loading ? "..." : formatNumber(analytics?.totalTokens || 0)} delta="Live" />
        <MetricCard icon={<AlertTriangle />} label="Error rate" value={loading ? "..." : `${analytics?.errorRate || 0}%`} delta="Live" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <ChartCard title="Latency and errors" icon={<AreaChartIcon size={18} />}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={liveLatency}>
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
              <Pie data={liveProviderMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>
                {liveProviderMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
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
            <BarChart data={liveTokenUsage}>
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
      <DataTable title="Recent inference requests" columns={["Request", "Provider", "Status", "Latency", "Tokens"]} rows={liveRows} />
    </div>
  );
}

function ProfilePage({ onEditRoute }: { onEditRoute: () => void }) {
  const { data: session } = useSession();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changeModal, setChangeModal] = useState<null | "email" | "phone">(null);
  const [pendingValue, setPendingValue] = useState("");
  const [otp, setOtp] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

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

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Code: VAL001", { description: "Message: New password and confirm password do not match." });
      return;
    }
    try {
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthChangePassword", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      toast.success("Code: PASSWORD_CHANGED", { description: "Message: Password changed. Please login again." });
      window.location.href = "/Login";
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
            onClick={() => {
              if (editing) void saveProfile();
              else {
                setEditing(true);
                onEditRoute();
              }
            }}
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
        <button
          type="button"
          onClick={() => setPasswordOpen(true)}
          className="mt-5 h-10 w-full rounded-full border border-[#DDE5F0] font-body text-sm font-semibold text-[#253248] hover:border-[#4F46E5] hover:text-[#4F46E5]"
        >
          Change password
        </button>
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
      {passwordOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E8EEF7] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">Password security</p>
                <h3 className="font-display text-2xl font-semibold">Change password</h3>
              </div>
              <button type="button" onClick={() => setPasswordOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#E8EEF7]"><X size={17} /></button>
            </div>
            <div className="mt-5 space-y-3">
              <ProfileInput label="Current password" value={passwordForm.currentPassword} disabled={false} onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} icon={<KeyRound size={17} />} type="password" />
              <ProfileInput label="New password" value={passwordForm.newPassword} disabled={false} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} icon={<KeyRound size={17} />} type="password" />
              <ProfileInput label="Confirm password" value={passwordForm.confirmPassword} disabled={false} onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })} icon={<KeyRound size={17} />} type="password" />
              <button type="button" onClick={changePassword} className="h-10 w-full rounded-full bg-[#4F46E5] font-body text-sm font-semibold text-white">Save password</button>
            </div>
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

function ConversationsDashboardPage({ analytics, loading }: { analytics: AnalyticsOverview | null; loading: boolean }) {
  const config = staticPageConfig.conversations;
  const [likedChats, setLikedChats] = useState<Array<{ id: string; title: string; preview: string; likedAt: string }>>([]);
  const conversationRows = analytics?.recentConversations?.length
    ? analytics.recentConversations.map((conversation) => [
        conversation.title,
        conversation.provider,
        conversation.status,
        `${conversation.lastLatencyMs || 0}ms`,
        formatDate(conversation.updatedAt)
      ])
    : [["No conversations yet", "Start chatting", "Empty", "0ms", "-"]];

  useEffect(() => {
    function loadLikedChats() {
      try {
        setLikedChats(JSON.parse(window.localStorage.getItem("zynex-liked-chats") || "[]"));
      } catch {
        setLikedChats([]);
      }
    }

    loadLikedChats();
    window.addEventListener("zynex-liked-chats-updated", loadLikedChats);
    window.addEventListener("storage", loadLikedChats);
    return () => {
      window.removeEventListener("zynex-liked-chats-updated", loadLikedChats);
      window.removeEventListener("storage", loadLikedChats);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<MessageSquare />} label="Total conversations" value={loading ? "..." : formatNumber(analytics?.totalConversations || 0)} delta="Live" />
        <MetricCard icon={<Sparkles />} label="Liked responses" value={formatNumber(likedChats.length)} delta="Local" />
        <MetricCard icon={<Clock3 />} label="Avg latency" value={loading ? "..." : `${analytics?.averageLatencyMs || 0}ms`} delta="Live" />
      </div>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">Liked responses</p>
            <h3 className="font-display text-2xl font-semibold">Chats marked useful</h3>
          </div>
          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 font-body text-xs font-bold text-[#4F46E5]">{likedChats.length} saved</span>
        </div>
        <div className="mt-4 grid gap-3">
          {likedChats.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#DDE5F0] bg-[#F8FAFC] p-4 font-body text-sm font-semibold text-[#64748B]">
              Like an assistant response in the workspace to pin it here for review.
            </p>
          ) : (
            likedChats.map((chat) => (
              <article key={chat.id} className="rounded-xl border border-[#E8EEF7] bg-[#F8FAFC] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-body text-sm font-bold text-[#111827]">{chat.title}</h4>
                  <span className="font-body text-xs font-semibold text-[#64748B]">{new Date(chat.likedAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 line-clamp-2 font-body text-sm leading-6 text-[#475569]">{chat.preview}</p>
              </article>
            ))
          )}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title={config.chartTitle} icon={config.icon}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.latencyTrend?.length ? analytics.latencyTrend : emptyLatencyTrend()}>
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
      <DataTable title="Recent conversations" columns={["Title", "Provider", "State", "Last latency", "Updated"]} rows={conversationRows} />
    </div>
  );
}

function InferenceDashboardPage({ analytics, loading }: { analytics: AnalyticsOverview | null; loading: boolean }) {
  const config = staticPageConfig.inference;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<ClipboardList />} label="Inference calls" value={loading ? "..." : formatNumber(analytics?.totalInferenceCalls || 0)} delta="Live" />
        <MetricCard icon={<Clock3 />} label="Average latency" value={loading ? "..." : `${analytics?.averageLatencyMs || 0}ms`} delta="Live" />
        <MetricCard icon={<AlertTriangle />} label="Error rate" value={loading ? "..." : `${analytics?.errorRate || 0}%`} delta="Live" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title={config.chartTitle} icon={config.icon}>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={analytics?.latencyTrend?.length ? analytics.latencyTrend : emptyLatencyTrend()}>
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
          <h3 className="font-display text-2xl font-semibold">Live log health</h3>
          <div className="mt-4 space-y-3">
            {[
              `Total tokens: ${formatNumber(analytics?.totalTokens || 0)}`,
              `Recent logs: ${formatNumber(analytics?.recentLogs?.length || 0)}`,
              `P95 latency: ${analytics?.p95LatencyMs || 0}ms`,
              `Error rate: ${analytics?.errorRate || 0}%`
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E8EEF7] bg-[#F8FAFC] p-3">
                <CheckCircle2 size={17} className="text-emerald-500" />
                <span className="font-body text-sm font-semibold text-[#334155]">{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <DataTable title="Inference log stream" columns={["Request", "Provider", "Status", "Latency", "Tokens"]} rows={analyticsRows(analytics)} />
    </div>
  );
}

function ProvidersDashboardPage({ analytics, loading }: { analytics: AnalyticsOverview | null; loading: boolean }) {
  const config = staticPageConfig.providers;
  const liveProviderMix = withProviderColors(analytics?.providerMix);
  const providerRows = liveProviderMix.map((provider) => [
    provider.name,
    String(provider.value),
    `${analytics?.totalInferenceCalls ? Math.round((provider.value / analytics.totalInferenceCalls) * 100) : 0}%`,
    "Active",
    loading ? "..." : `${analytics?.averageLatencyMs || 0}ms avg`
  ]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<Server />} label="Active providers" value={loading ? "..." : formatNumber(liveProviderMix.length)} delta="Live" />
        <MetricCard icon={<Sparkles />} label="Provider calls" value={loading ? "..." : formatNumber(analytics?.totalInferenceCalls || 0)} delta="Live" />
        <MetricCard icon={<Clock3 />} label="Avg provider latency" value={loading ? "..." : `${analytics?.averageLatencyMs || 0}ms`} delta="Live" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title={config.chartTitle} icon={config.icon}>
          <ResponsiveContainer width="100%" height={310}>
            <PieChart>
              <Pie data={liveProviderMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>
                {liveProviderMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <Panel>
          <h3 className="font-display text-2xl font-semibold">Model routing</h3>
          <div className="mt-4 space-y-3">
            {(analytics?.recentLogs || []).slice(0, 4).map((log) => (
              <div key={log.requestId} className="rounded-xl border border-[#E8EEF7] bg-[#F8FAFC] p-3">
                <p className="font-body text-sm font-bold text-[#111827]">{log.provider}</p>
                <p className="mt-1 truncate font-body text-xs font-semibold text-[#64748B]">{log.model}</p>
              </div>
            ))}
            {!analytics?.recentLogs?.length && <p className="font-body text-sm font-semibold text-[#64748B]">No provider calls yet.</p>}
          </div>
        </Panel>
      </div>
      <DataTable title="Provider matrix" columns={["Provider", "Calls", "Share", "State", "Latency"]} rows={providerRows.length ? providerRows : [["No provider data", "0", "0%", "Waiting", "0ms"]]} />
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

function withProviderColors(items?: Array<{ name: string; value: number }>) {
  const palette = ["#4F46E5", "#06B6D4", "#10B981", "#64748B", "#F59E0B"];
  const values = items?.length ? items : [{ name: "No calls yet", value: 1 }];
  return values.map((item, index) => ({ ...item, color: palette[index % palette.length] }));
}

function analyticsRows(analytics: AnalyticsOverview | null) {
  const logs = analytics?.recentLogs || [];
  if (!logs.length) return [["No requests yet", "Waiting", "Empty", "0ms", "0"]];
  return logs.map((log) => [
    log.requestId,
    log.provider,
    log.status,
    `${log.latencyMs}ms`,
    formatNumber(log.totalTokens)
  ]);
}

function emptyLatencyTrend() {
  return [{ time: "Now", avg: 0, p95: 0, errors: 0, tokens: 0 }];
}

function emptyTokenTrend() {
  return [{ day: "Now", prompt: 0, completion: 0, cache: 0 }];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 100000 ? "compact" : "standard" }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
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
