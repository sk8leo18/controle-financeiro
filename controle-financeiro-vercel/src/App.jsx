import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Wallet, TrendingUp, Home as HomeIcon, Receipt, PiggyBank, BarChart3,
  Trash2, X, Utensils, Car, Gamepad2, HeartPulse, GraduationCap, ShoppingBag,
  MoreHorizontal, CreditCard, Target, ArrowUpRight, ArrowDownRight, Landmark,
  Check, ChevronLeft, ChevronRight, LogOut, Calculator, Sun, Moon, Bell, Sparkles, Search
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { storage, migrateLocalToCloud } from "./storage.js";
import { auth, googleProvider, hasFirebaseConfig } from "./firebase.js";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

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

const THEMES = {
  light: {
    "--paper": "#E4E8E2",
    "--ink": "#1B2A22",
    "--navy": "#1F3A5F",
    "--expense": "#A63D40",
    "--income": "#2F6F4F",
    "--gold": "#B08D2B",
    "--card": "#FBFAF6",
    "--muted": "#6E756A",
    "--line": "#C9CFC3",
  },
  dark: {
    "--paper": "#12181A",
    "--ink": "#ECEAE2",
    "--navy": "#7FA6D6",
    "--expense": "#E0898C",
    "--income": "#74C79B",
    "--gold": "#D9BB6C",
    "--card": "#1D2523",
    "--muted": "#8B958E",
    "--line": "#333F3A",
  },
};

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

// Histórico de novidades do app — atualize este array a cada leva de melhorias.
const CHANGELOG = [
  {
    version: 6,
    title: "Busca, parcelamento e confirmação ao apagar",
    items: [
      "Busca por nome ou categoria dentro da Fatura, procurando em todos os meses",
      "Lançamentos parcelados: divide o valor total em várias parcelas mensais",
      "Lançamentos fixos: repete o mesmo valor todo mês automaticamente",
      "Agora é preciso confirmar antes de apagar qualquer lançamento, conta ou meta",
      "Corrigido bug do modo claro que deixava campos e telas com aparência escura/invertida em alguns celulares",
    ],
  },
  {
    version: 5,
    title: "Modo escuro e calculadora de salário",
    items: [
      "Botão para alternar entre modo claro e escuro, com preferência salva",
      "Corrigido um bug de cores invertidas em alguns celulares Android",
      "Nova aba \"Salário\": calcula o desconto de INSS pela tabela oficial de 2026 e mostra o salário líquido considerando o consignado",
    ],
  },
  {
    version: 4,
    title: "Layout novo para PC e app instalável",
    items: [
      "Menu lateral e layout em colunas ao abrir no computador",
      "App agora pode ser empacotado como aplicativo Android (sem abrir navegador)",
      "Ajustes de área segura para funcionar bem em qualquer celular",
    ],
  },
  {
    version: 3,
    title: "Fatura mensal",
    items: [
      "O extrato agora é organizado por mês, como uma fatura de cartão",
      "Navegação simples entre meses com total de receitas, despesas e saldo",
    ],
  },
  {
    version: 2,
    title: "Login com Google",
    items: [
      "Os dados agora podem ser salvos na nuvem e sincronizados entre aparelhos",
      "Lançamentos feitos antes do login são migrados automaticamente",
    ],
  },
  {
    version: 1,
    title: "Lançamento do app",
    items: [
      "Controle de receitas, despesas, contas, metas e relatórios com gráficos",
      "Categorias e contas personalizáveis, com selos de bancos conhecidos",
    ],
  },
];
const CHANGELOG_LATEST_VERSION = CHANGELOG[0].version;

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Tabela oficial do INSS 2026 (Portaria Interministerial MPS/MF, vigente desde jan/2026)
// Teto de contribuição: R$ 8.475,55 · Desconto máximo: ~R$ 988,09
const INSS_FAIXAS_2026 = [
  { ate: 1621.00, aliquota: 0.075 },
  { ate: 2902.84, aliquota: 0.09 },
  { ate: 4354.27, aliquota: 0.12 },
  { ate: 8475.55, aliquota: 0.14 },
];

function calcularINSS(salarioBruto) {
  const teto = INSS_FAIXAS_2026[INSS_FAIXAS_2026.length - 1].ate;
  const base = Math.min(Math.max(salarioBruto, 0), teto);
  let total = 0;
  let anterior = 0;
  const faixas = [];
  for (const { ate, aliquota } of INSS_FAIXAS_2026) {
    if (base > anterior) {
      const fatia = Math.min(base, ate) - anterior;
      const valor = fatia * aliquota;
      total += valor;
      faixas.push({ de: anterior, ate: Math.min(base, ate), aliquota, valor });
    }
    anterior = ate;
  }
  return { total, faixas };
}

/* ---------------------------------------------------------------------- */
/* Estilos globais                                                        */
/* ---------------------------------------------------------------------- */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    :root { color-scheme: light dark; }
    .fin-app { font-family: 'IBM Plex Sans', sans-serif; color: var(--ink); color-scheme: light dark; transition: background-color .15s ease, color .15s ease; }
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

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end md:items-center md:justify-center" style={{ background: "rgba(27,42,34,0.45)" }} onClick={onClose}>
      <div
        className="fin-sheet fin-scroll overflow-y-auto rounded-t-[28px] md:rounded-[24px] px-5 pt-4 pb-6 max-h-[85%] w-full md:max-w-[440px] md:mx-4"
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
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!hasFirebaseConfig);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("financas-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  // Salvar preferência de tema e atualizar a cor da barra do navegador/app
  useEffect(() => {
    try {
      localStorage.setItem("financas-theme", theme);
    } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEMES[theme]["--paper"]);

    // Trava o color-scheme no tema ativo (em vez de "light dark"), para que
    // selects, campos de data e a barra de rolagem nativos não fiquem com
    // aparência diferente do resto do app quando o celular está no tema oposto.
    document.documentElement.style.colorScheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = THEMES[theme]["--paper"];
    document.body.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const [showChangelog, setShowChangelog] = useState(false);
  const [seenVersion, setSeenVersion] = useState(() => {
    try {
      return parseInt(localStorage.getItem("financas-changelog-seen") || "0", 10);
    } catch (e) {
      return 0;
    }
  });
  const hasNewChangelog = seenVersion < CHANGELOG_LATEST_VERSION;

  const openChangelog = () => {
    setShowChangelog(true);
    setSeenVersion(CHANGELOG_LATEST_VERSION);
    try {
      localStorage.setItem("financas-changelog-seen", String(CHANGELOG_LATEST_VERSION));
    } catch (e) {}
  };

  // Observar login/logout com Google
  useEffect(() => {
    if (!hasFirebaseConfig) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    if (!hasFirebaseConfig) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Erro ao entrar com Google:", e);
    }
  };

  const handleSignOut = async () => {
    if (!hasFirebaseConfig) return;
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  // Carregar dados (roda de novo sempre que o login mudar)
  useEffect(() => {
    if (!authReady) return;
    setLoaded(false);
    (async () => {
      try {
        if (user) await migrateLocalToCloud(STORAGE_KEY);
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          setData(JSON.parse(res.value));
        } else {
          setData({ accounts: DEFAULT_ACCOUNTS, categories: DEFAULT_CATEGORIES, transactions: [], goals: [], settings: { grossSalary: "", consignado: "" } });
        }
      } catch (e) {
        setData({ accounts: DEFAULT_ACCOUNTS, categories: DEFAULT_CATEGORIES, transactions: [], goals: [], settings: { grossSalary: "", consignado: "" } });
      } finally {
        setLoaded(true);
      }
    })();
  }, [authReady, user]);

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

  const addTransactions = useCallback((txns) => {
    setData((d) => ({ ...d, transactions: [...txns.map((t) => ({ ...t, id: uid() })), ...d.transactions] }));
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

  const updateSettings = useCallback((patch) => {
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), ...patch } }));
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

  const cssVars = THEMES[theme];

  return (
    <div
      className="fin-app w-full min-h-dvh"
      style={{ ...cssVars, background: "var(--paper)", colorScheme: theme }}
    >
      <GlobalStyle />
      <div className="md:flex md:items-start">
        <SidebarNav tab={tab} setTab={setTab} user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} theme={theme} onToggleTheme={toggleTheme} onOpenChangelog={openChangelog} hasNewChangelog={hasNewChangelog} />

        <div className="flex-1 min-w-0 md:ml-60">
          <div
            className="md:hidden flex items-center justify-between px-5"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)", paddingBottom: 8 }}
          >
            {hasFirebaseConfig ? (
              user ? (
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL && <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />}
                  <span className="fin-mono text-[11px] truncate" style={{ color: "var(--muted)" }}>
                    {user.displayName ? user.displayName.split(" ")[0] : user.email}
                  </span>
                </div>
              ) : (
                <span className="fin-mono text-[11px]" style={{ color: "var(--muted)" }}>Dados salvos neste aparelho</span>
              )
            ) : <span />}
            <div className="flex items-center gap-3">
              {hasFirebaseConfig && (
                <button
                  onClick={user ? handleSignOut : handleSignIn}
                  className="fin-mono text-[11px] flex-shrink-0"
                  style={{ color: "var(--navy)" }}
                >
                  {user ? "Sair" : "Entrar com Google"}
                </button>
              )}
              <button
                onClick={openChangelog}
                aria-label="Novidades"
                className="relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--card)", border: "1px solid var(--line)" }}
              >
                <Bell size={13} />
                {hasNewChangelog && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--expense)" }} />
                )}
              </button>
              <button
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--card)", border: "1px solid var(--line)" }}
              >
                {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
              </button>
            </div>
          </div>

          <main
            className="max-w-[1080px] mx-auto pb-24 md:pb-10"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            {tab === "home" && (
              <HomeView data={data} balances={balances} totalBalance={totalBalance} totals={totals} onDelete={deleteTransaction} onAdd={() => setSheet("txn")} />
            )}
            {tab === "txns" && (
              <FaturaView data={data} onDelete={deleteTransaction} onAdd={() => setSheet("txn")} />
            )}
            {tab === "accounts" && (
              <AccountsView data={data} balances={balances} onAdd={() => setSheet("account")} onDelete={deleteAccount} />
            )}
            {tab === "goals" && (
              <GoalsView data={data} onAdd={() => setSheet("goal")} onDelete={deleteGoal} onAddFunds={addToGoal} />
            )}
            {tab === "reports" && <ReportsView data={data} totals={totals} />}
            {tab === "salary" && <SalaryView data={data} onUpdateSettings={updateSettings} />}
          </main>
        </div>
      </div>

      <TabBar tab={tab} setTab={setTab} />

      {sheet === "txn" && (
        <AddTxnSheet
          data={data}
          onClose={() => setSheet(null)}
          onSave={(txns) => { addTransactions(txns); setSheet(null); }}
        />
      )}
      {sheet === "account" && (
        <AddAccountSheet onClose={() => setSheet(null)} onSave={(a) => { addAccount(a); setSheet(null); }} />
      )}
      {sheet === "goal" && (
        <AddGoalSheet onClose={() => setSheet(null)} onSave={(g) => { addGoal(g); setSheet(null); }} />
      )}
      {showChangelog && <ChangelogSheet onClose={() => setShowChangelog(false)} />}

      {saveError && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 fin-mono text-[11px] px-3 py-1.5 rounded-full z-40" style={{ background: "var(--expense)", color: "#fff" }}>
          Não foi possível salvar
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Navegação                                                              */
/* ---------------------------------------------------------------------- */

const NAV_ITEMS = [
  { id: "home", label: "Início", Icon: HomeIcon },
  { id: "txns", label: "Fatura", Icon: Receipt },
  { id: "accounts", label: "Contas", Icon: Landmark },
  { id: "goals", label: "Metas", Icon: Target },
  { id: "salary", label: "Salário", Icon: Calculator },
  { id: "reports", label: "Relatórios", Icon: BarChart3 },
];

function SidebarNav({ tab, setTab, user, onSignIn, onSignOut, theme, onToggleTheme, onOpenChangelog, hasNewChangelog }) {
  return (
    <aside
      className="hidden md:flex md:flex-col md:w-60 md:h-dvh md:sticky md:top-0 md:flex-shrink-0 px-4 py-6"
      style={{ borderRight: "1px solid var(--line)", background: "var(--card)" }}
    >
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--ink)" }}>
            <Wallet size={17} color="var(--card)" />
          </div>
          <span className="fin-mono font-semibold text-[15px]">Financeiro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenChangelog}
            aria-label="Novidades"
            className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
          >
            <Bell size={14} />
            {hasNewChangelog && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--expense)" }} />
            )}
          </button>
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              style={{
                background: active ? "var(--paper)" : "transparent",
                color: active ? "var(--ink)" : "var(--muted)",
                border: active ? "1px solid var(--line)" : "1px solid transparent",
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
              <span className="fin-mono text-[13px]">{label}</span>
            </button>
          );
        })}
      </nav>

      {hasFirebaseConfig && (
        <div className="mt-auto pt-4 px-2" style={{ borderTop: "1px solid var(--line)" }}>
          {user ? (
            <div className="flex items-center gap-2 min-w-0 mb-2">
              {user.photoURL && <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />}
              <span className="fin-mono text-[11.5px] truncate" style={{ color: "var(--muted)" }}>
                {user.displayName ? user.displayName.split(" ")[0] : user.email}
              </span>
            </div>
          ) : (
            <div className="fin-mono text-[11px] mb-2" style={{ color: "var(--muted)" }}>Dados salvos neste aparelho</div>
          )}
          <button
            onClick={user ? onSignOut : onSignIn}
            className="fin-mono text-[11.5px] flex items-center gap-1.5"
            style={{ color: "var(--navy)" }}
          >
            {user ? <><LogOut size={13} /> Sair</> : "Entrar com Google"}
          </button>
        </div>
      )}
    </aside>
  );
}

/* ---------------------------------------------------------------------- */
/* Tab bar                                                                 */
/* ---------------------------------------------------------------------- */

function TabBar({ tab, setTab }) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch justify-between px-1 z-20"
      style={{ height: 68, background: "var(--card)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
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
    <div className="px-5 md:px-8 pt-2 md:pt-8 pb-6">
      <div className="md:grid md:grid-cols-[340px_1fr] md:gap-8 md:items-start">
        <div>
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

          <button onClick={onAdd} className="fin-btn-primary w-full rounded-2xl py-3 text-[13px] mb-6 md:mb-0 flex items-center justify-center gap-2">
            <Plus size={16} /> Novo lançamento
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 md:mt-1">
            <span className="fin-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Extrato recente</span>
          </div>

          {recent.length === 0 ? (
            <EmptyState text="Nenhum lançamento ainda. Toque em “Novo lançamento” para começar." />
          ) : (
            <div className="md:rounded-2xl md:px-4 md:border" style={{ borderColor: "var(--line)", background: "transparent" }}>
              {recent.map((t) => (
                <TxnRow key={t.id} t={t} data={data} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
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

function ConfirmDeleteButton({ onConfirm, size = 13 }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (confirming) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          className="fin-mono text-[10px] px-2 py-1 rounded-full"
          style={{ background: "var(--expense)", color: "#fff" }}
        >
          Apagar?
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }} className="p-1 flex-shrink-0" style={{ color: "var(--muted)" }}>
          <X size={size} />
        </button>
      </div>
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); setConfirming(true); }} className="p-1 flex-shrink-0" style={{ color: "var(--muted)" }}>
      <Trash2 size={size} />
    </button>
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
      <ConfirmDeleteButton onConfirm={() => onDelete(t.id)} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Fatura (extrato organizado por mês, como uma fatura de cartão)          */
/* ---------------------------------------------------------------------- */

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.toISOString().slice(0, 7);
}

// Soma meses a uma data (YYYY-MM-DD) sem "estourar" para o mês seguinte
// quando o mês de destino tem menos dias (ex: 31/01 + 1 mês = 28/02, não 03/03).
function addMonthsClamped(dateStr, months) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, daysInTarget));
  return target.toISOString().slice(0, 10);
}

function FaturaView({ data, onDelete, onAdd }) {
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;

  const monthTxns = useMemo(() => {
    return data.transactions
      .filter((t) => monthKey(t.date) === month && (filter === "all" || t.categoryId === filter))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.transactions, month, filter]);

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return data.transactions
      .filter((t) => {
        if (filter !== "all" && t.categoryId !== filter) return false;
        const cat = data.categories.find((c) => c.id === t.categoryId);
        const haystack = `${t.description || ""} ${cat?.name || ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.transactions, data.categories, search, filter, isSearching]);

  const monthTotals = useMemo(
    () =>
      monthTxns.reduce(
        (acc, t) => {
          if (t.type === "income") acc.income += t.amount;
          else acc.expense += t.amount;
          return acc;
        },
        { income: 0, expense: 0 }
      ),
    [monthTxns]
  );

  const grouped = useMemo(() => {
    const map = {};
    (isSearching ? searchResults : monthTxns).forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map);
  }, [monthTxns, searchResults, isSearching]);

  const [y, m] = month.split("-").map(Number);
  const net = monthTotals.income - monthTotals.expense;
  const isCurrent = month === todayISO().slice(0, 7);

  return (
    <div className="px-5 md:px-8 pt-3 md:pt-8 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Fatura</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Plus size={16} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lançamento ou categoria…"
          className="w-full rounded-xl pl-9 pr-8 py-2.5 text-[13px]"
          style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink)" }}
        />
        {isSearching && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 md:items-start">
        <div className="md:sticky md:top-8">
          {/* Cartão de fatura, com navegação de mês */}
          <div className="rounded-2xl px-4 py-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: isSearching ? 0.5 : 1 }}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMonth((m) => shiftMonth(m, -1))} disabled={isSearching} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--paper)" }}>
                <ChevronLeft size={15} />
              </button>
              <div className="text-center">
                <div className="fin-mono text-[13.5px] font-semibold">{MONTH_NAMES[m - 1]} {y}</div>
                {isCurrent && <div className="fin-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Mês atual</div>}
              </div>
              <button onClick={() => setMonth((m) => shiftMonth(m, 1))} disabled={isSearching} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--paper)" }}>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="fin-tear mb-3" style={{ background: "var(--line)" }} />

            <div className="flex items-center justify-between mb-1.5">
              <span className="fin-mono text-[11px]" style={{ color: "var(--income)" }}>Receitas</span>
              <span className="fin-mono text-[13px] font-semibold">{fmt(monthTotals.income)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="fin-mono text-[11px]" style={{ color: "var(--expense)" }}>Despesas</span>
              <span className="fin-mono text-[13px] font-semibold">{fmt(monthTotals.expense)}</span>
            </div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px dashed var(--line)" }}>
              <span className="fin-mono text-[11.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Total do mês</span>
              <span className="fin-mono text-[16px] font-semibold" style={{ color: net >= 0 ? "var(--income)" : "var(--expense)" }}>{fmt(net)}</span>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap" style={{ scrollbarWidth: "none" }}>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Todas" />
            {data.categories.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)} label={c.name} color={c.color} />
            ))}
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          {isSearching && (
            <div className="fin-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
              {grouped.length === 0 ? "Nenhum resultado" : "Resultados da busca · todos os meses"}
            </div>
          )}
          {grouped.length === 0 ? (
            <EmptyState text={isSearching ? "Nenhum lançamento encontrado para essa busca." : "Nenhum lançamento neste mês."} />
          ) : (
            grouped.map(([date, txns]) => (
              <div key={date} className="mb-4">
                <div className="fin-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
                  {fmtDate(date)}
                </div>
                {txns.map((t) => (
                  <TxnRow key={t.id} t={t} data={data} onDelete={onDelete} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
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
    <div className="px-5 md:px-8 pt-3 md:pt-8 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Contas e cartões</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-3">
        {data.accounts.map((a) => {
          const bal = balances[a.id] || 0;
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2.5 md:mb-0" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <AccountBadge account={a} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ fontWeight: 500 }}>{a.name}</div>
                <div className="fin-mono text-[10.5px]" style={{ color: "var(--muted)" }}>Saldo inicial: {fmt(a.initialBalance)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="fin-mono font-semibold text-[14px]" style={{ color: bal >= 0 ? "var(--ink)" : "var(--expense)" }}>{fmt(bal)}</div>
                <div className="flex justify-end mt-0.5">
                  <ConfirmDeleteButton onConfirm={() => onDelete(a.id)} size={12} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Metas                                                                   */
/* ---------------------------------------------------------------------- */

function GoalsView({ data, onAdd, onDelete, onAddFunds }) {
  return (
    <div className="px-5 md:px-8 pt-3 md:pt-8 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="fin-mono text-[13px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Metas de economia</h2>
        <button onClick={onAdd} className="fin-btn-primary rounded-full w-8 h-8 flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>

      {data.goals.length === 0 ? (
        <EmptyState text="Crie uma meta para acompanhar seu progresso, como “Viagem” ou “Reserva de emergência”." />
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-3">
          {data.goals.map((g) => <GoalCard key={g.id} g={g} onDelete={onDelete} onAddFunds={onAddFunds} />)}
        </div>
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
    <div className="rounded-2xl px-4 py-3.5 mb-3 md:mb-0" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={15} color={g.color} />
          <span className="text-[14px]" style={{ fontWeight: 500 }}>{g.name}</span>
          {done && <Check size={13} color="var(--income)" />}
        </div>
        <ConfirmDeleteButton onConfirm={() => onDelete(g.id)} />
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
    <div className="px-5 md:px-8 pt-3 md:pt-8 pb-6">
      <h2 className="fin-mono text-[13px] uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Relatórios</h2>

      <div className="flex gap-3 mb-5 md:max-w-[500px]">
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
        <div className="md:grid md:grid-cols-2 md:gap-5">
          <div className="rounded-2xl px-3 py-4 mb-5 md:mb-0" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
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
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Calculadora de salário (INSS 2026 + consignado)                        */
/* ---------------------------------------------------------------------- */

function SalaryView({ data, onUpdateSettings }) {
  const settings = data.settings || {};
  const grossSalary = parseFloat(settings.grossSalary) || 0;
  const consignado = parseFloat(settings.consignado) || 0;

  const { total: inss, faixas } = useMemo(() => calcularINSS(grossSalary), [grossSalary]);
  const totalDescontos = inss + consignado;
  const liquido = grossSalary - totalDescontos;

  return (
    <div className="px-5 md:px-8 pt-3 md:pt-8 pb-6">
      <h2 className="fin-mono text-[13px] uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Calculadora de salário</h2>
      <p className="text-[12px] mb-4" style={{ color: "var(--muted)" }}>
        Desconto de INSS calculado pela tabela oficial de 2026 (progressiva, por faixas).
      </p>

      <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 md:items-start">
        <div className="rounded-2xl px-4 py-4 mb-4 md:mb-0" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <FieldLabel>Salário bruto (R$)</FieldLabel>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={settings.grossSalary || ""}
            onChange={(e) => onUpdateSettings({ grossSalary: e.target.value })}
          />

          <FieldLabel>Valor do consignado (R$)</FieldLabel>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={settings.consignado || ""}
            onChange={(e) => onUpdateSettings({ consignado: e.target.value })}
          />

          <div className="fin-tear my-4" style={{ background: "var(--line)" }} />

          <div className="flex items-center justify-between mb-1.5">
            <span className="fin-mono text-[11px]" style={{ color: "var(--muted)" }}>Desconto INSS</span>
            <span className="fin-mono text-[13px] font-semibold" style={{ color: "var(--expense)" }}>{fmt(inss)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="fin-mono text-[11px]" style={{ color: "var(--muted)" }}>Consignado</span>
            <span className="fin-mono text-[13px] font-semibold" style={{ color: "var(--expense)" }}>{fmt(consignado)}</span>
          </div>
          <div className="flex items-center justify-between pt-3 mb-3" style={{ borderTop: "1px dashed var(--line)" }}>
            <span className="fin-mono text-[11.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Total de descontos</span>
            <span className="fin-mono text-[15px] font-semibold" style={{ color: "var(--expense)" }}>{fmt(totalDescontos)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="fin-mono text-[12px] uppercase tracking-wider">Salário líquido</span>
            <span className="fin-mono text-[18px] font-semibold" style={{ color: liquido >= 0 ? "var(--income)" : "var(--expense)" }}>{fmt(liquido)}</span>
          </div>
        </div>

        <div>
          <div className="fin-mono text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Como o INSS foi calculado</div>
          {grossSalary <= 0 ? (
            <EmptyState text="Informe o salário bruto para ver o cálculo detalhado por faixa." />
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              {faixas.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: "var(--card)", borderBottom: i < faixas.length - 1 ? "1px dashed var(--line)" : "none" }}
                >
                  <div>
                    <div className="text-[12.5px]" style={{ fontWeight: 500 }}>{fmt(f.de)} → {fmt(f.ate)}</div>
                    <div className="fin-mono text-[10.5px]" style={{ color: "var(--muted)" }}>Alíquota de {(f.aliquota * 100).toFixed(1).replace(".", ",")}%</div>
                  </div>
                  <div className="fin-mono text-[13px] font-semibold" style={{ color: "var(--expense)" }}>{fmt(f.valor)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--paper)" }}>
                <span className="fin-mono text-[11.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Total INSS</span>
                <span className="fin-mono text-[14px] font-semibold" style={{ color: "var(--expense)" }}>{fmt(inss)}</span>
              </div>
            </div>
          )}

          <p className="text-[11px] mt-4" style={{ color: "var(--muted)" }}>
            Teto de contribuição do INSS em 2026: {fmt(8475.55)} (desconto máximo de {fmt(988.09)}). Este cálculo não inclui o Imposto de Renda (IRRF), que segue regras adicionais e pode variar conforme dependentes e outras deduções.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Novidades (changelog)                                                  */
/* ---------------------------------------------------------------------- */

function ChangelogSheet({ onClose }) {
  return (
    <Sheet title="Novidades" onClose={onClose}>
      {CHANGELOG.map((entry, i) => (
        <div key={entry.version} className="mb-5 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: i === 0 ? "var(--gold)" : "var(--paper)" }}>
              <Sparkles size={13} color={i === 0 ? "#fff" : "var(--muted)"} />
            </div>
            <div>
              <div className="text-[13.5px]" style={{ fontWeight: 600 }}>{entry.title}</div>
              <div className="fin-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                {i === 0 ? "Mais recente" : `Atualização ${entry.version}`}
              </div>
            </div>
          </div>
          <ul className="pl-9" style={{ listStyle: "none" }}>
            {entry.items.map((item, j) => (
              <li key={j} className="text-[12.5px] mb-1 flex gap-2" style={{ color: "var(--muted)" }}>
                <span style={{ color: "var(--income)" }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {i < CHANGELOG.length - 1 && <div className="fin-dash mt-4" />}
        </div>
      ))}
    </Sheet>
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
  const [repeatMode, setRepeatMode] = useState("none"); // 'none' | 'installment' | 'fixed'
  const [repeatCount, setRepeatCount] = useState("2");

  const cats = data.categories.filter((c) => c.type === type);
  useEffect(() => { if (cats.length && !cats.find(c => c.id === categoryId)) setCategoryId(cats[0].id); }, [type]);

  const canSave = amount && parseFloat(amount) > 0 && categoryId && accountId && date &&
    (repeatMode === "none" || (parseInt(repeatCount, 10) >= 2 && parseInt(repeatCount, 10) <= 60));

  const handleSave = () => {
    const baseAmount = parseFloat(amount);
    const n = repeatMode === "none" ? 1 : Math.max(2, Math.min(60, parseInt(repeatCount, 10) || 2));
    const txns = [];

    if (n === 1) {
      txns.push({ type, amount: baseAmount, categoryId, accountId, date, description });
    } else {
      const perInstallment = repeatMode === "installment" ? Math.round((baseAmount / n) * 100) / 100 : baseAmount;
      for (let i = 0; i < n; i++) {
        let amt = perInstallment;
        if (repeatMode === "installment" && i === n - 1) {
          // ajusta a última parcela para compensar arredondamento
          amt = Math.round((baseAmount - perInstallment * (n - 1)) * 100) / 100;
        }
        const desc = repeatMode === "installment"
          ? `${description ? description + " " : ""}(${i + 1}/${n})`
          : description;
        txns.push({ type, amount: amt, categoryId, accountId, date: addMonthsClamped(date, i), description: desc });
      }
    }
    onSave(txns);
  };

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

      <FieldLabel>{repeatMode === "installment" ? "Valor total da compra (R$)" : "Valor (R$)"}</FieldLabel>
      <TextInput type="number" step="0.01" min="0" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <FieldLabel>Categoria</FieldLabel>
      <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectInput>

      <FieldLabel>Conta</FieldLabel>
      <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </SelectInput>

      <FieldLabel>Data {repeatMode !== "none" ? "(1º lançamento)" : ""}</FieldLabel>
      <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <FieldLabel>Descrição (opcional)</FieldLabel>
      <TextInput type="text" placeholder="Ex: Almoço, Uber…" value={description} onChange={(e) => setDescription(e.target.value)} />

      <FieldLabel>Repetição</FieldLabel>
      <div className="flex rounded-xl overflow-hidden mb-2" style={{ border: "1px solid var(--line)" }}>
        {[
          { id: "none", label: "Única" },
          { id: "installment", label: "Parcelado" },
          { id: "fixed", label: "Fixo mensal" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setRepeatMode(opt.id)}
            className="fin-mono flex-1 py-2 text-[11.5px]"
            style={{
              background: repeatMode === opt.id ? "var(--ink)" : "var(--paper)",
              color: repeatMode === opt.id ? "var(--card)" : "var(--ink)",
            }}
          >{opt.label}</button>
        ))}
      </div>

      {repeatMode !== "none" && (
        <>
          <TextInput
            type="number"
            min="2"
            max="60"
            step="1"
            placeholder="Quantidade de meses"
            value={repeatCount}
            onChange={(e) => setRepeatCount(e.target.value)}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
            {repeatMode === "installment"
              ? `O valor total será dividido em ${repeatCount || "N"} parcelas, uma por mês.`
              : `O mesmo valor será lançado todo mês, por ${repeatCount || "N"} meses.`}
          </p>
        </>
      )}

      <button
        disabled={!canSave}
        onClick={handleSave}
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
