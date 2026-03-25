import { useState } from "react";
import Icon from "@/components/ui/icon";


interface FormData {
  request: string;
  phone: string;
}

interface ModalData {
  title: string;
  message: string;
}

function formatMessage(
  service: string,
  price: string,
  phone: string,
  request: string,
  type: string
) {
  return `🔔 НОВАЯ ЗАЯВКА!\n\n📋 Услуга: ${service}\n💰 Стоимость: ${price}\n📞 Телефон: ${phone}\n📝 Запрос: ${request || "Не указан"}\n📌 Тип: ${type}\n⏰ Время: ${new Date().toLocaleString("ru-RU")}\n\nОтправлено с сайта TatisHelp`;
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white text-sm font-medium shadow-2xl transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
    >
      {message}
    </div>
  );
}

function Modal({ data, onClose }: { data: ModalData; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,0,30,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-7 shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1e0a3c, #2d0a4e)",
          border: "1px solid rgba(167,139,250,0.3)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-purple-300 hover:text-white transition-colors text-3xl leading-none"
        >
          ×
        </button>
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            <Icon name="CheckCheck" size={26} className="text-white" />
          </div>
          <h3 className="text-white text-xl font-bold font-display">{data.title}</h3>
          <p className="text-purple-200 text-sm mt-1">
            Скопируйте и отправьте мне удобным способом:
          </p>
        </div>
        <div
          className="rounded-2xl p-4 mb-5 text-xs font-mono whitespace-pre-wrap break-words"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(167,139,250,0.2)",
            color: "#e9d5ff",
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          {data.message}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: "rgba(124,58,237,0.4)",
              border: "1px solid rgba(167,139,250,0.3)",
            }}
          >
            <Icon name={copied ? "Check" : "Copy"} size={18} />
            {copied ? "Готово!" : "Копировать"}
          </button>
          <a
            href={`https://t.me/tanii289?text=${encodeURIComponent(data.message)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #2563eb)" }}
          >
            <Icon name="Send" size={18} />
            Telegram
          </a>
          <a
            href="https://vk.com/tanyshkasv"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #4c75a3, #2a5298)" }}
          >
            <Icon name="MessageSquare" size={18} />
            ВКонтакте
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [modal, setModal] = useState<ModalData | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [forms, setForms] = useState<Record<string, FormData>>({
    primary: { request: "", phone: "" },
    full: { request: "", phone: "" },
    sos: { request: "", phone: "" },
  });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 3500);
  };

  const handleSubmit = (
    serviceId: string,
    serviceName: string,
    price: string,
    type: string
  ) => {
    const form = forms[serviceId];
    if (!form?.phone.trim()) {
      showToast("❌ Укажите телефон для связи");
      return;
    }
    const msg = formatMessage(serviceName, price, form.phone, form.request, type);
    setModal({ title: "✅ Заявка готова!", message: msg });
    setForms((prev) => ({
      ...prev,
      [serviceId]: { request: "", phone: "" },
    }));
  };

  const updateForm = (id: string, field: keyof FormData, value: string) => {
    setForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const consultations = [
    {
      id: "primary",
      emoji: "✨",
      title: "Первичная консультация",
      price: "750 ₽",
      duration: "50 минут",
      desc: "Знакомство, запрос, диагностика. Определим направление для дальнейшей работы.",
      placeholder: "Тревожность, отношения, выгорание, самооценка...",
      type: "Консультация",
      from: "#7c3aed",
      to: "#a855f7",
    },
    {
      id: "full",
      emoji: "🕊️",
      title: "Полноценная консультация",
      price: "1 200 ₽",
      duration: "60 минут",
      desc: "Глубокая проработка запроса, психологические техники, поддержка и стратегия.",
      placeholder: "Что вас беспокоит? С чем пришли?",
      type: "Консультация",
      from: "#ec4899",
      to: "#f43f5e",
    },
  ];

  const matrices = [
    {
      id: "m1",
      icon: "Gem",
      title: "Классическая матрица",
      desc: "Расчёт по дате рождения: характер, предназначение, денежный канал, здоровье.",
      badge: "45–60 мин",
      price: "1 800 ₽",
      from: "#f59e0b",
      to: "#f97316",
    },
    {
      id: "m2",
      icon: "Heart",
      title: "Матрица совместимости",
      desc: "Анализ пары: сильные стороны, точки напряжения, кармические связи.",
      badge: "50–70 мин",
      price: "2 200 ₽",
      from: "#ec4899",
      to: "#f43f5e",
    },
    {
      id: "m3",
      icon: "Sparkles",
      title: "Детская матрица",
      desc: "Раскрытие потенциала ребёнка, зоны развития и рекомендации для родителей.",
      badge: "40–50 мин",
      price: "1 500 ₽",
      from: "#38bdf8",
      to: "#6366f1",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#09041a" }}>
      {/* HERO */}
      <section className="relative overflow-hidden py-16 md:py-24 px-5">
        {/* Glow blobs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
        />
        <div
          className="absolute top-10 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ec4899, transparent)" }}
        />

        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-full">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                style={{
                  background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  color: "#c4b5fd",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
                Онлайн-консультации · Матрица судьбы
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5 font-display">
                Свитнева{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #a78bfa, #ec4899, #f97316)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Татьяна
                </span>
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "rgba(196,181,253,0.65)" }}>
                Практикующий психолог. Помогу найти внутренний баланс, опору и новые смыслы — онлайн по всему миру.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="https://t.me/tanii289"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                >
                  <Icon name="Send" size={16} />
                  Написать в Telegram
                </a>
                <a
                  href="tel:+79085517030"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    color: "#e9d5ff",
                  }}
                >
                  <Icon name="Phone" size={16} />
                  +7 908 551-70-30
                </a>
              </div>


            </div>

          </div>
        </div>
      </section>

      {/* КОНСУЛЬТАЦИИ */}
      <section className="py-14 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
                color: "#c4b5fd",
              }}
            >
              💬 Психология
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Консультации
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
              Выберите формат — разберёмся вместе
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {consultations.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl p-7 transition-all hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(167,139,250,0.15)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-2xl mb-3"
                      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                    >
                      {c.emoji}
                    </div>
                    <h3 className="text-white font-bold text-xl font-display">{c.title}</h3>
                    <div className="flex items-center gap-1 mt-1" style={{ color: "rgba(167,139,250,0.4)" }}>
                      <Icon name="Clock" size={12} />
                      <span className="text-xs">{c.duration}</span>
                    </div>
                  </div>
                  <div
                    className="text-xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {c.price}
                  </div>
                </div>

                <p className="text-sm mb-5 leading-relaxed" style={{ color: "rgba(196,181,253,0.55)" }}>
                  {c.desc}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                      Ваш запрос (кратко)
                    </label>
                    <textarea
                      className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        color: "#e9d5ff",
                      }}
                      rows={2}
                      placeholder={c.placeholder}
                      value={forms[c.id]?.request}
                      onChange={(e) => updateForm(c.id, "request", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
                      Телефон для связи *
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        color: "#e9d5ff",
                      }}
                      placeholder="+7 ___ ___ __ __"
                      value={forms[c.id]?.phone}
                      onChange={(e) => updateForm(c.id, "phone", e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                    onClick={() => handleSubmit(c.id, c.title, c.price, c.type)}
                  >
                    <Icon name="CalendarCheck" size={16} />
                    Записаться за {c.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* МАТРИЦА СУДЬБЫ */}
      <section className="py-14 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.2)",
                color: "#fcd34d",
              }}
            >
              🔮 Нумерология
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Матрица судьбы
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
              22 аркана раскроют ваши таланты, ресурсы и задачи
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {matrices.map((m) => (
              <div
                key={m.id}
                className="rounded-3xl p-6 flex flex-col transition-all hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(167,139,250,0.12)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}
                >
                  <Icon name={m.icon as "Gem" | "Heart" | "Sparkles"} size={26} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-lg font-display mb-2">{m.title}</h3>
                <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "rgba(196,181,253,0.5)" }}>
                  {m.desc}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(196,181,253,0.5)",
                    }}
                  >
                    <Icon name="Clock" size={11} />
                    {m.badge}
                  </span>
                  <span
                    className="text-lg font-black"
                    style={{
                      background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {m.price}
                  </span>
                </div>
                <button
                  className="w-full py-2.5 rounded-2xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}
                  onClick={() => {
                    const msg = formatMessage(
                      m.title,
                      m.price,
                      "—",
                      "Нужна дата рождения (уточним в чате)",
                      "Матрица судьбы"
                    );
                    setModal({ title: "✅ Заявка на матрицу!", message: msg });
                  }}
                >
                  Записаться · {m.price}
                </button>
              </div>
            ))}
          </div>

          <p
            className="text-center text-xs mt-6 flex items-center justify-center gap-1.5"
            style={{ color: "rgba(167,139,250,0.35)" }}
          >
            <Icon name="Lock" size={11} />
            Для расчёта нужна дата рождения. Все данные конфиденциальны.
          </p>
        </div>
      </section>

      {/* SOS */}
      <section className="py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a0533 0%, #3b0764 50%, #450a0a 100%)",
              border: "1px solid rgba(249,115,22,0.25)",
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, #dc2626, transparent)" }}
            />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  SOS · Срочная помощь
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-1">
                  Экстренная поддержка
                </h2>
                <p className="text-sm mb-1" style={{ color: "rgba(253,186,116,0.5)" }}>
                  30 минут · без очереди · здесь и сейчас
                </p>
                <div
                  className="text-4xl font-black my-4"
                  style={{
                    background: "linear-gradient(135deg, #fb923c, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  500 ₽
                </div>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(253,186,116,0.45)" }}>
                  Разбор острого состояния, техники стабилизации, быстрая психологическая помощь.
                </p>

                <div className="space-y-3">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "rgba(253,186,116,0.6)" }}
                    >
                      Коротко опишите ситуацию
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(249,115,22,0.25)",
                        color: "#fff7ed",
                      }}
                      placeholder="Паническая атака, сильная тревога..."
                      value={forms.sos.request}
                      onChange={(e) => updateForm("sos", "request", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "rgba(253,186,116,0.6)" }}
                    >
                      Телефон для срочной связи *
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(249,115,22,0.25)",
                        color: "#fff7ed",
                      }}
                      placeholder="+7 ___ ___ __ __"
                      value={forms.sos.phone}
                      onChange={(e) => updateForm("sos", "phone", e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{ background: "linear-gradient(135deg, #ea580c, #dc2626)" }}
                    onClick={() =>
                      handleSubmit("sos", "SOS-консультация 30 минут", "500 ₽", "SOS срочная поддержка")
                    }
                  >
                    <Icon name="Zap" size={16} />
                    Нужна помощь сейчас · 500 ₽
                  </button>
                </div>
              </div>

              <div className="flex-shrink-0 text-center">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-3 mx-auto"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <Icon name="Headphones" size={44} className="text-red-400" />
                </div>
                <p className="text-xs" style={{ color: "rgba(253,186,116,0.4)" }}>
                  Видео, аудио или чат
                  <br />
                  Ежедневно 9:00–22:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-5 mt-4">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(167,139,250,0.12)",
            }}
          >
            <p className="font-display text-xl text-white font-semibold mb-1">
              Свитнева Татьяна
            </p>
            <p className="text-sm mb-6" style={{ color: "rgba(196,181,253,0.35)" }}>
              Практикующий психолог · специалист по матрице судьбы
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {[
                { icon: "Mail", label: "Tatishelp@mail.ru", href: "mailto:Tatishelp@mail.ru" },
                { icon: "Phone", label: "+7 908 551-70-30", href: "tel:+79085517030" },
                { icon: "Send", label: "@tanii289", href: "https://t.me/tanii289" },
                { icon: "Users", label: "vk.com/tanyshkasv", href: "https://vk.com/tanyshkasv" },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
                  style={{
                    background: "rgba(167,139,250,0.1)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    color: "#c4b5fd",
                  }}
                >
                  <Icon name={c.icon as "Mail" | "Phone" | "Send" | "Users"} size={14} />
                  {c.label}
                </a>
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(167,139,250,0.2)" }}>
              © 2025 TatisHelp · Консультации онлайн по всему миру
            </p>
          </div>
        </div>
      </footer>

      {modal && <Modal data={modal} onClose={() => setModal(null)} />}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}