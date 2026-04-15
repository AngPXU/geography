'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash, FaChevronDown } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 pr-12 rounded-2xl text-[#082F49] placeholder-[#94A3B8]
                   bg-white/80 border border-[#BAE6FD] backdrop-blur-sm
                   shadow-[0_2px_8px_rgba(14,165,233,0.1)]
                   focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]
                   transition-all duration-300"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#06B6D4] transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  );
}

function GlassSelect({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 pr-12 rounded-2xl text-[#082F49]
                   bg-white/80 border border-[#BAE6FD] backdrop-blur-sm appearance-none
                   shadow-[0_2px_8px_rgba(14,165,233,0.1)]
                   focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {children}
      </select>
      <div className="absolute right-0 top-0 h-full flex items-center px-3 pointer-events-none border-l border-[#BAE6FD]">
        <FaChevronDown className="text-[#06B6D4]" size={11} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types & validation
// ---------------------------------------------------------------------------

type FieldErrors = Record<string, string>;

function validateStep1(
  username: string,
  password: string,
  confirmPassword: string,
  email: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!username.trim()) {
    errors.username = 'Tên đăng nhập không được để trống';
  } else if (username.length < 3) {
    errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
  } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    errors.username = 'Chỉ được dùng chữ cái, số, dấu _ và .';
  }

  if (!password) {
    errors.password = 'Mật khẩu không được để trống';
  } else {
    const pwRules = [
      { test: password.length >= 8,          msg: 'ít nhất 8 ký tự' },
      { test: /[A-Z]/.test(password),         msg: 'ít nhất 1 chữ in hoa (A–Z)' },
      { test: /[a-z]/.test(password),         msg: 'ít nhất 1 chữ thường (a–z)' },
      { test: /[0-9]/.test(password),         msg: 'ít nhất 1 chữ số (0–9)' },
      { test: /[^A-Za-z0-9]/.test(password), msg: 'ít nhất 1 ký tự đặc biệt (!@#$...)' },
    ];
    const failed = pwRules.filter((r) => !r.test).map((r) => r.msg);
    if (failed.length > 0) {
      errors.password = 'Mật khẩu cần có: ' + failed.join(', ');
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email không hợp lệ';
  }

  return errors;
}

function validateStep2(fullName: string, className: string, school: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!fullName.trim()) errors.fullName = 'Họ tên không được để trống';
  if (!className.trim()) errors.className = 'Lớp không được để trống';
  if (!school.trim()) errors.school = 'Trường không được để trống';
  return errors;
}

// ---------------------------------------------------------------------------
// Address types
// ---------------------------------------------------------------------------

type ProvinceItem = { code: number; name: string };
type WardItem = { code: number; name: string };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();

  // mode
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2>(1);

  // login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // register step 1
  const [role, setRole] = useState<2 | 3>(3);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // register step 2
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [school, setSchool] = useState('');

  // address
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [address, setAddress] = useState('');

  // ui state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then((r) => r.json())
      .then((data: ProvinceItem[]) => setProvinces(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard('');
      return;
    }
    fetch(`https://provinces.open-api.vn/api/v2/p/${selectedProvince}?depth=2`)
      .then((r) => r.json())
      .then((data: { wards?: WardItem[] }) => {
        setWards(data.wards ?? []);
        setSelectedWard('');
      })
      .catch(() => {});
  }, [selectedProvince]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const errors: FieldErrors = {};
    if (!loginUsername.trim()) errors.loginUsername = 'Vui lòng nhập tên đăng nhập';
    if (!loginPassword) errors.loginPassword = 'Vui lòng nhập mật khẩu';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    signIn('credentials', { username: loginUsername, password: loginPassword, redirect: false })
      .then((res) => {
        if (res?.error) setServerError('Tên đăng nhập hoặc mật khẩu không đúng');
        else router.push('/');
      })
      .finally(() => setLoading(false));
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateStep1(regUsername, regPassword, regConfirm, regEmail);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(2);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateStep2(fullName, className, school);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setServerError('');
    setLoading(true);

    const provinceObj = selectedProvince
      ? provinces.find((p) => String(p.code) === selectedProvince)
      : undefined;
    const wardObj = selectedWard
      ? wards.find((w) => String(w.code) === selectedWard)
      : undefined;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          email: regEmail || undefined,
          fullName,
          className,
          school,
          province: provinceObj,
          ward: wardObj,
          address: address || undefined,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? 'Đăng ký thất bại');
      } else {
        await signIn('credentials', { username: regUsername, password: regPassword, redirect: false });
        router.push('/');
      }
    } catch {
      setServerError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const inputClass =
    'w-full px-4 py-3 rounded-2xl text-[#082F49] placeholder-[#94A3B8] ' +
    'bg-white/80 border border-[#BAE6FD] backdrop-blur-sm ' +
    'shadow-[0_2px_8px_rgba(14,165,233,0.1)] ' +
    'focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)] transition-all duration-300';

  const fieldError = (key: string) =>
    fieldErrors[key] ? (
      <div className="flex items-center gap-1.5 mt-1.5 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F87171] flex-shrink-0 inline-block" />
        <p className="text-xs font-medium text-[#DC2626]">{fieldErrors[key]}</p>
      </div>
    ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)',
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-xl"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,1)',
          boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-[#082F49]">GeoLearn</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Khám phá thế giới địa lý</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-white/50 p-1 mb-6 gap-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(1); setFieldErrors({}); setServerError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                mode === m
                  ? 'bg-[#06B6D4] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#082F49]'
              }`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* Server error */}
        {serverError && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(254,226,226,0.8)', color: '#DC2626' }}
          >
            {serverError}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                placeholder="Nhập tên đăng nhập của bạn"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={inputClass}
              />
              {fieldError('loginUsername')}
            </div>
            <div>
              <label htmlFor="login-pw" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Mật khẩu
              </label>
              <PasswordInput
                id="login-pw"
                placeholder="Nhập mật khẩu của bạn"
                value={loginPassword}
                onChange={setLoginPassword}
              />
              {fieldError('loginPassword')}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE]
                         disabled:opacity-60 transition-all duration-300"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {/* REGISTER STEP 1 */}
        {mode === 'register' && step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full bg-[#06B6D4]" />
              <div className="flex-1 h-1.5 rounded-full bg-white/50" />
              <span className="text-xs text-[#94A3B8]">Bước 1 / 2</span>
            </div>

            {/* Role picker */}
            <div>
              <p className="text-xs font-semibold text-[#334155] mb-2">Bạn là:</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 3, label: 'Học sinh', icon: '🎒' },
                  { value: 2, label: 'Giáo viên', icon: '👩‍🏫' },
                ] as const).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-3 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-1 transition-all duration-300 ${
                      role === r.value
                        ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]'
                        : 'border-white/80 bg-white/40 text-[#334155] hover:border-[#06B6D4]/50'
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Tên đăng nhập <span className="text-[#06B6D4]">*</span>
              </label>
              <input
                id="reg-username"
                placeholder="Ít nhất 3 ký tự, chỉ gồm chữ, số, _ và ."
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className={inputClass}
              />
              {fieldError('username')}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Email <span className="text-[#94A3B8] font-normal">(tuỳ chọn)</span>
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="example@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass}
              />
              {fieldError('email')}
            </div>

            <div>
              <label htmlFor="reg-pw" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Mật khẩu <span className="text-[#06B6D4]">*</span>
              </label>
              <PasswordInput
                id="reg-pw"
                placeholder="Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                value={regPassword}
                onChange={setRegPassword}
              />
              {fieldError('password')}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Xác nhận mật khẩu <span className="text-[#06B6D4]">*</span>
              </label>
              <PasswordInput
                id="reg-confirm"
                placeholder="Nhập lại mật khẩu"
                value={regConfirm}
                onChange={setRegConfirm}
              />
              {fieldError('confirmPassword')}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE]
                         transition-all duration-300"
            >
              Tiếp theo &rarr;
            </button>
          </form>
        )}

        {/* REGISTER STEP 2 */}
        {mode === 'register' && step === 2 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full bg-[#06B6D4]" />
              <div className="flex-1 h-1.5 rounded-full bg-[#06B6D4]" />
              <span className="text-xs text-[#94A3B8]">Bước 2 / 2</span>
            </div>

            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Họ và tên <span className="text-[#06B6D4]">*</span>
              </label>
              <input
                id="reg-fullname"
                placeholder="Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
              {fieldError('fullName')}
            </div>

            <div>
              <label htmlFor="reg-class" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Lớp <span className="text-[#06B6D4]">*</span>
              </label>
              <input
                id="reg-class"
                placeholder="Ví dụ: 8A1"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className={inputClass}
              />
              {fieldError('className')}
            </div>

            <div>
              <label htmlFor="reg-school" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Trường <span className="text-[#06B6D4]">*</span>
              </label>
              <input
                id="reg-school"
                placeholder="Tên trường của bạn"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className={inputClass}
              />
              {fieldError('school')}
            </div>

            <div>
              <label htmlFor="province" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Tỉnh / Thành phố
              </label>
              <GlassSelect
                id="province"
                value={selectedProvince}
                onChange={(v) => setSelectedProvince(v)}
              >
                <option value="">-- Chọn tỉnh / thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={String(p.code)}>
                    {p.name}
                  </option>
                ))}
              </GlassSelect>
            </div>

            <div>
              <label htmlFor="ward" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Xã / Phường
              </label>
              <GlassSelect
                id="ward"
                value={selectedWard}
                onChange={(v) => setSelectedWard(v)}
                disabled={!selectedProvince || wards.length === 0}
              >
                <option value="">-- Chọn xã / phường --</option>
                {wards.map((w) => (
                  <option key={w.code} value={String(w.code)}>
                    {w.name}
                  </option>
                ))}
              </GlassSelect>
            </div>

            <div>
              <label htmlFor="reg-address" className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
                Địa chỉ hiện tại <span className="text-[#94A3B8] font-normal">(tuỳ chọn)</span>
              </label>
              <input
                id="reg-address"
                placeholder="Số nhà, tên đường, khu vực..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl font-semibold text-[#06B6D4] border border-[#06B6D4]
                           hover:bg-[#06B6D4]/10 transition-all duration-300"
              >
                &larr; Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#22C55E] hover:bg-[#4ADE80]
                           disabled:opacity-60 transition-all duration-300"
              >
                {loading ? 'Đang xử lý...' : 'Hoàn tất'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}