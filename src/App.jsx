import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  CreditCard,
  AlertTriangle,
  Trophy,
  CalendarDays,
  Brain,
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  X
} from "lucide-react";

const STORAGE_KEY = "financeiro_pessoal_mentor_v2";

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
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    date: today,
    type: "Despesa",
    category: "Alimentação",
    paymentMethod: "Cartão de Crédito",
    description: "",
    amount: "",
    installments: "1"
  };

  const [form, setForm] = useState(emptyForm);

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
    const oldSaved = localStorage.getItem("financeiro_pessoal_mentor_v1");
    const saved = localStorage.getItem(STORAGE_KEY) || oldSaved;

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
      JSON.stringify({ transactions, goals, fixedExpenses, cardLimit })
    );
  }, [transactions, goals, fixedExpenses, cardLimit]);

  const monthTransactions = transactions.filter((item) =>
    item.date?.startsWith(currentMonth)
  );

  const incomes = monthTransactions.filter((item) => item.type === "Receita");
  const expenses = monthTransactions.filter((item) => item.type === "Despesa");

  const totals = useMemo(() => {
    const income = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    const creditCard = expenses
      .filter((item) => item.paymentMethod === "Cartão de Crédito")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const fixed = fixedExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    const futureInstallments = transactions
      .filter(
        (item) =>
          item.paymentMethod === "Cartão de Crédito" &&
          Number(item.installments || 1) > 1
      )
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expense,
      creditCard,
      fixed,
      futureInstallments,
      balance: income - expense,
      realBalance: income - expense - fixed
    };
  }, [incomes, expenses, fixedExpenses, transactions]);

  const cardPercent =
    cardLimit > 0 ? Math.round((totals.creditCard / cardLimit) * 100) : 0;

  const categoryTotals = categories
    .map((cat) => {
      const total = expenses
        .filter((item) => item.category === cat)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return { category: cat, total };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const biggestCategory = categoryTotals[0];

  const mentorMessages = useMemo(() => {
    const messages = [];

    if (totals.income === 0) {
      messages.push({
        level: "atenção",
        text: "Você ainda não lançou nenhuma receita neste mês. Sem isso, o app não consegue calcular sua sobra real com precisão."
      });
    }

    if (totals.realBalance < 0) {
      messages.push({
        level: "crítico",
        text: `Sua sobra real está negativa em ${money(
          Math.abs(totals.realBalance)
        )}. Antes de gastar com lazer ou compras, o foco precisa ser segurar variáveis e proteger o básico.`
      });
    }

    if (cardPercent >= 100) {
      messages.push({
        level: "crítico",
        text: `Seu cartão passou do limite psicológico definido. Você usou ${money(
          totals.creditCard
        )} de ${money(
          cardLimit
        )}. Até virar o mês, evite crédito e use apenas dinheiro/Pix para o essencial.`
      });
    } else if (cardPercent >= 70) {
      messages.push({
        level: "atenção",
        text: `Seu cartão já bateu ${cardPercent}% do limite psicológico. Esse é o ponto onde você costuma perder controle. Segura novas compras no crédito.`
      });
    }

    if (totals.futureInstallments > 0) {
      messages.push({
        level: "atenção",
        text: `Você tem ${money(
          totals.futureInstallments
        )} registrados em compras parceladas no cartão. Isso não é dívida do mês: é compromisso futuro.`
      });
    }

    if (totals.income > 0 && totals.fixed / totals.income > 0.6) {
      messages.push({
        level: "atenção",
        text: `Seus gastos fixos comprometem ${Math.round(
          (totals.fixed / totals.income) * 100
        )}% da sua renda do mês. Isso deixa pouca margem para imprevistos.`
      });
    }

    if (biggestCategory && biggestCategory.total > 0) {
      messages.push({
        level: "ideia",
        text: `Seu maior vazamento do mês está em ${
          biggestCategory.category
        }: ${money(biggestCategory.total)}. Se reduzir 20% nessa categoria, você libera ${money(
          biggestCategory.total * 0.2
        )}.`
      });
    }

    const stoppedGoal = goals.find((goal) => Number(goal.current) === 0);
    if (stoppedGoal && totals.realBalance > 0) {
      messages.push({
        level: "ideia",
        text: `A meta "${stoppedGoal.name}" ainda está parada. Como sua sobra real está positiva, você poderia aportar uma pequena parte nela para criar ritmo.`
      });
    }

    if (totals.realBalance > 0 && totals.income > 0) {
      messages.push({
        level: "positivo",
        text: `Você tem sobra real positiva de ${money(
          totals.realBalance
        )}. Uma divisão segura seria: 50% reserva/dívida, 30% metas e 20% livre.`
      });
    }

    if (messages.length === 0) {
      messages.push({
        level: "ok",
        text: "Seu mês está equilibrado até agora. Continue lançando tudo para o mentor conseguir te orientar melhor."
      });
    }

    return messages;
  }, [totals, cardLimit, cardPercent, biggestCategory, goals]);

  function saveTransaction() {
    if (!form.description || !form.amount) return;

    const normalized = {
      ...form,
      amount: Number(form.amount),
      installments:
        form.paymentMethod === "Cartão de Crédito"
          ? Number(form.installments || 1)
          : 1
    };

    if (editingId) {
      setTransactions(
        transactions.map((item) =>
          item.id === editingId ? { ...item, ...normalized } : item
        )
      );
      setEditingId(null);
    } else {
      setTransactions([
        {
          id: crypto.randomUUID(),
          ...normalized
        },
        ...transactions
      ]);
    }

    setForm(emptyForm);
  }

  function editTransaction(item) {
    setEditingId(item.id);
    setForm({
      date: item.date || today,
      type: item.type || "Despesa",
      category: item.category || "Alimentação",
      paymentMethod: item.paymentMethod || "Cartão de Crédito",
      description: item.description || "",
      amount: String(item.amount || ""),
      installments: String(item.installments || 1)
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function deleteTransaction(id) {
    setTransactions(transactions.filter((item) => item.id !== id));
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

    setGoalForm({ name: "", target: "", current: "" });
  }

  function addMoneyToGoal(id) {
    setGoals(
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              current: Number(goal.current) + Number(goal.addValue || 0),
              addValue: ""
            }
          : goal
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

    setFixedForm({ name: "", amount: "", dueDay: "" });
  }

  return (
    <div className="app">
      <header className="header">
        <p className="worldcup">🇧🇷 Brasil rumo a 2026</p>
        <h1>Financeiro Pessoal</h1>
        <p className="subtitle">
          Controle real, mentor financeiro, histórico, cartão e parcelas futuras.
        </p>
      </header>

      <section className="cards">
        <Card icon={<Wallet />} title="Receitas" value={money(totals.income)} />
        <Card icon={<TrendingUp />} title="Despesas" value={money(totals.expense)} />
        <Card icon={<Target />} title="Saldo" value={money(totals.balance)} />
        <Card icon={<CreditCard />} title="Cartão" value={money(totals.creditCard)} />
        <Card icon={<CalendarDays />} title="Fixos" value={money(totals.fixed)} />
        <Card icon={<Trophy />} title="Sobra Real" value={money(totals.realBalance)} />
      </section>

      <section className="panel mentor">
        <h2>
          <Brain size={18} /> Mentor Financeiro
        </h2>
        <div className="mentor-list">
          {mentorMessages.map((msg, index) => (
            <div className={`mentor-msg ${msg.level}`} key={index}>
              <strong>{msg.level.toUpperCase()}</strong>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>
          <CreditCard size={18} /> Limite psicológico do cartão
        </h2>
        <input
          type="number"
          value={cardLimit}
          onChange={(e) => setCardLimit(Number(e.target.value))}
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
          {money(totals.creditCard)} de {money(cardLimit)} • {cardPercent}%
        </p>
        {cardPercent >= 70 && (
          <div className="alert">
            <AlertTriangle size={18} />
            Atenção: cartão em zona de risco.
          </div>
        )}
      </section>

      <section className="panel">
        <h2>
          {editingId ? <Pencil size={18} /> : <Plus size={18} />}
          {editingId ? "Editar lançamento" : "Novo lançamento"}
        </h2>
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

          {form.paymentMethod === "Cartão de Crédito" && (
            <input
              type="number"
              min="1"
              placeholder="Quantidade de parcelas"
              value={form.installments}
              onChange={(e) =>
                setForm({ ...form, installments: e.target.value })
              }
            />
          )}

          <button onClick={saveTransaction}>
            {editingId ? "Salvar alteração" : "Adicionar"}
          </button>

          {editingId && (
            <button className="secondary" onClick={cancelEdit}>
              <X size={18} />
              Cancelar edição
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>
          <CalendarDays size={18} /> Gastos Fixos
        </h2>
        <div className="form">
          <input
            placeholder="Nome do gasto fixo"
            value={fixedForm.name}
            onChange={(e) =>
              setFixedForm({ ...fixedForm, name: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Valor"
            value={fixedForm.amount}
            onChange={(e) =>
              setFixedForm({ ...fixedForm, amount: e.target.value })
            }
          />
          <input
            placeholder="Dia de vencimento"
            value={fixedForm.dueDay}
            onChange={(e) =>
              setFixedForm({ ...fixedForm, dueDay: e.target.value })
            }
          />
          <button onClick={addFixedExpense}>Adicionar fixo</button>
        </div>

        <div className="transactions">
          {fixedExpenses.map((item) => (
            <div className="transaction" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>Vence: {item.dueDay}</p>
              </div>
              <div className="transaction-right">
                <strong>{money(item.amount)}</strong>
                <button
                  onClick={() =>
                    setFixedExpenses(
                      fixedExpenses.filter((x) => x.id !== item.id)
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

      <section className="panel">
        <h2>Gastos por categoria</h2>
        <div className="transactions">
          {categoryTotals.map((item) => (
            <div className="transaction" key={item.category}>
              <strong>{item.category}</strong>
              <strong>{money(item.total)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>
          <Target size={18} /> Metas
        </h2>
        <div className="form">
          <input
            placeholder="Nome da meta"
            value={goalForm.name}
            onChange={(e) =>
              setGoalForm({ ...goalForm, name: e.target.value })
            }
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

        <div className="transactions">
          {goals.map((goal) => {
            const percent =
              goal.target > 0
                ? Math.min(100, Math.round((goal.current / goal.target) * 100))
                : 0;

            return (
              <div className="goal" key={goal.id}>
                <div className="transaction">
                  <div>
                    <strong>{goal.name}</strong>
                    <p>
                      {money(goal.current)} / {money(goal.target)} • {percent}%
                    </p>
                  </div>
                  <button
                    onClick={() => setGoals(goals.filter((x) => x.id !== goal.id))}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="goal-add">
                  <input
                    type="number"
                    placeholder="Adicionar valor"
                    value={goal.addValue || ""}
                    onChange={(e) =>
                      setGoals(
                        goals.map((g) =>
                          g.id === goal.id
                            ? { ...g, addValue: e.target.value }
                            : g
                        )
                      )
                    }
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

      <section className="history-grid">
        <section className="panel">
          <h2>
            <ArrowUpCircle size={18} /> Histórico de Entradas
          </h2>
          <div className="transactions">
            {incomes.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onEdit={() => editTransaction(item)}
                onDelete={() => deleteTransaction(item.id)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>
            <ArrowDownCircle size={18} /> Histórico de Saídas
          </h2>
          <div className="transactions">
            {expenses.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onEdit={() => editTransaction(item)}
                onDelete={() => deleteTransaction(item.id)}
              />
            ))}
          </div>
        </section>
      </section>

      <style>{`
        body {
          background: linear-gradient(135deg, #052e16, #14532d, #854d0e);
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
          font-size: 46px;
        }

        .subtitle, .muted, .transaction p {
          color: #d4d4d8;
        }

        .worldcup {
          color: #fde047;
          font-weight: bold;
        }

        .cards, .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .card, .panel, .transaction, .goal, .mentor-msg {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 20px;
        }

        .card-top, .transaction {
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

        .form, .transactions, .mentor-list {
          display: grid;
          gap: 12px;
        }

        input, select {
          border: none;
          border-radius: 16px;
          padding: 14px;
          background: rgba(255,255,255,0.12);
          color: white;
          font-size: 16px;
        }

        option {
          color: black;
        }

        input::placeholder {
          color: #d4d4d8;
        }

        button {
          border: none;
          border-radius: 16px;
          padding: 14px;
          background: linear-gradient(90deg, #16a34a, #ca8a04);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .secondary {
          background: rgba(255,255,255,0.14);
        }

        .small-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-button {
          padding: 10px;
          border-radius: 12px;
        }

        .danger-button {
          background: rgba(220,38,38,0.75);
        }

        .progress {
          height: 12px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 14px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #fde047);
        }

        .progress-fill.warning {
          background: #facc15;
        }

        .progress-fill.danger {
          background: #dc2626;
        }

        .alert {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(220,38,38,0.25);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .transaction-right, .goal-add {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .goal-add {
          margin-top: 12px;
        }

        .mentor-msg.crítico {
          border-color: rgba(220,38,38,0.7);
        }

        .mentor-msg.atenção {
          border-color: rgba(250,204,21,0.7);
        }

        .mentor-msg.positivo {
          border-color: rgba(34,197,94,0.7);
        }

        .mentor-msg.ideia {
          border-color: rgba(59,130,246,0.7);
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

function HistoryItem({ item, onEdit, onDelete }) {
  return (
    <div className="transaction">
      <div>
        <strong>{item.description}</strong>
        <p>
          {item.date} • {item.category} • {item.paymentMethod}
          {item.paymentMethod === "Cartão de Crédito" &&
            Number(item.installments || 1) > 1 &&
            ` • ${item.installments}x`}
        </p>
      </div>

      <div className="transaction-right">
        <strong>{money(item.amount)}</strong>
        <div className="small-actions">
          <button className="icon-button" onClick={onEdit}>
            <Pencil size={16} />
          </button>
          <button className="icon-button danger-button" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
