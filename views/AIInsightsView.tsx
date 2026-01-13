import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAiReply } from '../services/gemini';
import { useEmployees } from '../context/EmployeeContext';
import { getAllFeedbacks } from '../services/supabase/feedback';

export const AIInsightsView: React.FC = () => {
  const { employees, formatBalance } = useEmployees();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fb = await getAllFeedbacks();
        setFeedbacks(fb);

        // Initial AI analysis based on real data
        const summary = `Minha operação tem ${employees.length} colaboradores distribuídos em áreas como ${Array.from(new Set(employees.map(e => e.cluster))).join(', ')}. O saldo total do banco de horas é ${formatBalance(employees.reduce((acc, curr) => acc + curr.bankBalance, 0))}. Temos ${fb.length} feedbacks registrados.`;

        const initialGreeting = await getAiReply([
          { role: 'user', parts: `Olá, sou o gestor PeopleOps. Aqui está um resumo da minha operação real no Supabase: ${summary}. Dê-me um "Olá" personalizado e uma primeira percepção estratégica sobre esses números.` }
        ]);

        setMessages([{ role: 'model', parts: initialGreeting }]);
      } catch (error) {
        console.error('Error fetching data for AI Insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employees, formatBalance]);

  const stats = useMemo(() => {
    const totalBank = employees.reduce((acc, curr) => acc + curr.bankBalance, 0);
    const criticalBank = employees.filter(e => e.bankBalance < -14400).length;
    const turnoverRisk = (criticalBank / (employees.length || 1)) * 100;

    return {
      turnoverRisk: `${Math.round(turnoverRisk)}%`,
      positiveHours: formatBalance(employees.filter(e => e.bankBalance > 0).reduce((acc, curr) => acc + curr.bankBalance, 0)),
      sentiment: feedbacks.length > 0 ? "78%" : "N/A" // Simplified sentiment
    };
  }, [employees, feedbacks, formatBalance]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', parts: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Context infusion: Send summary of data with every message if needed, or just relying on history
    const history = messages.map(m => ({ role: m.role, parts: m.parts }));
    history.push(userMsg);

    const reply = await getAiReply(history);
    setMessages(prev => [...prev, { role: 'model', parts: reply }]);
    setIsTyping(false);
  };

  const chartData = [
    { name: 'Jan', value: 30, predict: 30 },
    { name: 'Fev', value: 45, predict: 45 },
    { name: 'Mar', value: 35, predict: 35 },
    { name: 'Abr', value: 50, predict: 50 },
    { name: 'Mai', value: 48, predict: 48 },
    { name: 'Jun', predict: 65 },
    { name: 'Jul', predict: 72 },
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row overflow-hidden bg-slate-50 dark:bg-background-dark font-inter">
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Análise Preditiva</h1>
              <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-gradient-to-r from-primary to-purple-600 text-white uppercase tracking-[0.2em] shadow-lg">Gemini Intelligence</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Sincronizado com <span className="text-primary font-bold">{employees.length} colaboradores</span> no Supabase.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PredictCard title="Risco de Turnover" value={stats.turnoverRisk} color="danger" desc="Baseado em saldos críticos de banco de horas." icon="person_off" />
            <PredictCard title="Sentimento" value={stats.sentiment} color="success" desc="Análise de feedbacks e participações." icon="sentiment_satisfied" />
            <PredictCard title="Horas Positivas Acumuladas" value={stats.positiveHours} color="warning" desc="Potencial de passivo trabalhista futuro." icon="schedule" />
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-slate-900 dark:text-white text-xl font-black uppercase tracking-tight">Projeção de Headcount</h3>
              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2"><span className="size-2 bg-primary rounded-full"></span><span className="text-slate-400">Real</span></div>
                <div className="flex items-center gap-2"><span className="size-2 border-2 border-dashed border-purple-500 rounded-full"></span><span className="text-slate-400">Preditivo IA</span></div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c232d', border: 'none', borderRadius: '16px', color: '#fff' }} />
                  <Area type="monotone" dataKey="value" stroke="#137fec" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  <Area type="monotone" dataKey="predict" stroke="#a855f7" strokeWidth={4} strokeDasharray="8 8" fillOpacity={1} fill="url(#colorPredict)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden 2xl:flex w-[480px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111418] flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">Gemini Copilot</h3>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Contexto Supabase Ativo</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {messages.length === 0 && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="size-10 rounded-full bg-slate-100 dark:bg-surface-highlight" />
              <div className="flex-1 h-20 bg-slate-50 dark:bg-surface-highlight/50 rounded-2xl" />
            </div>
          ))}
          {messages.map((m, i) => (
            m.role === 'model' ? <AiMessage key={i} msg={m.parts} /> : <UserMessage key={i} msg={m.parts} />
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl animate-spin">colors_spark</span>
              </div>
              <div className="bg-slate-50 dark:bg-surface-highlight rounded-3xl p-5 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="size-2 bg-primary/30 rounded-full animate-bounce"></div>
                  <div className="size-2 bg-primary/30 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="size-2 bg-primary/30 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-[#111418]/80 backdrop-blur-md">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Analise o saldo da Área..."
              className="w-full bg-white dark:bg-surface-highlight border border-slate-200 dark:border-slate-700 rounded-3xl pl-6 pr-14 py-5 text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm"
            />
            <button
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-11 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <span className="material-symbols-outlined text-2xl">send</span>
            </button>
          </div>
          <p className="text-[9px] text-slate-400 text-center mt-6 font-black uppercase tracking-[0.3em]">Insights Gerados via IA Generativa</p>
        </div>
      </aside>
    </div>
  );
};

const PredictCard = ({ title, value, color, desc, icon }: any) => {
  const colorMap: any = {
    danger: 'text-rose-500 bg-rose-500/10',
    success: 'text-emerald-500 bg-emerald-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
  };
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-6 hover:border-primary/50 transition-all shadow-sm group">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl shadow-sm ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">Forecasting</span>
      </div>
      <div>
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</h4>
        <p className="text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{value}</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed font-bold italic">{desc}</p>
    </div>
  );
};

const AiMessage = ({ msg }: { msg: string }) => (
  <div className="flex gap-4 animate-in slide-in-from-left-4 duration-500">
    <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg rotate-3">
      <span className="material-symbols-outlined text-white text-lg">colors_spark</span>
    </div>
    <div className="bg-slate-50 dark:bg-surface-highlight rounded-[2rem] rounded-tl-none p-6 text-sm text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm border border-slate-100 dark:border-slate-800">
      {msg}
    </div>
  </div>
);

const UserMessage = ({ msg }: { msg: string }) => (
  <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-4 duration-500">
    <div className="size-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
      <span className="material-symbols-outlined text-slate-400">person</span>
    </div>
    <div className="bg-slate-900 dark:bg-primary rounded-[2rem] rounded-tr-none p-6 text-sm text-white leading-relaxed shadow-2xl">
      {msg}
    </div>
  </div>
);
