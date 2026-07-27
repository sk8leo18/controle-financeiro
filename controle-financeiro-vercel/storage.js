import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Wallet, TrendingUp, Home as HomeIcon, Receipt, PiggyBank, BarChart3,
  Trash2, X, Utensils, Car, Gamepad2, HeartPulse, GraduationCap, ShoppingBag,
  MoreHorizontal, CreditCard, Target, ArrowUpRight, ArrowDownRight, Landmark,
  Check
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { storage } from "./storage.js";

/* ---------------------------------------------------------------------- */
/* Constantes                                                              */
/* ---------------------------------------------------------------------- */

const ICONS = {
  utensils: Utensils, car: Car, home: HomeIcon, gamepad: Gamepad2,
  heart: HeartPulse, grad: GraduationCap, bag: ShoppingBag, more: MoreHorizontal,
  wallet: Wallet, trend: TrendingUp, landmark: Landmark, card: CreditCard,
};

const DEFAULT_CATEGORIES = [
  { id: "c_alimentacao", name: "Alimentação", type: "expense", icon: "utensils", color: "#A63D40" },
  { id: "c_transporte", name: "Transporte", type: "expense", icon: "car", color: "#3A7A7A" },
  { id: "c_moradia", name: "Moradia", type: "expense", icon: "home", color: "#1F3A5F" },
  { id: "c_lazer", name: "Lazer", type: "expense", icon: "gamepad", color: "#6B4C93" },
  { id: "c_saude", name: "Saúde", type: "expense", icon: "heart", color: "#8A3A5C" },
  { id: "c_educacao", name: "Educação", type: "expense", icon: "grad", color: "#8A5A2B" },
  { id: "c_compras", name: "Compras", type: "expense", icon: "bag", color: "#4C6B8A" },
  { id: "c_outros_d", name: "Outros", type: "expense", icon: "more", color: "#6E756A" },
  { id: "c_salario", name: "Salário", type: "income", icon: "wallet", color: "#2F6F4F" },
  { id: "c_invest", name: "Investimentos", type: "income", icon: "trend", color: "#1F3A5F" },
  { id: "c_outros_r", name: "Outros", type: "income", icon: "more", color: "#6E756A" },
];

const DEFAULT_ACCOUNTS = [
  { id: "a_principal", name: "Carteira", icon: "wallet", color: "#1F3A5F", initialBalance: 0 },
];

const PALETTE = ["#A63D40", "#2F6F4F", "#1F3A5F", "#B08D2B", "#6B4C93", "#3A7A7A", "#8A5A2B", "#8A3A5C", "#4C6B8A", "#6E756A"];

// Selos coloridos (iniciais + cor da marca) — não são os logotipos oficiais,
// que são propriedade registrada de cada instituição.
const BANKS = [
  { name: "Santander", color: "#EC0000", initials: "S" },
  { name: "Itaú", color: "#FF7A00", initials: "It" },
  { name: "Caixa", color: "#0070B8", initials: "CX" },
  { name: "Nubank", color: "#8A05BE", initials: "Nu" },
  { name: "Banco do Brasil", color: "#F5C400", initials: "BB" },
  { name: "Bradesco", color: "#CC092F", initials: "Br" },
  { name: "Inter", color: "#FF7A00", initials: "In" },
  { name: "C6 Bank", color: "#1B1B1B", initials: "C6" },
];

const uid = () => "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const fmt = (n) =>
  (n < 0 ? "-R$ " : "R$ ") + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso) => iso.slice(0, 7);

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/* ---------------------------------------------------------------------- */
/* Estilos globais                                                        */
/* ---------------------------------------------------------------------- */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    .fin-app { font-family: 'IBM Plex Sans', sans-serif; color: var(--ink); }
    .fin-mono { font-family: 'IBM Plex Mono', monospace; }
    .fin-app * { box-sizing: border-box; }

    .fin-scroll::-webkit-scrollbar { width: 4px; }
    .fin-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }

    .fin-tear {
      -webkit-mask-image: repeating-linear-gradient(90deg, black 0 8px, transparent 8px 14px);
      mask-image: repeating-linear-gradient(90deg, black 0 8px, transparent 8px 14px);
      height: 2px;
    }

    .fin-dash { border-bottom: 1.5px dashed var(--line); }

    .fin-btn-primary {
      background: var(--ink); color: var(--card);
      font-family: 'IBM Plex Mono', monospace; font-weight: 600;
      letter-spacing: .02em;
    }
    .fin-btn-primary:active { transform: scale(0.98); }

    .fin-tab-btn { transition: color .15s ease; }

    .fin-sheet {
      animation: fin-slide-up .22s ease-out;
    }
    @keyframes fin-slide-up {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .fin-chip { transition: transform .12s ease, box-shadow .12s ease; }
    .fin-chip:active { transform: scale(0.96); }

    .fin-stamp {
      transform: rotate(-4deg);
      letter-spacing: .08em;
    }

    input, select { font-family: 'IBM Plex Sans', sans-serif; }
    input:focus, select:focus, button:focus-visible {
      outline: 2px solid var(--navy); outline-offset: 1px;
    }
  `}</style>
);

/* ---------------------------------------------------------------------- */
/* Componentes pequenos                                                    */
/* ---------------------------------------------------------------------- */

function CategoryIcon({ cat, size = 16 }) {
  const Icon = ICONS[cat?.icon] || MoreHorizontal;
  return <Icon size={size} color={cat?.color || "#6E756A"} strokeWidth={2} />;
}

function AccountBadge({ account, size = 40 }) {
  if (account.avatarInitials) {
    return (
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, background: account.color }}
      >
        <span className="fin-mono font-semibold" style={{ color: "#fff", fontSize: size * 0.34 }}>
          {account.avatarInitials}
        </span>
      </div>
    );
  }
  const Icon = ICONS[account.icon] || Landmark;
  return (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: account.color + "20" }}>
      <Icon size={size * 0.45} color={account.color} />
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })),
      30000
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fin-mono flex items-center justify-between px-6 pt-3 pb-1 text-[11px]" style={{ color: "var(--ink)" }}>
      <span>{time}</span>
      <div className="flex items-center gap-1">
        <span>••••</span>
        <span style={{ opacity: 0.6 }}>100%</span>
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(27,42,34,0.45)" }} onClick={onClose}>
      <div
        className="fin-sheet fin-scroll overflow-y-auto rounded-t-[28px] px-5 pt-4 pb-6 max-h-[85%]"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--line)" }} />
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "var(--paper)" }}>
            <X size={15} />
          </button>
        </div>
        <h3 className="fin-mono text-[13px] uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="fin-mono block text-[10px] uppercase tracking-widest mb-1.5 mt-3 first:mt-0" style={{ color: "var(--muted)" }}>{children}</label>;
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2.5 text-[14px]"
      style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
    />
  );
}

function SelectInput({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-3 py-2.5 text-[14px]"
      style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
    >
      {children}
    </select>
  );
}

/* ---------------------------------------------------------------------- */
/* App principal                                                          */
/* ---------------------------------------------------------------------- */

const STORAGE_KEY = "financas-app-data-v1";

export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null); // 'txn' | 'account' | 'goal' | null
  const [saveError, setSaveError] = useState(false);

  // Carregar dados
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          setData(JSON.parse(res.value));
        } else {
          setData({ accounts: DEFAULT_ACCOUNTS, categories: DEFAULT_CATEGORIES, transactions: [], goals: [] });
        }
      } catch (e) {
        setData({ accounts: DEFAULT_ACCOUNTS, categories: DEFAULT_CATEGORIES, transactions: [], goals: [] });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Salvar dados (debounced simples)
  useEffect(() => {
    if (!loaded || !data) return;
    const t = setTimeout(async () => {
      try {
        const res = await storage.set(STORAGE_KEY, JSON.stringify(data));
        setSaveError(!res);
      } catch (e) {
        setSaveError(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data, loaded]);

  const addTransaction = useCallback((txn) => {
    setData((d) => ({ ...d, transactions: [{ ...txn, id: uid() }, ...d.transactions] }));
  }, []);

  const deleteTransaction = useCallback((id) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }, []);

  const addAccount = useCallback((acc) => {
    setData((d) => ({ ...d, accounts: [...d.accounts, { ...acc, id: uid() }] }));
  }, []);

  const deleteAccount = useCallback((id) => {
    setData((d) => ({
      ...d,
      accounts: d.accounts.filter((a) => a.id !== id),
      transactions: d.transactions.filter((t) => t.accountId !== id),
    }));
  }, []);

  const addGoal = useCallback((goal) => {
    setData((d) => ({ ...d, goals: [...d.goals, { ...goal, id: uid() }] }));
  }, []);

  const deleteGoal = useCallback((id) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const addToGoal = useCallback((id, amount) => {
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)),
    }));
  }, []);

  const balances = useMemo(() => {
    if (!data) return {};
    const map = {};
    data.accounts.forEach((a) => (map[a.id] = a.initialBalance));
    data.transactions.forEach((t) => {
      map[t.accountId] = (map[t.accountId] || 0) + (t.type === "income" ? t.amount : -t.amount);
    });
    return map;
  }, [data]);

  const totalBalance = useMemo(() => Object.values(balances).reduce((s, v) => s + v, 0), [balances]);

  const totals = useMemo(() => {
    if (!data) return { income: 0, expense: 0 };
    return data.transactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [data]);

  if (!loaded || !data) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: 500 }}>
        <span className="fin-mono text-sm" style={{ color: "#6E756A" }}>Carregando…</span>
      </div>
    );
  }

  const cssVars = {
    "--paper": "#E4E8E2",
    "--ink": "#1B2A22",
    "--navy": "#1F3A5F",
    "--expense": "#A63D40",
    "--income": "#2F6F4F",
    "--gold": "#B08D2B",
    "--card": "#FBFAF6",
    "--muted": "#6E756A",
    "--line": "#C9CFC3",
  };

  return (
    <div
      className="fin-app w-full flex justify-center items-start"
      style={{ ...cssVars, background: "linear-gradient(180deg, #17233B 0%, #0F1826 100%)", padding: "28px 12px", minHeight: 760 }}
    >
      <GlobalStyle />
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 390,
          height: 760,
          background: "var(--paper)",
          borderRadius: 44,
          border: "8px solid #0F1826",
          boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        }}
      >
        <StatusBar />

        <div className="fin-scroll overflow-y-auto" style={{ height: "calc(100% - 132px)" }}>
          {tab === "home" && (
            <HomeView data={data} balances={balances} totalBalance={totalBalance} totals={totals} onDelete={deleteTransaction} onAdd={() => setSheet("txn")} />
          )}
          {tab === "txns" && (
            <TxnsView data={data} onDelete={deleteTransaction} onAdd={() => setSheet("txn")} />
          )}
          {tab === "accounts" && (
            <AccountsView data={data} balances={balances} onAdd={() => setSheet("account")} onDelete={deleteAccount} />
          )}
          {tab === "goals" && (
            <GoalsView data={data} onAdd={() => setSheet("goal")} onDelete={deleteGoal} onAddFunds={addToGoal} />
          )}
          {tab === "reports" && <ReportsView data={data} totals={totals} />}
        </div>

        <TabBar tab={tab} setTab={setTab} />

        {sheet === "txn" && (
          <AddTxnSheet
            data={data}
            onClose={() => setSheet(null)}
            onSave={(t) => { addTransaction(t); setSheet(null); }}
          />
        )}
        {sheet === "account" && (
          <AddAccountSheet onClose={() => setSheet(null)} onSave={(a) => { addAccount(a); setSheet(null); }} />
        )}
        {sheet === "goal" && (
          <AddGoalSheet onClose={() => setSheet(null)} onSave={(g) => { addGoal(g); setSheet(null); }} />
        )}

        {saveError && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 fin-mono text-[11px] px-3 py-1.5 rounded-full" style={{ background: "var(--expense)", color: "#fff" }}>
            Não foi possível salvar
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Tab bar                                                                 */
/* ---------------------------------------------------------------------- */

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "home", label: "Início", Icon: HomeIcon },
    { id: "txns", label: "Lançar", Icon: Receipt },
    { id: "accounts", label: "Contas", Icon: Landmark },
    { id: "goals", label: "Metas", Icon: Target },
    { id: "reports", label: "Relatórios", Icon: BarChart3 },
  ];
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-stretch justify-between px-1"
      style={{ height: 68, background: "var(--card)", borderTop: "1px solid var(--line)" }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="fin-tab-btn flex-1 flex flex-col items-center justify-center gap-1"
            style={{ color: active ? "var(--ink)" : "var(--muted)" }}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
            <span className="fin-mono" style={{ fontSize: 9.5, letterSpacing: ".03em" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Home                                                                    */
/* ---------------------------------------------------------------------- */

function HomeView({ data, totalBalance, totals, onDelete, onAdd }) {
  const recent = data.transactions.slice(0, 6);
  return (
    <div className="px-5 pt-2 pb-6">
      <div className="fin-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--muted)" }}>Saldo geral</div>
      <div className="fin-mono font-semibold" style={{ fontSize: 34, color: "var(--ink)" }}>{fmt(totalBalance)}</div>

      <div className="fin-tear my-4" style={{ background: "var(--line)" }} />

      <div className="flex gap-3 mb-5">
        <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--income)" }}>
            <ArrowUpRight size={14} />
            <span className="fin-mono text-[10px] uppercase tracking-wider">Receitas</span>
          </div>
          <div className="fin-mono font-semibold text-[16px]">{fmt(totals.income)}</div>
        </div>
        <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--expense)" }}>
            <ArrowDownRight size={14} />
            <span className="fin-mono text-[10px] uppercase tracking-wider">Despesas</span>
          </div>
          <div className="fin-mono font-semibold text-[16px]">{fmt(totals.expense)}</div>
        </div>
      </div>

      <button onClick={onAdd} className="fin-btn-primary w-full rounded-2xl py-3 text-[13px] mb-6 flex items-center justify-center gap-2">
        <Plus size={16} /> Novo lançamento
      </button>

      <div className="flex items-center justify-between mb-2">
        <span className="fin-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Extrato recente</span>
      </div>

      {recent.length === 0 ? (
        <EmptyState text="Nenhum lançamento ainda. Toque em “Novo lançamento” para começar." />
      ) : (
        <div>
          {recent.map((t) => (
            <TxnRow key={t.id} t={t} data={data} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl px-4 py-6 text-center" style={{ border: "1.5px dashed var(--line)" }}>
      <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>{text}</p>
    </div>
  );
}

function TxnRow({ t, data, onDelete }) {
  const cat = data.categories.find((c) => c.id === t.categoryId);
  const acc = data.accounts.find((a) => a.id === t.accountId);
  return (
    <div className="fin-dash flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color || "#6E756A") + "20" }}>
        <CategoryIcon cat={cat} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] truncate" style={{ fontWeight: 500 }}>{t.description || cat?.name || "Sem categoria"}</div>
        <div className="fin-mono text-[10.5px]" style={{ color: "var(--muted)" }}>
          {fmtDate(t.date)} · {acc?.name || "—"}
        </div>
      </div>
      <div className="fin-mono text-[13.5px] font-semibold" style={{ color: t.type === "income" ? "var(--income)" : "var(--expense)" }}>
        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
      </div>
      <button onClick={() => onDelete(t.id)} className="ml-1 p-1" style={{ color: "var(--muted)" }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Lançamentos                                                            */
/* ---------------------------------------------------------------------- */

function TxnsView({ data, onDelete, onAdd }) {
  const [filter, setFilter] = useState("all");

  const grouped = useMemo(() => {
    const filtered = data.transactions.filter((t) => filter === "all" || t.categoryId === filter);
    const map = {};
    filtered.forEach((t) => {
      const key = monthKey(t.date);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [data.transactions, filter]);

  return (
    <div className="px-5 pt-3 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Lançamentos</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-1" style={{ scrollbarWidth: "none" }}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Todas" />
        {data.categories.map((c) => (
          <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)} label={c.name} color={c.color} />
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState text="Nada por aqui ainda." />
      ) : (
        grouped.map(([month, txns]) => (
          <div key={month} className="mb-4">
            <div className="fin-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
              {MONTH_NAMES[parseInt(month.slice(5, 7), 10) - 1]} {month.slice(0, 4)}
            </div>
            {txns.map((t) => (
              <TxnRow key={t.id} t={t} data={data} onDelete={onDelete} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className="fin-chip fin-mono flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] whitespace-nowrap"
      style={{
        background: active ? "var(--ink)" : "var(--card)",
        color: active ? "var(--card)" : "var(--ink)",
        border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
      }}
    >
      {color && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: color }} />}
      {label}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Contas                                                                  */
/* ---------------------------------------------------------------------- */

function AccountsView({ data, balances, onAdd, onDelete }) {
  return (
    <div className="px-5 pt-3 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Contas e cartões</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      {data.accounts.map((a) => {
        const bal = balances[a.id] || 0;
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2.5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <AccountBadge account={a} size={40} />
            <div className="flex-1">
              <div className="text-[14px]" style={{ fontWeight: 500 }}>{a.name}</div>
              <div className="fin-mono text-[10.5px]" style={{ color: "var(--muted)" }}>Saldo inicial: {fmt(a.initialBalance)}</div>
            </div>
            <div className="text-right">
              <div className="fin-mono font-semibold text-[14px]" style={{ color: bal >= 0 ? "var(--ink)" : "var(--expense)" }}>{fmt(bal)}</div>
              <button onClick={() => onDelete(a.id)} className="fin-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>remover</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Metas                                                                   */
/* ---------------------------------------------------------------------- */

function GoalsView({ data, onAdd, onDelete, onAddFunds }) {
  return (
    <div className="px-5 pt-3 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Metas de economia</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      {data.goals.length === 0 ? (
        <EmptyState text="Crie uma meta para acompanhar seu progresso, como “Viagem” ou “Reserva de emergência”." />
      ) : (
        data.goals.map((g) => <GoalCard key={g.id} g={g} onDelete={onDelete} onAddFunds={onAddFunds} />)
      )}
    </div>
  );
}

function GoalCard({ g, onDelete, onAddFunds }) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");
  const pct = Math.min(100, (g.currentAmount / Math.max(1, g.targetAmount)) * 100);
  const done = g.currentAmount >= g.targetAmount;

  return (
    <div className="rounded-2xl px-4 py-3.5 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={15} color={g.color} />
          <span className="text-[14px]" style={{ fontWeight: 500 }}>{g.name}</span>
          {done && <Check size={13} color="var(--income)" />}
        </div>
        <button onClick={() => onDelete(g.id)} style={{ color: "var(--muted)" }}><Trash2 size={13} /></button>
      </div>
      <div className="h-2 rounded-full mb-2 overflow-hidden" style={{ background: "var(--paper)" }}>
        <div className="h-full rounded-full" style={{ width: pct + "%", background: g.color }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="fin-mono text-[11.5px]" style={{ color: "var(--muted)" }}>
          {fmt(g.currentAmount)} de {fmt(g.targetAmount)}
        </span>
        <span className="fin-mono text-[11.5px]" style={{ color: "var(--muted)" }}>{pct.toFixed(0)}%</span>
      </div>
      {g.deadline && (
        <div className="fin-mono text-[10px] mb-2" style={{ color: "var(--muted)" }}>Prazo: {fmtDate(g.deadline)}</div>
      )}

      {adding ? (
        <div className="flex gap-2 mt-1">
          <TextInput type="number" step="0.01" placeholder="Valor" value={val} onChange={(e) => setVal(e.target.value)} />
          <button
            className="fin-btn-primary rounded-xl px-3 text-[12px]"
            onClick={() => {
              const n = parseFloat(val);
              if (!isNaN(n) && n > 0) onAddFunds(g.id, n);
              setVal(""); setAdding(false);
            }}
          >OK</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="fin-mono text-[11.5px] mt-1 flex items-center gap-1"
          style={{ color: "var(--navy)" }}
        >
          <Plus size={12} /> Adicionar valor
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Relatórios                                                              */
/* ---------------------------------------------------------------------- */

function ReportsView({ data, totals }) {
  const now = new Date();
  const curMonth = now.toISOString().slice(0, 7);

  const expenseByCategory = useMemo(() => {
    let txns = data.transactions.filter((t) => t.type === "expense" && monthKey(t.date) === curMonth);
    if (txns.length === 0) txns = data.transactions.filter((t) => t.type === "expense");
    const map = {};
    txns.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map).map(([catId, value]) => {
      const cat = data.categories.find((c) => c.id === catId);
      return { name: cat?.name || "Outros", value, color: cat?.color || "#6E756A" };
    }).sort((a, b) => b.value - a.value);
  }, [data, curMonth]);

  const monthlyBars = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return months.map((m) => {
      const income = data.transactions.filter((t) => t.type === "income" && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0);
      const expense = data.transactions.filter((t) => t.type === "expense" && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0);
      return { name: MONTH_NAMES[parseInt(m.slice(5, 7), 10) - 1], Receitas: income, Despesas: expense };
    });
  }, [data]);

  const hasData = data.transactions.length > 0;

  return (
    <div className="px-5 pt-3 pb-6">
      <h2 className="fin-mono text-[13px] uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Relatórios</h2>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="fin-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--income)" }}>Receitas totais</div>
          <div className="fin-mono font-semibold text-[15px]">{fmt(totals.income)}</div>
        </div>
        <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="fin-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--expense)" }}>Despesas totais</div>
          <div className="fin-mono font-semibold text-[15px]">{fmt(totals.expense)}</div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState text="Adicione lançamentos para ver seus relatórios aqui." />
      ) : (
        <>
          <div className="rounded-2xl px-3 py-4 mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="fin-mono text-[11px] uppercase tracking-wider mb-2 px-1" style={{ color: "var(--muted)" }}>Despesas por categoria</div>
            <div style={{ width: "100%", height: 190 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {expenseByCategory.map((entry, i) => <Cell key={i} fill={entry.color} stroke="var(--card)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 px-1">
              {expenseByCategory.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>{e.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl px-3 py-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="fin-mono text-[11px] uppercase tracking-wider mb-2 px-1" style={{ color: "var(--muted)" }}>Receitas x despesas (6 meses)</div>
            <div style={{ width: "100%", height: 190 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyBars} barGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <Bar dataKey="Receitas" fill="var(--income)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Despesas" fill="var(--expense)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Formulários (sheets)                                                    */
/* ---------------------------------------------------------------------- */

function AddTxnSheet({ data, onClose, onSave }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || "");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");

  const cats = data.categories.filter((c) => c.type === type);
  useEffect(() => { if (cats.length && !cats.find(c => c.id === categoryId)) setCategoryId(cats[0].id); }, [type]);

  const canSave = amount && parseFloat(amount) > 0 && categoryId && accountId && date;

  return (
    <Sheet title="Novo lançamento" onClose={onClose}>
      <div className="flex rounded-xl overflow-hidden mb-1" style={{ border: "1px solid var(--line)" }}>
        <button
          onClick={() => setType("expense")}
          className="fin-mono flex-1 py-2.5 text-[12.5px]"
          style={{ background: type === "expense" ? "var(--expense)" : "var(--paper)", color: type === "expense" ? "#fff" : "var(--ink)" }}
        >Despesa</button>
        <button
          onClick={() => setType("income")}
          className="fin-mono flex-1 py-2.5 text-[12.5px]"
          style={{ background: type === "income" ? "var(--income)" : "var(--paper)", color: type === "income" ? "#fff" : "var(--ink)" }}
        >Receita</button>
      </div>

      <FieldLabel>Valor (R$)</FieldLabel>
      <TextInput type="number" step="0.01" min="0" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <FieldLabel>Categoria</FieldLabel>
      <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectInput>

      <FieldLabel>Conta</FieldLabel>
      <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </SelectInput>

      <FieldLabel>Data</FieldLabel>
      <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <FieldLabel>Descrição (opcional)</FieldLabel>
      <TextInput type="text" placeholder="Ex: Almoço, Uber…" value={description} onChange={(e) => setDescription(e.target.value)} />

      <button
        disabled={!canSave}
        onClick={() => onSave({ type, amount: parseFloat(amount), categoryId, accountId, date, description })}
        className="fin-btn-primary w-full rounded-2xl py-3 text-[13px] mt-5"
        style={{ opacity: canSave ? 1 : 0.4 }}
      >Salvar lançamento</button>
    </Sheet>
  );
}

function AddAccountSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState(PALETTE[0]);
  const [avatarInitials, setAvatarInitials] = useState(null);
  const [initialBalance, setInitialBalance] = useState("");

  const canSave = name.trim().length > 0;

  const pickBank = (bank) => {
    setName(bank.name);
    setColor(bank.color);
    setAvatarInitials(bank.initials);
  };

  return (
    <Sheet title="Nova conta ou cartão" onClose={onClose}>
      <FieldLabel>Bancos e carteiras (atalho)</FieldLabel>
      <div className="flex gap-2 flex-wrap mb-1">
        {BANKS.map((b) => (
          <button
            key={b.name}
            onClick={() => pickBank(b)}
            className="fin-chip flex flex-col items-center gap-1"
            style={{ width: 52 }}
          >
            <div className="rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: b.color, border: avatarInitials === b.initials && name === b.name ? "2px solid var(--ink)" : "2px solid transparent" }}>
              <span className="fin-mono font-semibold" style={{ color: "#fff", fontSize: 13 }}>{b.initials}</span>
            </div>
            <span className="text-[9px] text-center leading-tight" style={{ color: "var(--muted)" }}>{b.name}</span>
          </button>
        ))}
      </div>
      <p className="text-[10.5px] mb-2" style={{ color: "var(--muted)" }}>
        Selo com cor e iniciais do banco — não é o logotipo oficial.
      </p>

      <FieldLabel>Nome</FieldLabel>
      <TextInput
        type="text"
        placeholder="Ex: Conta corrente, Carteira…"
        value={name}
        onChange={(e) => { setName(e.target.value); setAvatarInitials(null); }}
      />

      {!avatarInitials && (
        <>
          <FieldLabel>Ícone</FieldLabel>
          <div className="flex gap-2">
            {["wallet", "landmark", "card"].map((k) => {
              const Icon = ICONS[k];
              return (
                <button key={k} onClick={() => setIcon(k)} className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: icon === k ? "var(--ink)" : "var(--paper)", border: "1px solid var(--line)" }}>
                  <Icon size={17} color={icon === k ? "var(--card)" : "var(--ink)"} />
                </button>
              );
            })}
          </div>

          <FieldLabel>Cor</FieldLabel>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full" style={{ background: c, border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent" }} />
            ))}
          </div>
        </>
      )}

      <FieldLabel>Saldo inicial (R$)</FieldLabel>
      <TextInput type="number" step="0.01" placeholder="0,00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />

      <button
        disabled={!canSave}
        onClick={() => onSave({ name: name.trim(), icon, color, avatarInitials, initialBalance: parseFloat(initialBalance) || 0 })}
        className="fin-btn-primary w-full rounded-2xl py-3 text-[13px] mt-5"
        style={{ opacity: canSave ? 1 : 0.4 }}
      >Salvar conta</button>
    </Sheet>
  );
}

function AddGoalSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(PALETTE[3]);

  const canSave = name.trim().length > 0 && parseFloat(target) > 0;

  return (
    <Sheet title="Nova meta" onClose={onClose}>
      <FieldLabel>Nome da meta</FieldLabel>
      <TextInput type="text" placeholder="Ex: Viagem, Reserva de emergência…" value={name} onChange={(e) => setName(e.target.value)} />

      <FieldLabel>Valor alvo (R$)</FieldLabel>
      <TextInput type="number" step="0.01" placeholder="0,00" value={target} onChange={(e) => setTarget(e.target.value)} />

      <FieldLabel>Valor já guardado (opcional)</FieldLabel>
      <TextInput type="number" step="0.01" placeholder="0,00" value={current} onChange={(e) => setCurrent(e.target.value)} />

      <FieldLabel>Prazo (opcional)</FieldLabel>
      <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

      <FieldLabel>Cor</FieldLabel>
      <div className="flex gap-2 flex-wrap">
        {PALETTE.map((c) => (
          <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full" style={{ background: c, border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent" }} />
        ))}
      </div>

      <button
        disabled={!canSave}
        onClick={() => onSave({ name: name.trim(), targetAmount: parseFloat(target), currentAmount: parseFloat(current) || 0, deadline: deadline || null, color })}
        className="fin-btn-primary w-full rounded-2xl py-3 text-[13px] mt-5"
        style={{ opacity: canSave ? 1 : 0.4 }}
      >Salvar meta</button>
    </Sheet>
  );
}
