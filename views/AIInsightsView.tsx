
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAiReply } from '../services/gemini';

const chartData = [
  { name: 'Jan', value: 30, predict: 30 },
  { name: 'Fev', value: 45, predict: 45 },
  { name: 'Mar', value: 35, predict: 35 },
  { name: 'Abr', value: 50, predict: 50 },
  { name: 'Mai', value: 48, predict: 48 },
  { name: 'Jun', predict: 65 },
  { name: 'Jul', predict: 72 },
];

export const AIInsightsView: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'model', parts: 'Olá Carlos! Sou o Gemini, seu copiloto PeopleOps. Notei um padrão viral de ausências no Cluster Sul. Recomendo mover 3 analistas do Cluster Norte para cobrir o turno de amanhã.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', parts: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, parts: m.parts }));
    history.push(userMsg);

    const reply = await getAiReply(history);
    setMessages(prev => [...prev, { role: 'model', parts: reply }]);
    setIsTyping(false);
  };

  return (
    <div className="h-full flex flex-col xl:flex-row overflow-hidden bg-slate-50 dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Análise Preditiva</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-primary to-purple-600 text-white uppercase tracking-wider shadow-lg">Gemini Pro</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">IA processou <span className="text-slate-900 dark:text-white font-medium">12.4k pontos de dados</span> hoje. Turnover e Absenteísmo sob monitoramento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PredictCard title="Risco de Turnover" value="18%" color="danger" desc="Aumento de 5% no Cluster Sul nas últimas 48h." icon="person_off" />
            <PredictCard title="Sentimento Médio" value="72%" color="success" desc="Moral elevado após novo plano de benefícios." icon="sentiment_satisfied" />
            <PredictCard title="Horas Extras Prev." value="+12h" color="warning" desc="Projeção de pico para a Squad Tech em 15 dias." icon="schedule" />
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-slate-900 dark:text-white text-xl font-bold">Probabilidade de Turnover (90 Dias)</h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2"><span className="w-3 h-1 bg-primary rounded-full"></span><span className="text-slate-400">Histórico</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-1 border-t border-dashed border-purple-500"></span><span className="text-slate-400">Previsão IA</span></div>
              </div>
            </div>

            <div className="h-[300px] w-full">
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#111418', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="value" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  <Area type="monotone" dataKey="predict" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredict)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden 2xl:flex w-[450px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111418] flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-sm">Gemini AI Copilot</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Ativo agora</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {messages.map((m, i) => (
            m.role === 'model' ? <AiMessage key={i} msg={m.parts} /> : <UserMessage key={i} msg={m.parts} />
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm animate-spin">colors_spark</span>
              </div>
              <div className="bg-slate-50 dark:bg-surface-highlight rounded-2xl p-3">
                <div className="flex gap-1">
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111418]">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre sua operação..."
              className="w-full bg-white dark:bg-surface-highlight border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-12 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-primary text-white rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-4 font-medium uppercase tracking-widest">Powered by Google Gemini 1.5 Flash</p>
        </div>
      </aside>
    </div>
  );
};

const PredictCard = ({ title, value, color, desc, icon }: any) => {
  const colorMap: any = {
    danger: 'text-red-500 bg-red-500/10',
    success: 'text-emerald-500 bg-emerald-500/10',
    warning: 'text-orange-500 bg-orange-500/10',
  };
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-primary/50 transition-all shadow-sm group">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">AI Forecast</span>
      </div>
      <div>
        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-tight">{title}</h4>
        <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
};

const AiMessage = ({ msg }: { msg: string }) => (
  <div className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
      <span className="material-symbols-outlined text-white text-sm">colors_spark</span>
    </div>
    <div className="bg-slate-100 dark:bg-surface-highlight rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm">
      {msg}
    </div>
  </div>
);

const UserMessage = ({ msg }: { msg: string }) => (
  <div className="flex gap-3 flex-row-reverse animate-in slide-in-from-right-2 duration-300">
    <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600"></div>
    <div className="bg-primary rounded-2xl rounded-tr-none p-4 text-sm text-white leading-relaxed shadow-lg shadow-primary/10">
      {msg}
    </div>
  </div>
);
