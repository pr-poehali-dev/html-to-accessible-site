import { useState } from "react";
import Icon from "@/components/ui/icon";

const LOYALTY_URL = "https://functions.poehali.dev/161ff20a-627d-4a64-b671-92b008d9e736";

interface ClientResult {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  stars: number;
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

export default function AdminLoyalty() {
  const [adminPassword, setAdminPassword] = useState(() => sessionStorage.getItem("admin_pwd") || "");
  const [authorized, setAuthorized] = useState(() => Boolean(sessionStorage.getItem("admin_pwd")));
  const [passwordInput, setPasswordInput] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 3500);
  };

  const tryLogin = async () => {
    if (!passwordInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(LOYALTY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": passwordInput },
        body: JSON.stringify({ action: "admin_find", query: "" }),
      });
      if (res.status === 403) {
        showToast("❌ Неверный пароль");
        return;
      }
      sessionStorage.setItem("admin_pwd", passwordInput);
      setAdminPassword(passwordInput);
      setAuthorized(true);
      showToast("✅ Доступ разрешён");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      showToast("❌ Введите имя или телефон");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(LOYALTY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify({ action: "admin_find", query }),
      });
      if (res.status === 403) {
        setAuthorized(false);
        sessionStorage.removeItem("admin_pwd");
        showToast("❌ Сессия истекла, войдите снова");
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
      if (!data.results?.length) showToast("Ничего не найдено");
    } finally {
      setLoading(false);
    }
  };

  const addStar = async (userId: number, delta: number) => {
    setLoading(true);
    try {
      const res = await fetch(LOYALTY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify({ action: "admin_add_star", user_id: userId, delta, reason: "Ручное начисление администратором" }),
      });
      if (res.status === 403) {
        setAuthorized(false);
        sessionStorage.removeItem("admin_pwd");
        showToast("❌ Сессия истекла, войдите снова");
        return;
      }
      const data = await res.json();
      setResults((prev) => prev.map((r) => (r.id === userId ? { ...r, stars: data.stars } : r)));
      showToast(delta > 0 ? "⭐ Звезда добавлена" : "Звезда убрана");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#09041a" }}>
        <div className="w-full max-w-sm">
          <div
            className="rounded-3xl p-7"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}
          >
            <div className="text-center mb-5">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-3xl mb-3"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                <Icon name="Lock" size={26} className="text-white" />
              </div>
              <h1 className="font-display text-xl font-bold text-white">Админ-панель</h1>
              <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.5)" }}>
                Начисление звёзд лояльности
              </p>
            </div>
            <input
              type="password"
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
              placeholder="Пароль администратора"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            />
            <button
              onClick={tryLogin}
              disabled={loading}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {loading ? "Проверка..." : "Войти"}
            </button>
          </div>
        </div>
        <Toast message={toast.message} visible={toast.visible} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-12" style={{ background: "#09041a" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-white">Начисление звёзд</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.5)" }}>
            Найдите клиента по имени, телефону или email
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#e9d5ff" }}
            placeholder="Имя, телефон или email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 rounded-2xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            <Icon name="Search" size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}
            >
              <div>
                <p className="text-white font-semibold text-sm">{r.name || "Без имени"}</p>
                <p className="text-xs" style={{ color: "rgba(196,181,253,0.5)" }}>
                  {r.phone || r.email}
                </p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#facc15" }}>
                  <Icon name="Star" size={12} style={{ fill: "#facc15" }} />
                  {r.stars} звёзд
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addStar(r.id, -1)}
                  disabled={loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#fca5a5" }}
                >
                  <Icon name="Minus" size={16} />
                </button>
                <button
                  onClick={() => addStar(r.id, 1)}
                  disabled={loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }}
                >
                  <Icon name="Plus" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
