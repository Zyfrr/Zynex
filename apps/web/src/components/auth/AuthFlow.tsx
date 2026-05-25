"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ZyNexApiError, zynexApi } from "@/lib/api";

type AuthMode = "login" | "signup";
type AuthStep = "start" | "code" | "password" | "profile" | "phone";
type ToastState = { type: "success" | "error"; code: string; message: string };
type FieldErrors = Record<string, string>;
type VerifiedSignup = {
  signupVerificationToken?: string;
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const today = new Date();
today.setHours(0, 0, 0, 0);

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
  const [countryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shakeHint, setShakeHint] = useState(false);
  const [verifiedSignup, setVerifiedSignup] = useState<VerifiedSignup>({});
  const isSignup = mode === "signup";
  const isProfile = step === "profile";

  async function startEmailCode(nextStep: AuthStep = "code") {
    if (!emailPattern.test(email)) {
      notify({ type: "error", code: "VAL001", message: "Enter a valid email address." });
      pulseHint(setShakeHint);
      return;
    }

    try {
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthEmailStart", {
        method: "POST",
        body: JSON.stringify({ email, purpose: isSignup ? "SIGNUP" : "LOGIN" })
      });
      notify({ type: "success", code: "OTP001", message: "Verification code sent." });
      setStep(nextStep);
    } catch (err) {
      showError(err);
      pulseHint(setShakeHint);
    }
  }

  return (
    <main className={`${compact ? "" : "min-h-screen bg-[#F7F8FB] px-3 py-4 sm:px-5 sm:py-8"} text-[#111827]`}>
      <div className={`mx-auto flex ${compact ? "" : "min-h-[calc(100vh-32px)] max-w-6xl sm:min-h-[calc(100vh-64px)]"} items-center justify-center`}>
        <section className={`grid w-full overflow-visible bg-white ${compact ? "" : "rounded-[20px] border border-[#E8EEF7] shadow-[0_28px_90px_rgba(15,36,66,0.10)] sm:rounded-[28px] lg:grid-cols-[0.9fr_1.1fr]"}`}>
          {!compact && (
            <aside className="hidden border-r border-[#E8EEF7] bg-[#FAFBFF] p-10 lg:block">
              <Link href="/" className="flex items-center gap-3">
                <img src="/assets/zynex-logos/zynex_favicon.svg" alt="ZyNex" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-display text-4xl font-bold leading-none">ZyNex</p>
                  <p className="font-body text-xs font-semibold text-[#6B7280]">Secure AI chat observability</p>
                </div>
              </Link>
              <div className="mt-16">
                <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">Production-ready access</p>
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
            </aside>
          )}

          <div className={compact ? "p-1" : "p-4 sm:p-6 lg:p-10"}>
            <div className={`mx-auto w-full ${isProfile ? "max-w-3xl" : "max-w-md"}`}>
              {step !== "start" && (
                <button
                  type="button"
                  onClick={() => setStep("start")}
                  className="mb-4 flex items-center gap-2 rounded-full border border-[#E8EEF7] px-3 py-2 font-body text-sm font-semibold text-[#4C596C] hover:text-[#4F46E5]"
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
                  onEmailContinue={() => (isSignup ? startEmailCode("code") : setStep("password"))}
                  onCodeContinue={() => startEmailCode("code")}
                  onPhoneContinue={() => setStep("phone")}
                  shakeHint={shakeHint}
                />
              )}
              {step === "code" && (
                <CodeStep
                  email={email}
                  isSignup={isSignup}
                  onContinue={async (code) => {
                    const session = await zynexApi<{
                      user?: { id: string; email?: string | null };
                      signupVerificationToken?: string;
                      verifiedEmail?: string;
                    }>("/api/v1/auth/ZyNexAPI01AuthEmailVerify", {
                      method: "POST",
                      body: JSON.stringify({ email, code, purpose: isSignup ? "SIGNUP" : "LOGIN" })
                    });
                    if (isSignup) {
                      setVerifiedSignup({ signupVerificationToken: session.signupVerificationToken, email: session.verifiedEmail || email });
                      notify({ type: "success", code: "AUTH_EMAIL_VERIFIED", message: "Email verified. Complete your profile." });
                      setStep("profile");
                    } else if (session.user) {
                      notify({ type: "success", code: "AUTH_LOGIN_SUCCESS", message: "Login successful." });
                      onAuthenticated?.(session.user);
                    }
                  }}
                />
              )}
              {step === "password" && <PasswordStep email={email} setEmail={setEmail} onAuthenticated={onAuthenticated} />}
              {step === "phone" && (
                <PhoneStep
                  isSignup={isSignup}
                  countryCode={countryCode}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  onAuthenticated={onAuthenticated}
                  onVerifiedSignup={(nextVerified) => {
                    setVerifiedSignup(nextVerified);
                    setStep("profile");
                  }}
                />
              )}
              {step === "profile" && (
                <SignupProfileStep
                  verifiedSignup={verifiedSignup.email ? verifiedSignup : { ...verifiedSignup, email }}
                  onAuthenticated={onAuthenticated}
                />
              )}
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
  onPhoneContinue,
  shakeHint
}: {
  isSignup: boolean;
  email: string;
  setEmail: (value: string) => void;
  onEmailContinue: () => void;
  onCodeContinue: () => void;
  onPhoneContinue: () => void;
  shakeHint: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const emailError = touched && email && !emailPattern.test(email) ? "Enter a valid email address." : "";

  return (
    <>
      <p className="font-body text-xs font-bold uppercase text-[#4F46E5] sm:text-sm">{isSignup ? "Sign up for free" : "Welcome back"}</p>
      <h2 className="mt-2 font-display text-[32px] font-semibold leading-none sm:text-[40px] lg:text-[46px]">
        {isSignup ? "Create your account" : "Log in to ZyNex"}
      </h2>
      <p className="mt-3 font-body text-sm leading-6 text-[#5D6A7C]">
        Continue with a secure provider or use email. We keep the first step intentionally short.
      </p>

      <div className="mt-5 grid gap-2.5 sm:mt-6">
        <AuthProviderButton
          label="Continue with Google"
          icon={<span className="font-body text-lg font-bold">G</span>}
          onClick={() => signIn("google", { callbackUrl: "/" })}
        />
        <AuthProviderButton label="Continue with phone" icon={<Phone size={18} />} onClick={onPhoneContinue} />
      </div>

      <div className="my-4 flex items-center gap-3 sm:my-5">
        <span className="h-px flex-1 bg-[#E8EEF7]" />
        <span className="font-body text-xs font-semibold uppercase text-[#8A94A6]">or</span>
        <span className="h-px flex-1 bg-[#E8EEF7]" />
      </div>

      <TextField
        icon={<Mail size={18} />}
        label="Email address"
        value={email}
        onChange={setEmail}
        onBlur={() => setTouched(true)}
        placeholder="you@company.com"
        error={emailError}
      />

      <div className="mt-4 grid gap-3">
        <Button className="w-full justify-between" arrow disabled={!email || Boolean(emailError)} onClick={onEmailContinue}>
          Continue
        </Button>
        {!isSignup && (
          <button type="button" onClick={onCodeContinue} className="text-center font-body text-sm font-semibold text-[#4F46E5]">
            Login with email code instead
          </button>
        )}
      </div>

      <AuthLegal isSignup={isSignup} />
      <p className={`mt-4 text-center font-body text-sm font-semibold text-[#5D6A7C] ${shakeHint ? "animate-[ZyNexShake_420ms_ease-in-out]" : ""}`}>
        {isSignup ? "Already have an account?" : "New to ZyNex?"}{" "}
        <span className="text-[#4F46E5]">{isSignup ? "Please login." : "Create your account."}</span>
      </p>
    </>
  );
}

function AuthProviderButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between rounded-2xl border border-[#DDE5F0] bg-white px-4 font-body text-sm font-semibold text-[#253248] transition hover:border-[#4F46E5] hover:text-[#4F46E5]"
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon}
        <span className="truncate">{label}</span>
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
      <p className="font-body text-xs font-bold uppercase text-[#4F46E5] sm:text-sm">Email verification</p>
      <h2 className="mt-2 font-display text-[32px] font-semibold leading-none sm:text-[40px] lg:text-[46px]">Enter your code</h2>
      <p className="mt-3 break-words font-body text-sm leading-6 text-[#5D6A7C]">
        We sent a numeric verification code to <strong>{email || "your email"}</strong>.
      </p>
      <input
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Enter 6 digit code"
        className="mt-6 h-12 w-full rounded-2xl border border-[#DDE5F0] px-4 text-center font-body text-base font-bold tracking-[0.22em] outline-none focus:border-[#4F46E5] sm:text-lg sm:tracking-[0.35em]"
      />
      <Button
        className="mt-5 w-full justify-between"
        arrow
        disabled={code.length < 4}
        onClick={async () => {
          try {
            setError("");
            await onContinue(code);
          } catch (err) {
            showError(err);
            setError(err instanceof Error ? err.message : "Verification failed");
          }
        }}
      >
        {isSignup ? "Verify and continue" : "Login"}
      </Button>
      {error && <p className="mt-2 font-body text-xs font-semibold text-red-600">{error}</p>}
      <button className="mt-4 w-full text-center font-body text-sm font-semibold text-[#4F46E5]">Resend code</button>
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    try {
      setError("");
      const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthLogin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      notify({ type: "success", code: "AUTH_LOGIN_SUCCESS", message: "Login successful." });
      onAuthenticated?.(session.user);
    } catch (err) {
      showError(err);
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <>
      <p className="font-body text-xs font-bold uppercase text-[#4F46E5] sm:text-sm">Password login</p>
      <h2 className="mt-2 font-display text-[32px] font-semibold leading-none sm:text-[40px] lg:text-[46px]">Enter password</h2>
      <div className="mt-6 grid gap-3">
        <TextField icon={<Mail size={18} />} label="Email address" value={email} onChange={setEmail} placeholder="you@company.com" />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          visible={showPassword}
          setVisible={setShowPassword}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button className="font-body text-sm font-semibold text-[#4F46E5]">Forgot password?</button>
      </div>
      <Button className="mt-5 w-full justify-between" arrow disabled={!email || !password} onClick={login}>
        Continue
      </Button>
      {error && <p className="mt-2 font-body text-xs font-semibold text-red-600">{error}</p>}
    </>
  );
}

function PhoneStep({
  isSignup,
  countryCode,
  phoneNumber,
  setPhoneNumber,
  onAuthenticated,
  onVerifiedSignup
}: {
  isSignup: boolean;
  countryCode: string;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
  onVerifiedSignup: (verified: VerifiedSignup) => void;
}) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<FieldErrors>({});

  async function start() {
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError({ phoneNumber: "Enter a valid 10 digit mobile number." });
      return;
    }

    try {
      setError({});
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthPhoneStart", {
        method: "POST",
        body: JSON.stringify({ countryCode, phoneNumber, purpose: isSignup ? "SIGNUP" : "LOGIN" })
      });
      notify({ type: "success", code: "OTP001", message: "Verification code sent." });
      setCodeSent(true);
    } catch (err) {
      showError(err);
    }
  }

  async function verify() {
    try {
      setError({});
      const session = await zynexApi<{
        user?: { id: string; email?: string | null };
        signupVerificationToken?: string;
        verifiedPhone?: { countryCode: string; phoneNumber: string };
      }>("/api/v1/auth/ZyNexAPI01AuthPhoneVerify", {
        method: "POST",
        body: JSON.stringify({ countryCode, phoneNumber, code, purpose: isSignup ? "SIGNUP" : "LOGIN" })
      });
      if (isSignup) {
        notify({ type: "success", code: "AUTH_PHONE_VERIFIED", message: "Phone verified. Complete your profile." });
        onVerifiedSignup({
          signupVerificationToken: session.signupVerificationToken,
          phoneCountryCode: session.verifiedPhone?.countryCode || countryCode,
          phoneNumber: session.verifiedPhone?.phoneNumber || phoneNumber
        });
      } else if (session.user) {
        notify({ type: "success", code: "AUTH_LOGIN_SUCCESS", message: "Login successful." });
        onAuthenticated?.(session.user);
      }
    } catch (err) {
      showError(err);
    }
  }

  return (
    <>
      <p className="font-body text-xs font-bold uppercase text-[#4F46E5] sm:text-sm">Phone verification</p>
      <h2 className="mt-2 font-display text-[32px] font-semibold leading-none sm:text-[40px] lg:text-[46px]">Continue with phone</h2>
      <p className="mt-3 font-body text-sm leading-6 text-[#5D6A7C]">
        India is selected by default. Enter your mobile number to receive an OTP.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[112px_1fr]">
        <TextField icon={<span className="font-body text-xs font-bold">IN</span>} label="Country" value="India (+91)" onChange={() => {}} disabled />
        <TextField
          icon={<Phone size={18} />}
          label="Phone number"
          value={phoneNumber}
          onChange={(value) => setPhoneNumber(value.replace(/\D/g, "").slice(0, 10))}
          placeholder="9876543210"
          error={error.phoneNumber}
        />
      </div>
      {codeSent && (
        <TextField
          className="mt-3"
          icon={<KeyRound size={18} />}
          label="OTP code"
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter OTP"
        />
      )}
      <Button className="mt-5 w-full justify-between" arrow disabled={!phoneNumber} onClick={codeSent ? verify : start}>
        {codeSent ? "Verify OTP" : "Send OTP"}
      </Button>
    </>
  );
}

function SignupProfileStep({
  verifiedSignup,
  onAuthenticated
}: {
  verifiedSignup: VerifiedSignup;
  onAuthenticated?: (user: { id: string; email?: string | null }) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: verifiedSignup.email || "",
    phoneNumber: verifiedSignup.phoneNumber || "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateField(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateProfile() {
    const nextErrors: FieldErrors = {};
    if (form.firstName.trim().length < 2) nextErrors.firstName = "First name must have at least 2 characters.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!emailPattern.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(form.phoneNumber)) nextErrors.phoneNumber = "Enter a valid 10 digit mobile number.";
    if (!form.dateOfBirth) nextErrors.dateOfBirth = "Select your date of birth.";
    const passwordError = getPasswordError(form.password);
    if (passwordError) nextErrors.password = passwordError;
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Password and confirm password do not match.";
    if (!form.termsAccepted) nextErrors.termsAccepted = "Please accept the terms and privacy policy.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function register() {
    if (!validateProfile()) return;

    try {
      const session = await zynexApi<{ user: { id: string; email?: string | null } }>("/api/v1/auth/ZyNexAPI01AuthRegisterManual", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          phoneCountryCode: "+91",
          phoneNumber: form.phoneNumber,
          signupVerificationToken: verifiedSignup.signupVerificationToken,
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          password: form.password,
          termsAccepted: form.termsAccepted
        })
      });
      notify({ type: "success", code: "AUTH_ACCOUNT_CREATED", message: "Account created successfully." });
      onAuthenticated?.(session.user);
    } catch (err) {
      showError(err);
    }
  }

  return (
    <>
      <div className="mb-4">
        <p className="font-body text-xs font-bold uppercase text-[#4F46E5] sm:text-sm">Complete profile</p>
        <h2 className="mt-1 font-display text-[30px] font-semibold leading-none sm:text-[38px]">Secure your account</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField icon={<UserRound size={18} />} label="First name" value={form.firstName} onChange={(value) => updateField("firstName", value)} placeholder="Sarankumar" error={errors.firstName} />
        <TextField icon={<UserRound size={18} />} label="Last name" value={form.lastName} onChange={(value) => updateField("lastName", value)} placeholder="Sankar" error={errors.lastName} />
        <TextField className="sm:col-span-2" icon={<Mail size={18} />} label="Email address" value={form.email} onChange={(value) => updateField("email", value)} placeholder="you@company.com" error={errors.email} disabled={Boolean(verifiedSignup.email)} />
        <TextField className="sm:col-span-2" icon={<Phone size={18} />} label="Phone number" value={form.phoneNumber} onChange={(value) => updateField("phoneNumber", value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" error={errors.phoneNumber} disabled={Boolean(verifiedSignup.phoneNumber)} />
        <DatePickerField value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} error={errors.dateOfBirth} />
        <TextField icon={<span className="font-body text-xs font-bold">IN</span>} label="Country" value="India (+91)" onChange={() => {}} disabled />
        <PasswordField className="sm:col-span-2" label="Create password" value={form.password} onChange={(value) => updateField("password", value)} placeholder="Create a strong password" visible={showPassword} setVisible={setShowPassword} error={errors.password} showGuidelines />
        <PasswordField className="sm:col-span-2" label="Confirm password" value={form.confirmPassword} onChange={(value) => updateField("confirmPassword", value)} placeholder="Re-enter your password" visible={showConfirmPassword} setVisible={setShowConfirmPassword} error={errors.confirmPassword} />
      </div>

      <label className="mt-3 flex gap-3 rounded-2xl border border-[#E8EEF7] bg-[#FAFBFF] p-3">
        <input
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(event) => updateField("termsAccepted", event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#4F46E5]"
        />
        <span className="font-body text-xs leading-5 text-[#5D6A7C]">
          I agree to the <Link href="/Terms" className="font-semibold text-[#4F46E5]">Terms of Use</Link> and{" "}
          <Link href="/Privacy" className="font-semibold text-[#4F46E5]">Privacy Policy</Link>.
          {errors.termsAccepted && <span className="mt-1 block font-semibold text-red-600">{errors.termsAccepted}</span>}
        </span>
      </label>

      <Button className="mt-4 w-full justify-between" arrow onClick={register}>
        Create account
      </Button>
    </>
  );
}

function TextField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  onBlur,
  className = ""
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onBlur?: () => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-body text-xs font-semibold text-[#253248] sm:text-sm">{label}</span>
      <div className={`mt-1.5 flex h-11 items-center gap-3 rounded-2xl border px-3 ${error ? "border-red-300" : "border-[#DDE5F0] focus-within:border-[#4F46E5]"} ${disabled ? "bg-[#F8FAFC]" : "bg-white"}`}>
        <span className="shrink-0 text-[#6B7280]">{icon}</span>
        <input
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none placeholder:text-[#A1AAB8] disabled:text-[#6B7280]"
        />
      </div>
      {error && <p className="mt-1 font-body text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  setVisible,
  error,
  showGuidelines = false,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  setVisible: (value: boolean) => void;
  error?: string;
  showGuidelines?: boolean;
  className?: string;
}) {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-2 font-body text-xs font-semibold text-[#253248] sm:text-sm">
        {label}
        {showGuidelines && (
          <span className="relative">
            <button type="button" onClick={() => setGuidelinesOpen(!guidelinesOpen)} className="grid h-5 w-5 place-items-center rounded-full border border-[#DDE5F0] text-[#4F46E5]">
              <Info size={13} />
            </button>
            {guidelinesOpen && (
              <span className="absolute left-0 top-7 z-20 w-64 rounded-xl border border-[#E8EEF7] bg-white p-3 text-xs font-medium leading-5 text-[#5D6A7C] shadow-xl">
                Use at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
              </span>
            )}
          </span>
        )}
      </span>
      <div className={`mt-1.5 flex h-11 items-center gap-3 rounded-2xl border px-3 ${error ? "border-red-300" : "border-[#DDE5F0] focus-within:border-[#4F46E5]"}`}>
        <KeyRound size={18} className="shrink-0 text-[#6B7280]" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent font-body text-sm outline-none placeholder:text-[#A1AAB8]"
        />
        <button type="button" onClick={() => setVisible(!visible)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6B7280] hover:bg-[#F3F5FA] hover:text-[#4F46E5]">
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p className="mt-1 font-body text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

function DatePickerField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || today);
  const monthLabel = viewDate.toLocaleString("en", { month: "long", year: "numeric" });
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  function selectDate(date: Date) {
    if (date > today) return;
    onChange(formatDate(date));
    setOpen(false);
  }

  return (
    <div className="relative">
      <span className="font-body text-xs font-semibold text-[#253248] sm:text-sm">Date of birth</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`mt-1.5 flex h-11 w-full items-center gap-3 rounded-2xl border px-3 text-left ${error ? "border-red-300" : "border-[#DDE5F0]"} bg-white`}
      >
        <Calendar size={18} className="shrink-0 text-[#6B7280]" />
        <span className={`font-body text-sm ${value ? "text-[#111827]" : "text-[#A1AAB8]"}`}>{value || "Select date of birth"}</span>
      </button>
      {error && <p className="mt-1 font-body text-xs font-semibold text-red-600">{error}</p>}

      {open && (
        <div className="absolute left-0 right-0 top-[72px] z-30 rounded-2xl border border-[#E8EEF7] bg-white p-3 shadow-2xl shadow-slate-900/15 sm:right-auto sm:w-[310px]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F5FA]">
              <ChevronLeft size={17} />
            </button>
            <span className="font-body text-sm font-bold text-[#253248]">{monthLabel}</span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F5FA]">
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center font-body text-[11px] font-bold text-[#8A94A6]">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="h-8" />;
              const disabled = date > today;
              const active = value === formatDate(date);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={`h-8 rounded-full font-body text-xs font-semibold transition ${
                    active
                      ? "bg-[#4F46E5] text-white"
                      : disabled
                        ? "cursor-not-allowed text-[#C6CEDA]"
                        : "text-[#253248] hover:bg-indigo-50 hover:text-[#4F46E5]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getPasswordError(password: string) {
  if (password.length < 8) return "Password must have at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
  return "";
}

function buildCalendarDays(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);
  for (let day = 1; day <= lastDate; day += 1) {
    days.push(new Date(year, month, day));
  }
  return days;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function notify(nextToast: ToastState) {
  const title = `Code: ${nextToast.code}`;
  const description = `Message: ${nextToast.message}`;
  if (nextToast.type === "error") toast.error(title, { description });
  else toast.success(title, { description });
}

function showError(error: unknown) {
  if (error instanceof ZyNexApiError) {
    notify({ type: "error", code: error.code, message: error.message });
    return;
  }
  notify({ type: "error", code: "SYS001", message: error instanceof Error ? error.message : "Unexpected ZyNex error" });
}

function pulseHint(setShakeHint: (value: boolean) => void) {
  setShakeHint(true);
  window.setTimeout(() => setShakeHint(false), 450);
}

function AuthLegal({ isSignup }: { isSignup: boolean }) {
  return (
    <div className="mt-5 rounded-2xl bg-[#FAFBFF] p-3">
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
