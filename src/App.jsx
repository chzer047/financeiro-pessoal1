import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  CreditCard,
  Filter,
  AlertTriangle,
  Trophy,
  CalendarDays
} from "lucide-react";

const STORAGE_KEY = "financeiro_pessoal_brasil_2026";

const categories = [
  "Alimentação",
  "Mercado",
  "Combustível",
  "Pedágio",
  "Saída",
  "Roupa",
  "Saúde",
  "Academia",
  "Lazer",
  "Viagem",
  "Assinaturas",
  "Moradia",
  "Outros"
];

const paymentMethods = [
  "Cartão de Crédito",
  "Pix",
  "Dinheiro",
  "Cartão de Débito"
];

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));

const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [cardLimit, setCardLimit] = useState(800);

  const [filters, setFilters] = useState({
    type: "Todos",
    category: "Todas",
    paymentMethod: "Todos"
  });

  const [form, setForm] = useState({
    date: today,
    type: "Despesa",
    category: "Alimentação",
    paymentMethod: "Cartão de Crédito",
    description: "",
    amount: ""
  });

  const [goalForm, setGoalForm] = useState({
    name: "",
    target: "",
    current: ""
  });

  const [fixedForm, setFixedForm] = useState({
    name: "",
    amount: "",
    dueDay: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);
      setTransactions(data.transactions || []);
      setGoals(data.goals || []);
      setFixedExpenses(data.fixedExpenses || []);
      setCardLimit(data.cardLimit || 800);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        transactions,
        goals,
        fixedExpenses,
        cardLimit
      })
    );
  }, [transactions, goals, fixedExpenses, cardLimit]);

  const monthTransactions = transactions.filter((item) =>
    item.date?.startsWith(currentMonth)
  );

  const totals = useMemo(() => {
    const income = monthTransactions
      .filter((item) => item.type === "Receita")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = monthTransactions
      .filter((item) => item.type === "Despesa")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const creditCard = monthTransactions
      .filter(
        (item) =>
          item.type === "Despesa" &&
          item.paymentMethod === "Cartão de Crédito"
      )
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const fixed = fixedExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    return {
      income,
      expense,
      creditCard,
      fixed,
      balance: income - expense,
      realBalance: income - expense - fixed
    };
  }, [monthTransactions, fixedExpenses]);

  const cardPercent =
    cardLimit > 0 ? Math.round((totals.creditCard / cardLimit) * 100) : 0;

  const filteredTransactions = transactions.filter((item) => {
    const typeOk = filters.type === "Todos" || item.type === filters.type;
    const categoryOk =
      filters.category === "Todas" || item.category === filters.category;
    const paymentOk =
      filters.paymentMethod === "Todos" ||
      item.paymentMethod === filters.paymentMethod;

    return typeOk && categoryOk && paymentOk;
  });

  const categoryTotals = categories
    .map((cat) => {
      const total = monthTransactions
        .filter((item) => item.category === cat && item.type === "Despesa")
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return { category: cat, total };
    })
    .filter((item) => item.total > 0);

  function addTransaction() {
    if (!form.description || !form.amount) return;

    setTransactions([
      {
        id: crypto.randomUUID(),
        ...form,
        amount: Number(form.amount)
      },
      ...transactions
    ]);

    setForm({
      date: today,
      type: "Despesa",
      category: "Alimentação",
      paymentMethod: "Cartão de Crédito",
      description: "",
      amount: ""
    });
  }

  function addGoal() {
    if (!goalForm.name || !goalForm.target) return;

    setGoals([
      {
        id: crypto.randomUUID(),
        name: goalForm.name,
        target: Number(goalForm.target),
        current: Number(goalForm.current || 0),
        addValue: ""
      },
      ...goals
    ]);

    setGoalForm({
      name: "",
      target: "",
      current: ""
    });
  }

  function addMoneyToGoal(id) {
    setGoals(
      goals.map((goal) => {
        if (goal.id === id) {
          return {
            ...goal,
            current: Number(goal.current) + Number(goal.addValue || 0),
            addValue: ""
          };
        }

        return goal;
      })
    );
  }

  function updateGoalAddValue(id, value) {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, addValue: value } : goal
      )
    );
  }

  function addFixedExpense() {
    if (!fixedForm.name || !fixedForm.amount) return;

    setFixedExpenses([
      {
        id: crypto.randomUUID(),
        name: fixedForm.name,
        amount: Number(fixedForm.amount),
        dueDay: fixedForm.dueDay || "Mensal"
      },
      ...fixedExpenses
    ]);

    setFixedForm({
      name: "",
      amount: "",
      dueDay: ""
    });
  }  
  
  return (
    <div className="app">
      <div className="bg-effects" />

      <header className="header">
        <div>
          <p className="worldcup">
            🇧🇷 Brasil rumo a 2026
          </p>

          <h1>Financeiro Pessoal</h1>

          <p className="subtitle">
            Controle sua vida financeira
            como um painel operacional.
          </p>
        </div>
      </header>

      <section className="cards">
        <Card
          icon={<Wallet />}
          title="Receitas"
          value={money(totals.income)}
        />

        <Card
          icon={<TrendingUp />}
          title="Despesas"
          value={money(totals.expense)}
        />

        <Card
          icon={<Target />}
          title="Saldo"
          value={money(totals.balance)}
        />

        <Card
          icon={<CreditCard />}
          title="Cartão"
          value={money(totals.creditCard)}
        />

        <Card
          icon={<CalendarDays />}
          title="Fixos"
          value={money(totals.fixed)}
        />

        <Card
          icon={<Trophy />}
          title="Sobra Real"
          value={money(totals.realBalance)}
        />
      </section>

      <section className="panel">
        <h2>
          <CreditCard size={18} />
          Limite psicológico do cartão
        </h2>

        <input
          type="number"
          value={cardLimit}
          onChange={(e) =>
            setCardLimit(
              Number(e.target.value)
            )
          }
        />

        <div className="progress">
          <div
            className={
              cardPercent >= 100
                ? "progress-fill danger"
                : cardPercent >= 70
                ? "progress-fill warning"
                : "progress-fill"
            }
            style={{
              width: `${Math.min(
                cardPercent,
                100
              )}%`
            }}
          />
        </div>

        <p className="muted">
          {money(
            totals.creditCard
          )} de{" "}
          {money(cardLimit)} •{" "}
          {cardPercent}%
        </p>

        {cardPercent >= 70 && (
          <div className="alert">
            <AlertTriangle size={18} />
            Você já passou de 70%
            do seu limite
            psicológico.
          </div>
        )}
      </section>

      <section className="panel">
        <h2>
          <Plus size={18} />
          Novo lançamento
        </h2>

        <div className="form">
          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value
              })
            }
          />

          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value
              })
            }
          >
            <option>Despesa</option>
            <option>Receita</option>
          </select>

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target.value
              })
            }
          >
            {categories.map((cat) => (
              <option key={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({
                ...form,
                paymentMethod:
                  e.target.value
              })
            }
          >
            {paymentMethods.map(
              (pay) => (
                <option key={pay}>
                  {pay}
                </option>
              )
            )}
          </select>

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value
              })
            }
          />

          <input
            type="number"
            placeholder="Valor"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value
              })
            }
          />

          <button
            onClick={addTransaction}
          >
            <Plus size={18} />
            Adicionar
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>
          <CalendarDays size={18} />
          Gastos Fixos
        </h2>

        <div className="form">
          <input
            placeholder="Nome"
            value={fixedForm.name}
            onChange={(e) =>
              setFixedForm({
                ...fixedForm,
                name: e.target.value
              })
            }
          />

          <input
            type="number"
            placeholder="Valor"
            value={fixedForm.amount}
            onChange={(e) =>
              setFixedForm({
                ...fixedForm,
                amount:
                  e.target.value
              })
            }
          />

          <input
            placeholder="Dia"
            value={fixedForm.dueDay}
            onChange={(e) =>
              setFixedForm({
                ...fixedForm,
                dueDay:
                  e.target.value
              })
            }
          />

          <button
            onClick={addFixedExpense}
          >
            Adicionar fixo
          </button>
        </div>

        <div className="transactions">
          {fixedExpenses.map(
            (item) => (
              <div
                className="transaction"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <p>
                    Vence:{" "}
                    {item.dueDay}
                  </p>
                </div>

                <div className="transaction-right">
                  <strong>
                    {money(
                      item.amount
                    )}
                  </strong>

                  <button
                    onClick={() =>
                      setFixedExpenses(
                        fixedExpenses.filter(
                          (x) =>
                            x.id !==
                            item.id
                        )
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <style>{`
        body {
          background:
            linear-gradient(
              135deg,
              #052e16,
              #14532d,
              #854d0e
            );

          min-height: 100vh;
        }

        .app {
          max-width: 1300px;
          margin: auto;
          padding: 24px;
          color: white;
        }

        .header h1 {
          margin: 0;
          font-size: 48px;
        }

        .subtitle {
          color: #d4d4d8;
        }

        .worldcup {
          color: #fde047;
          font-weight: bold;
        }

        .cards {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(220px, 1fr)
            );

          gap: 16px;
          margin-top: 30px;
        }

        .card,
        .panel,
        .transaction {
          background:
            rgba(255,255,255,0.08);

          backdrop-filter:
            blur(12px);

          border:
            1px solid
            rgba(255,255,255,0.1);

          border-radius: 24px;
          padding: 20px;
        }

        .card-top,
        .transaction {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
        }

        .panel {
          margin-top: 20px;
        }

        .panel h2 {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form {
          display: grid;
          gap: 12px;
        }

        input,
        select {
          border: none;
          border-radius: 16px;
          padding: 14px;
          background:
            rgba(255,255,255,0.1);

          color: white;
        }

        input::placeholder {
          color: #d4d4d8;
        }

        button {
          border: none;
          border-radius: 16px;
          padding: 14px;
          background:
            linear-gradient(
              90deg,
              #16a34a,
              #ca8a04
            );

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .progress {
          height: 12px;
          background:
            rgba(255,255,255,0.1);

          border-radius: 999px;
          overflow: hidden;
          margin-top: 14px;
        }

        .progress-fill {
          height: 100%;
          background:
            linear-gradient(
              90deg,
              #22c55e,
              #fde047
            );
        }

        .progress-fill.warning {
          background:
            #facc15;
        }

        .progress-fill.danger {
          background:
            #dc2626;
        }

        .alert {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          background:
            rgba(220,38,38,0.2);

          display: flex;
          align-items: center;
          gap: 8px;
        }

        .transactions {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .transaction p,
        .muted {
          color: #d4d4d8;
        }

        .transaction-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

function Card({
  icon,
  title,
  value
}) {
  return (
    <div className="card">
      <div className="card-top">
        <span>{title}</span>

        {icon}
      </div>

      <h2>{value}</h2>
    </div>
  );
}
