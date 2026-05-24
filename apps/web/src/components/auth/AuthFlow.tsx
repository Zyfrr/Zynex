"use client";
//dep
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { zynexApi } from "@/lib/api";

type AuthMode = "login" | "signup";
type AuthStep = "start" | "code" | "password" | "profile" | "phone";

export function AuthFlow({
  mode,
  onAuthenticated,
  compact = false
}: {
  mode: AuthMode;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
  compact?: boolean;
}) {
  const [step, setStep] = useState<AuthStep>("start");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  async function startEmailCode(nextStep: AuthStep = "code") {
    setError("");
    try {
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthEmailStart", {
        method: "POST",
        body: JSON.stringify({ email, purpose: isSignup ? "SIGNUP" : "LOGIN" })
      });
      setStep(nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start email verification");
    }
  }

  return (
    <main className={`${compact ? "" : "min-h-screen bg-[#F7F8FB] px-5 py-8"} text-[#111827]`}>
      <div className={`mx-auto flex ${compact ? "" : "min-h-[calc(100vh-64px)] max-w-6xl"} items-center justify-center`}>
        <section className={`grid w-full overflow-hidden bg-white ${compact ? "" : "rounded-[28px] border border-[#E8EEF7] shadow-[0_28px_90px_rgba(15,36,66,0.10)] lg:grid-cols-[0.9fr_1.1fr]"}`}>
          {!compact && <aside className="hidden border-r border-[#E8EEF7] bg-[#FAFBFF] p-10 lg:block">
            <Link href="/" className="flex items-center gap-3">
              <img src="/assets/zynex-logos/zynex_favicon.svg" alt="ZyNex" className="h-10 w-10 rounded-full" />
              <div>
                <p className="font-display text-4xl font-bold leading-none">ZyNex</p>
                <p className="font-body text-xs font-semibold text-[#6B7280]">Secure AI chat observability</p>
              </div>
            </Link>
            <div className="mt-16">
              <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">
                Production-ready access
              </p>
              <h1 className="mt-4 font-display text-[58px] font-semibold leading-[0.9]">
                Secure entry for every inference workflow.
              </h1>
              <p className="mt-5 max-w-md font-body text-[15px] leading-7 text-[#5D6A7C]">
                Sign in with Google, phone OTP, email code, or password while ZyNex keeps session,
                audit, consent, and configuration controls ready for production.
              </p>
            </div>
            <div className="mt-12 grid gap-3">
              {["Config-driven OTP policy", "Terms and privacy consent", "Audit logs and session status"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E8EEF7] bg-white p-4">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="font-body text-sm font-semibold text-[#253248]">{item}</span>
                </div>
              ))}
            </div>
          </aside>}

          <div className={compact ? "p-1" : "p-6 sm:p-10"}>
            <div className="mx-auto max-w-md">
              {step !== "start" && (
                <button
                  type="button"
                  onClick={() => setStep("start")}
                  className="mb-6 flex items-center gap-2 rounded-full border border-[#E8EEF7] px-3 py-2 font-body text-sm font-semibold text-[#4C596C] hover:text-[#4F46E5]"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}

              {step === "start" && (
                <StartStep
                  isSignup={isSignup}
                  email={email}
                  setEmail={setEmail}
                  onEmailContinue={() => isSignup ? startEmailCode("code") : setStep("password")}
                  onCodeContinue={() => startEmailCode("code")}
                  onPhoneContinue={() => setStep("phone")}
                />
              )}
              {step === "code" && (
                <CodeStep
                  email={email}
                  isSignup={isSignup}
                  onContinue={async (code) => {
                    const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthEmailVerify", {
                      method: "POST",
                      body: JSON.stringify({ email, code })
                    });
                    if (isSignup) setStep("profile");
                    else onAuthenticated?.(session.user);
                  }}
                />
              )}
              {step === "password" && <PasswordStep email={email} setEmail={setEmail} onAuthenticated={onAuthenticated} />}
              {step === "phone" && (
                <PhoneStep
                  countryCode={countryCode}
                  setCountryCode={setCountryCode}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  onAuthenticated={onAuthenticated}
                />
              )}
              {step === "profile" && <SignupProfileStep email={email} onAuthenticated={onAuthenticated} />}
              {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-body text-sm font-semibold text-red-600">{error}</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StartStep({
  isSignup,
  email,
  setEmail,
  onEmailContinue,
  onCodeContinue,
  onPhoneContinue
}: {
  isSignup: boolean;
  email: string;
  setEmail: (value: string) => void;
  onEmailContinue: () => void;
  onCodeContinue: () => void;
  onPhoneContinue: () => void;
}) {
  return (
    <>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">{isSignup ? "Sign up for free" : "Welcome back"}</p>
      <h2 className="mt-3 font-display text-[48px] font-semibold leading-none">
        {isSignup ? "Create your account" : "Log in to ZyNex"}
      </h2>
      <p className="mt-4 font-body text-sm leading-6 text-[#5D6A7C]">
        Continue with a secure provider or use email. We keep the first step intentionally short.
      </p>

      <div className="mt-8 grid gap-3">
        <AuthProviderButton
          label="Continue with Google"
          icon={<span className="font-body text-lg font-bold">G</span>}
          onClick={() => signIn("google", { callbackUrl: "/" })}
        />
        <AuthProviderButton label="Continue with phone" icon={<Phone size={18} />} onClick={onPhoneContinue} />
      </div>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E8EEF7]" />
        <span className="font-body text-xs font-semibold uppercase text-[#8A94A6]">or</span>
        <span className="h-px flex-1 bg-[#E8EEF7]" />
      </div>

      <label className="block">
        <span className="font-body text-sm font-semibold text-[#253248]">Email address</span>
        <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#DDE5F0] px-4 focus-within:border-[#4F46E5]">
          <Mail size={18} className="text-[#6B7280]" />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none"
          />
        </div>
      </label>

      <div className="mt-4 grid gap-3">
        <Button className="w-full justify-between" arrow disabled={!email} onClick={onEmailContinue}>
          Continue
        </Button>
        {!isSignup && (
          <button
            type="button"
            onClick={onCodeContinue}
            className="text-center font-body text-sm font-semibold text-[#4F46E5]"
          >
            Login with email code instead
          </button>
        )}
      </div>

      <AuthLegal isSignup={isSignup} />
    </>
  );
}

function AuthProviderButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#DDE5F0] bg-white px-4 font-body text-sm font-semibold text-[#253248] transition hover:border-[#4F46E5] hover:text-[#4F46E5]"
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <ChevronRight size={17} />
    </button>
  );
}

function CodeStep({ email, isSignup, onContinue }: { email: string; isSignup: boolean; onContinue: (code: string) => Promise<void> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">Email verification</p>
      <h2 className="mt-3 font-display text-[48px] font-semibold leading-none">Enter your code</h2>
      <p className="mt-4 font-body text-sm leading-6 text-[#5D6A7C]">
        We sent a numeric verification code to <strong>{email || "your email"}</strong>.
      </p>
      <input
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Enter 6 digit code"
        className="mt-8 h-12 w-full rounded-2xl border border-[#DDE5F0] px-4 text-center font-body text-lg font-bold tracking-[0.35em] outline-none focus:border-[#4F46E5]"
      />
      <Button className="mt-5 w-full justify-between" arrow disabled={code.length < 4} onClick={async () => {
        try {
          setError("");
          await onContinue(code);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Verification failed");
        }
      }}>
        {isSignup ? "Verify and continue" : "Login"}
      </Button>
      {error && <p className="mt-3 font-body text-sm font-semibold text-red-600">{error}</p>}
      <button className="mt-4 w-full text-center font-body text-sm font-semibold text-[#4F46E5]">
        Resend code
      </button>
    </>
  );
}

function PasswordStep({
  email,
  setEmail,
  onAuthenticated
}: {
  email: string;
  setEmail: (value: string) => void;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function login() {
    try {
      setError("");
      const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthLogin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onAuthenticated?.(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">Password login</p>
      <h2 className="mt-3 font-display text-[48px] font-semibold leading-none">Enter password</h2>
      <label className="mt-8 block">
        <span className="font-body text-sm font-semibold text-[#253248]">Email address</span>
        <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#DDE5F0] px-4 focus-within:border-[#4F46E5]">
          <Mail size={18} className="text-[#6B7280]" />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none"
          />
        </div>
      </label>
      <label className="mt-4 block">
        <span className="font-body text-sm font-semibold text-[#253248]">Password</span>
        <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#DDE5F0] px-4 focus-within:border-[#4F46E5]">
          <KeyRound size={18} className="text-[#6B7280]" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none"
          />
          <Eye size={18} className="text-[#6B7280]" />
        </div>
      </label>
      <div className="mt-4 flex items-center justify-between">
        <button className="font-body text-sm font-semibold text-[#4F46E5]">Forgot password?</button>
      </div>
      <Button className="mt-5 w-full justify-between" arrow disabled={!email || !password} onClick={login}>
        Continue
      </Button>
      {error && <p className="mt-3 font-body text-sm font-semibold text-red-600">{error}</p>}
    </>
  );
}

function PhoneStep({
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  onAuthenticated
}: {
  countryCode: string;
  setCountryCode: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
}) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  async function start() {
    try {
      setError("");
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthPhoneStart", {
        method: "POST",
        body: JSON.stringify({ countryCode, phoneNumber })
      });
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    }
  }
  async function verify() {
    try {
      setError("");
      const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthPhoneVerify", {
        method: "POST",
        body: JSON.stringify({ countryCode, phoneNumber, code })
      });
      onAuthenticated?.(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone verification failed");
    }
  }

  return (
    <>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">Phone verification</p>
      <h2 className="mt-3 font-display text-[48px] font-semibold leading-none">Continue with phone</h2>
      <p className="mt-4 font-body text-sm leading-6 text-[#5D6A7C]">
        Choose your country code and enter the remaining phone number. SMS delivery will use Twilio.
      </p>
      <div className="mt-8 grid grid-cols-[130px_1fr] gap-3">
        <label>
          <span className="font-body text-sm font-semibold text-[#253248]">Country</span>
          <select
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-[#DDE5F0] bg-white px-3 font-body text-sm outline-none focus:border-[#4F46E5]"
          >
            <option value="+91">🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
          </select>
        </label>
        <label>
          <span className="font-body text-sm font-semibold text-[#253248]">Phone number</span>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#DDE5F0] px-4 focus-within:border-[#4F46E5]">
            <Phone size={18} className="text-[#6B7280]" />
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="9876543210"
              className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none"
            />
          </div>
        </label>
      </div>
      {codeSent && (
        <label className="mt-4 block">
          <span className="font-body text-sm font-semibold text-[#253248]">OTP code</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-2 h-12 w-full rounded-2xl border border-[#DDE5F0] px-4 font-body text-sm outline-none focus:border-[#4F46E5]"
            placeholder="Enter OTP"
          />
        </label>
      )}
      <Button className="mt-5 w-full justify-between" arrow disabled={!phoneNumber} onClick={codeSent ? verify : start}>
        {codeSent ? "Verify OTP" : "Send OTP"}
      </Button>
      {error && <p className="mt-3 font-body text-sm font-semibold text-red-600">{error}</p>}
    </>
  );
}

function SignupProfileStep({
  email,
  onAuthenticated
}: {
  email: string;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  async function register() {
    try {
      setError("");
      const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthRegisterManual", {
        method: "POST",
        body: JSON.stringify({ email, firstName, lastName, dateOfBirth, password, termsAccepted })
      });
      onAuthenticated?.(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <>
      <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">Complete profile</p>
      <h2 className="mt-3 font-display text-[48px] font-semibold leading-none">Secure your account</h2>
      <p className="mt-4 font-body text-sm leading-6 text-[#5D6A7C]">
        Verified email: <strong>{email || "your email"}</strong>
      </p>
      <div className="mt-8 grid gap-4">
        <IconInput icon={<UserRound size={18} />} label="First name" value={firstName} onChange={setFirstName} />
        <IconInput icon={<UserRound size={18} />} label="Last name" value={lastName} onChange={setLastName} />
        <IconInput icon={<Calendar size={18} />} label="Date of birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
        <IconInput icon={<KeyRound size={18} />} label="Create password" type="password" value={password} onChange={setPassword} />
      </div>
      <label className="mt-5 flex gap-3 rounded-2xl border border-[#E8EEF7] bg-[#FAFBFF] p-4">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#4F46E5]"
        />
        <span className="font-body text-sm leading-6 text-[#5D6A7C]">
          I agree to the <Link href="/Terms" className="font-semibold text-[#4F46E5]">Terms of Use</Link> and{" "}
          <Link href="/Privacy" className="font-semibold text-[#4F46E5]">Privacy Policy</Link>.
        </span>
      </label>
      <Button
        className="mt-5 w-full justify-between"
        arrow
        disabled={!firstName || !lastName || password.length < 8 || !termsAccepted}
        onClick={register}
      >
        Create account
      </Button>
      {error && <p className="mt-3 font-body text-sm font-semibold text-red-600">{error}</p>}
    </>
  );
}

function IconInput({
  icon,
  label,
  type = "text",
  value,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="font-body text-sm font-semibold text-[#253248]">{label}</span>
      <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#DDE5F0] px-4 focus-within:border-[#4F46E5]">
        <span className="text-[#6B7280]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none"
        />
      </div>
    </label>
  );
}

function AuthLegal({ isSignup }: { isSignup: boolean }) {
  return (
    <div className="mt-8 rounded-2xl bg-[#FAFBFF] p-4">
      <div className="flex gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#4F46E5]" />
        <p className="font-body text-xs leading-5 text-[#5D6A7C]">
          {isSignup ? "By signing up" : "By continuing"}, you agree to ZyNex{" "}
          <Link href="/Terms" className="font-semibold text-[#4F46E5]">Terms of Use</Link> and{" "}
          <Link href="/Privacy" className="font-semibold text-[#4F46E5]">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
