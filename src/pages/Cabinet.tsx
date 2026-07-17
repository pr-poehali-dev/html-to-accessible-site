import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/06fa1ae3-63e5-4352-b138-eaecf861031a";
const LOYALTY_URL = "https://functions.poehali.dev/161ff20a-627d-4a64-b671-92b008d9e736";
const STARS_TARGET = 5;

interface Profile {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  stars: number;
  stars_target: number;
  progress: number;
  free_visits_available: number;
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white text-sm font-medium shadow-2xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
    >
      {message}
    </div>
  );
}

export default function Cabinet() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cabinet_token"));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginType, setLoginType] = useState<"phone" | "email">("phone");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 3500);
  };

  const loadProfile = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${LOYALTY_URL}?action=profile`, {
        headers: { "X-Authorization": `Bearer ${authToken}` },
      });
      if (!res.ok) {
        localStorage.removeItem("cabinet_token");
        setToken(null);
        setProfile(null);
        return;
      }
      const data = await res.json();
      setProfile(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadProfile(token);
  }, [token]);

  const handleAuth = async () => {
    if (!form.password || form.password.length < 4) {
      showToast("❌ Пароль минимум 4 символа");
      return;
    }
    if (loginType === "phone" && !form.phone.trim()) {
      showToast("❌ Укажите телефон");
      return;
    }
    if (loginType === "email" && !form.email.trim()) {
      showToast("❌ Укажите email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          login_type: loginType,
          phone: form.phone,
          email: form.email,
          password: form.password,
          name: form.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || "Ошибка"}`);
        return;
      }
      localStorage.setItem("cabinet_token", data.token);
      setToken(data.token);
      setProfile({ ...data.user, stars_target: STARS_TARGET, progress: data.user.stars % STARS_TARGET, free_visits_available: Math.floor(data.user.stars / STARS_TARGET) });
      showToast(mode === "register" ? "✨ Аккаунт создан!" : "✅ Добро пожаловать!");
    } catch {
      showToast("❌ Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cabinet_token");
    setToken(null);
    setProfile(null);
    setForm({ name: "", phone: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16" style={{ background: "#09041a" }}>
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
      />
      <div
        className="absolute top-10 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ec4899, transparent)" }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-1 text-xs mb-4" style={{ color: "rgba(196,181,253,0.5)" }}>
            <Icon name="ArrowLeft" size={14} />
            На главную
          </a>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            <Icon name="Star" size={30} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Личный кабинет</h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
            Копите звёзды и получайте бесплатные визиты
          </p>
        </div>

        {!token || !profile ? (
          <div
            className="rounded-3xl p-7"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}
          >
            <div className="flex rounded-2xl overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setMode("login")}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: mode === "login" ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "transparent",
                  color: mode === "login" ? "#fff" : "rgba(196,181,253,0.5)",
                }}
              >
                Вход
              </button>
              <button
                onClick={() => setMode("register")}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: mode === "register" ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "transparent",
                  color: mode === "register" ? "#fff" : "rgba(196,181,253,0.5)",
                }}
              >
                Регистрация
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setLoginType("phone")}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: loginType === "phone" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${loginType === "phone" ? "rgba(167,139,250,0.4)" : "rgba(167,139,250,0.1)"}`,
                  color: loginType === "phone" ? "#e9d5ff" : "rgba(196,181,253,0.4)",
                }}
              >
                <Icon name="Smartphone" size={13} />
                Телефон
              </button>
              <button
                onClick={() => setLoginType("email")}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: loginType === "email" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${loginType === "email" ? "rgba(167,139,250,0.4)" : "rgba(167,139,250,0.1)"}`,
                  color: loginType === "email" ? "#e9d5ff" : "rgba(196,181,253,0.4)",
                }}
              >
                <Icon name="Mail" size={13} />
                Email
              </button>
            </div>

            <div className="space-y-3">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
                    placeholder="Как к вам обращаться"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}

              {loginType === "phone" ? (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                    Телефон
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
                    placeholder="+7 ___ ___ __ __"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                  Пароль
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
                  placeholder="Минимум 4 символа"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
                {loading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl p-7"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white font-bold text-lg font-display">{profile.name || "Ваш профиль"}</p>
                <p className="text-xs" style={{ color: "rgba(196,181,253,0.5)" }}>
                  {profile.phone || profile.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(196,181,253,0.5)" }}
              >
                Выйти
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: profile.stars_target }).map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  size={32}
                  className={i < profile.progress ? "text-yellow-400" : ""}
                  style={i < profile.progress ? { fill: "#facc15" } : { color: "rgba(255,255,255,0.15)" }}
                />
              ))}
            </div>

            <p className="text-center text-sm mb-1" style={{ color: "rgba(196,181,253,0.7)" }}>
              {profile.progress} из {profile.stars_target} звёзд до бесплатного визита
            </p>
            <p className="text-center text-xs mb-6" style={{ color: "rgba(196,181,253,0.4)" }}>
              Всего накоплено звёзд: {profile.stars}
            </p>

            {profile.free_visits_available > 0 && (
              <div
                className="rounded-2xl p-4 mb-2 text-center"
                style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}
              >
                <p className="text-sm font-semibold text-green-400 flex items-center justify-center gap-1.5">
                  <Icon name="Gift" size={16} />
                  Доступно бесплатных визитов: {profile.free_visits_available}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.5)" }}>
                  Напишите нам, чтобы воспользоваться
                </p>
              </div>
            )}
          </div>
        )}

        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </div>
  );
}
