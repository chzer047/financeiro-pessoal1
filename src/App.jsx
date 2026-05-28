import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  CreditCard,
  Filter,
  AlertTriangle
} from "lucide-react";

const STORAGE_KEY = "financeiro_pessoal_v2";

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

const currentMonth = new Date().toISOString().slice(0, 7);

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [cardLimit, setCardLimit] = useState(800);

  const [filters, setFilters] = useState({
    type: "Todos",
    category: "Todas",
    paymentMethod: "Todos"
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setTransactions(data.transactions || []);
      setGoals(data.goals || []);
      setCardLimit(data.cardLimit || 800);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ transactions, goals, cardLimit })
    );
  }, [transactions, goals, cardLimit]);

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
          item.paymentMethod === "Cartão de Crédito" &&
          item.type === "Despesa"
      )
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
      creditCard
    };
  }, [monthTransactions]);

  const cardPercent = cardLimit > 0 ? Math.round((totals.creditCard / cardLimit) * 100) : 0;

  const filteredTransactions = transactions.filter((item) => {
    const typeOk = filters.type === "Todos" || item.type === filters.type;
    const categoryOk = filters.category === "Todas" || item.category === filters.category;
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
      date: new Date().toISOString().slice(0, 10),
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

  return (
    <div className="app">
      <header className="header">
        <h1>Financeiro Pessoal</h1>
        <p>Controle real da sua vida financeira</p>
      </header>

      <section className="cards">
        <Card icon={<Wallet />} title="Receitas do mês" value={money(totals.income)} />
        <Card icon={<TrendingUp />} title="Despesas do mês" value={money(totals.expense)} />
        <Card icon={<Target />} title="Saldo do mês" value={money(totals.balance)} />
        <Card icon={<CreditCard />} title="Cartão no mês" value={money(totals.creditCard)} />
      </section>

      <section className="panel">
        <h2>Limite psicológico do cartão</h2>

        <input
          type="number"
          value={cardLimit}
          onChange={(e) => setCardLimit(Number(e.target.value))}
          placeholder="Ex: 800"
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
            style={{ width: `${Math.min(cardPercent, 100)}%` }}
          />
        </div>

        <p className="muted">
          Usado: {money(totals.creditCard)} de {money(cardLimit)} — {cardPercent}%
        </p>

        {cardPercent >= 70 && (
          <div className="alert">
            <AlertTriangle size={18} />
            Atenção: seu cartão já passou de 70% do limite psicológico.
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Novo lançamento</h2>

        <div className="form">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>Despesa</option>
            <option>Receita</option>
          </select>

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.target.value })
            }
          >
            {paymentMethods.map((pay) => (
              <option key={pay}>{pay}</option>
            ))}
          </select>

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="number"
            placeholder="Valor"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <button onClick={addTransaction}>
            <Plus size={18} />
            Adicionar
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Gastos por categoria no mês</h2>

        <div className="category-list">
          {categoryTotals.map((item) => (
            <div className="category-item" key={item.category}>
              <span>{item.category}</span>
              <strong>{money(item.total)}</strong>
            </div>
          ))}

          {categoryTotals.length === 0 && (
            <p className="muted">Nenhum gasto registrado neste mês.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Metas</h2>

        <div className="form">
          <input
            placeholder="Nome da meta"
            value={goalForm.name}
            onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
          />

          <input
            type="number"
            placeholder="Valor da meta"
            value={goalForm.target}
            onChange={(e) =>
              setGoalForm({ ...goalForm, target: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Valor inicial"
            value={goalForm.current}
            onChange={(e) =>
              setGoalForm({ ...goalForm, current: e.target.value })
            }
          />

          <button onClick={addGoal}>
            <Plus size={18} />
            Salvar meta
          </button>
        </div>

        <div className="goals">
          {goals.map((goal) => {
            const percent =
              goal.target > 0
                ? Math.min(100, Math.round((goal.current / goal.target) * 100))
                : 0;

            return (
              <div className="goal" key={goal.id}>
                <div className="goal-top">
                  <div>
                    <h3>{goal.name}</h3>
                    <p>
                      {money(goal.current)} / {money(goal.target)} — {percent}%
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setGoals(goals.filter((x) => x.id !== goal.id))
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="progress">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>

                <div className="goal-add">
                  <input
                    type="number"
                    placeholder="Adicionar valor"
                    value={goal.addValue || ""}
                    onChange={(e) => updateGoalAddValue(goal.id, e.target.value)}
                  />

                  <button onClick={() => addMoneyToGoal(goal.id)}>
                    Adicionar na meta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>
          <Filter size={18} /> Filtros
        </h2>

        <div className="form">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option>Todos</option>
            <option>Despesa</option>
            <option>Receita</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option>Todas</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) =>
              setFilters({ ...filters, paymentMethod: e.target.value })
            }
          >
            <option>Todos</option>
            {paymentMethods.map((pay) => (
              <option key={pay}>{pay}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel">
        <h2>Lançamentos</h2>

        <div className="transactions">
          {filteredTransactions.map((item) => (
            <div className="transaction" key={item.id}>
              <div>
                <strong>{item.description}</strong>
                <p>
                  {item.date} • {item.category} • {item.type} •{" "}
                  {item.paymentMethod}
                </p>
              </div>

              <div className="transaction-right">
                <strong>{money(item.amount)}</strong>

                <button
                  onClick={() =>
                    setTransactions(
                      transactions.filter((x) => x.id !== item.id)
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <p className="muted">Nenhum lançamento encontrado.</p>
          )}
        </div>
      </section>

      <style>{`
        .app {
          max-width: 1200px;
          margin: auto;
          padding: 24px;
        }

        .header h1 {
          margin: 0;
          font-size: 40px;
        }

        .header p,
        .muted {
          color: #71717a;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap: 16px;
          margin-top: 30px;
        }

        .card,
        .panel,
        .goal,
        .transaction,
        .category-item {
          border: 1px solid #e4e4e7;
          border-radius: 24px;
          padding: 20px;
        }

        .card-top,
        .goal-top,
        .transaction,
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
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
          border: 1px solid #e4e4e7;
          border-radius: 16px;
          padding: 14px;
          font-size: 16px;
        }

        button {
          border: none;
          border-radius: 16px;
          padding: 14px;
          background: #09090b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .progress {
          height: 12px;
          background: #f4f4f5;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 14px;
        }

        .progress-fill {
          height: 100%;
          background: #09090b;
        }

        .progress-fill.warning {
          background: #a16207;
        }

        .progress-fill.danger {
          background: #991b1b;
        }

        .alert {
          margin-top: 14px;
          border: 1px solid #e4e4e7;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .transactions,
        .goals,
        .category-list {
          display: grid;
          gap: 12px;
        }

        .transaction p {
          color: #71717a;
          margin: 4px 0 0;
        }

        .transaction-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .goal-add {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }
      `}</style>
    </div>
  );
}

function Card({ icon, title, value }) {
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
