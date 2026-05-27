import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Target,
  Plus,
  Trash2
} from "lucide-react";

const STORAGE_KEY = "financeiro_pessoal";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);

  const [form, setForm] = useState({
    type: "Despesa",
    category: "Alimentação",
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
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        transactions,
        goals
      })
    );
  }, [transactions, goals]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "Receita")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = transactions
      .filter((item) => item.type === "Despesa")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  function addTransaction() {
    if (!form.description || !form.amount) return;

    setTransactions([
      {
        id: crypto.randomUUID(),
        ...form
      },
      ...transactions
    ]);

    setForm({
      type: "Despesa",
      category: "Alimentação",
      description: "",
      amount: ""
    });
  }

  function addGoal() {
    if (!goalForm.name || !goalForm.target) return;

    setGoals([
      {
        id: crypto.randomUUID(),
        ...goalForm
      },
      ...goals
    ]);

    setGoalForm({
      name: "",
      target: "",
      current: ""
    });
  }

  function addMoneyToGoal(id, value) {
    if (!value) return;

    setGoals(
      goals.map((goal) => {
        if (goal.id === id) {
          return {
            ...goal,
            current:
              Number(goal.current) +
              Number(value)
          };
        }

        return goal;
      })
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Financeiro Pessoal</h1>
        <p>Seu sistema financeiro privado</p>
      </header>

      <section className="cards">
        <Card
          icon={<Wallet size={22} />}
          title="Receitas"
          value={money(totals.income)}
        />

        <Card
          icon={<TrendingUp size={22} />}
          title="Despesas"
          value={money(totals.expense)}
        />

        <Card
          icon={<Target size={22} />}
          title="Saldo"
          value={money(totals.balance)}
        />
      </section>

      <section className="panel">
        <h2>Novo lançamento</h2>

        <div className="form">
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
                category: e.target.value
              })
            }
          >
            <option>Alimentação</option>
            <option>Mercado</option>
            <option>Combustível</option>
            <option>Pedágio</option>
            <option>Roupa</option>
            <option>Saúde</option>
            <option>Academia</option>
            <option>Lazer</option>
            <option>Viagem</option>
            <option>Assinaturas</option>
            <option>Moradia</option>
            <option>Outros</option>
          </select>

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
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

          <button onClick={addTransaction}>
            <Plus size={18} />
            Adicionar
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Metas</h2>

        <div className="form">
          <input
            placeholder="Nome da meta"
            value={goalForm.name}
            onChange={(e) =>
              setGoalForm({
                ...goalForm,
                name: e.target.value
              })
            }
          />

          <input
            type="number"
            placeholder="Meta"
            value={goalForm.target}
            onChange={(e) =>
              setGoalForm({
                ...goalForm,
                target: e.target.value
              })
            }
          />

          <input
            type="number"
            placeholder="Valor inicial"
            value={goalForm.current}
            onChange={(e) =>
              setGoalForm({
                ...goalForm,
                current: e.target.value
              })
            }
          />

          <button onClick={addGoal}>
            <Plus size={18} />
            Salvar
          </button>
        </div>

        <div className="goals">
          {goals.map((goal) => {
            const percent =
              (Number(goal.current) /
                Number(goal.target)) *
              100;

            return (
              <div
                className="goal"
                key={goal.id}
              >
                <div className="goal-top">
                  <div>
                    <h3>{goal.name}</h3>

                    <p>
                      {money(goal.current)} /{" "}
                      {money(goal.target)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setGoals(
                        goals.filter(
                          (x) => x.id !== goal.id
                        )
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${percent}%`
                    }}
                  />
                </div>

                <div className="goal-add">
                  <input
                    type="number"
                    placeholder="Adicionar valor"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addMoneyToGoal(
                          goal.id,
                          e.target.value
                        );

                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Lançamentos</h2>

        <div className="transactions">
          {transactions.map((item) => (
            <div
              className="transaction"
              key={item.id}
            >
              <div>
                <strong>
                  {item.description}
                </strong>

                <p>
                  {item.category} •{" "}
                  {item.type}
                </p>
              </div>

              <div className="transaction-right">
                <strong>
                  {money(item.amount)}
                </strong>

                <button
                  onClick={() =>
                    setTransactions(
                      transactions.filter(
                        (x) => x.id !== item.id
                      )
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
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

        .header p {
          color: #71717a;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(240px,1fr));
          gap: 16px;
          margin-top: 30px;
        }

        .card {
          border: 1px solid #e4e4e7;
          border-radius: 24px;
          padding: 20px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .panel {
          border: 1px solid #e4e4e7;
          border-radius: 24px;
          padding: 20px;
          margin-top: 20px;
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

        .transactions {
          display: grid;
          gap: 12px;
        }

        .transaction {
          border: 1px solid #e4e4e7;
          border-radius: 18px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .goals {
          margin-top: 20px;
          display: grid;
          gap: 16px;
        }

        .goal {
          border: 1px solid #e4e4e7;
          border-radius: 20px;
          padding: 16px;
        }

        .goal-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .goal-add {
          margin-top: 14px;
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
