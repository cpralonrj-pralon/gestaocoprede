
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { getKpiTip, getSmartAlerts, getChartDeepDive } from '../services/gemini';

const weeklyData = [
  { name: 'Norte', value: 72, color: '#137fec' },
  { name: 'Sul', value: 85, color: '#137fec' },
  { name: 'Leste', value: 58, color: '#fa6238' },
  { name: 'Oeste', value: 80, color: '#137fec' },
];

const monthlyData = [
  { name: 'Norte', value: 78, color: '#137fec' },
  { name: 'Sul', value: 92, color: '#137fec' },
  { name: 'Leste', value: 64, color: '#fa6238' },
  { name: 'Oeste', value: 85, color: '#137fec' },
];

const clusterMetrics: any = {
  mensal: [
    { name: 'Norte', abs: '2.1%', bank: '+120h', feed: '98%' },
    { name: 'Sul', abs: '1.4%', bank: '-15h', feed: '100%' },
    { name: 'Leste', abs: '4.8%', bank: '+310h', feed: '72%' },
    { name: 'Oeste', abs: '2.5%', bank: '+42h', feed: '91%' },
  ],
  semanal: [
    { name: 'Norte', abs: '2.8%', bank: '+22h', feed: '40%' },
    { name: 'Sul', abs: '1.1%', bank: '-4h', feed: '85%' },
    { name: 'Leste', abs: '6.2%', bank: '+85h', feed: '30%' },
    { name: 'Oeste', abs: '3.1%', bank: '+12h', feed: '60%' },
  ]
};

const riskEmployees = [
  { name: "Ana Silva", cluster: "Norte", indicator: "Presença 65%", color: "danger" },
  { name: "Marco Oliveira", cluster: "Sul", indicator: "Overtime +15h/sem", color: "warning" },
  { name: "Julia Santos", cluster: "Leste", indicator: "Feedback Pendente", color: "warning" },
  { name: "Ricardo Lima", cluster: "Oeste", indicator: "Performance -20%", color: "danger" },
];

import { MonthPicker } from '../components/MonthPicker';
import { useEmployees } from '../context/EmployeeContext';

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  searchQuery?: string;
}

export const DashboardView: React.FC<Props> = ({ currentMonth, onMonthChange, searchQuery = '' }) => {
  const { employees, formatBalance } = useEmployees();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' } | null>(null);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(true);
  const [period, setPeriod] = useState<'semanal' | 'mensal'>('mensal');
  const [deepDive, setDeepDive] = useState<string>('');
  const [loadingDeepDive, setLoadingDeepDive] = useState(true);

  // Calcular métricas reais do contexto
  const totalSeconds = employees.reduce((acc, curr) => acc + curr.bankBalance, 0);
  const criticalCount = employees.filter(e => e.bankBalance < -14400).length;
  const expiringCount = employees.filter(e => e.expiringHours > 0).length;

  // Gerar lista de risco baseada nos dados reais
  const dynamicRiskEmployees = employees
    .filter(e => e.bankBalance < 0)
    .sort((a, b) => a.bankBalance - b.bankBalance)
    .slice(0, 4)
    .map(e => ({
      name: e.name,
      cluster: e.cluster,
      indicator: `Saldo BH: ${formatBalance(e.bankBalance)}`,
      color: e.bankBalance < -14400 ? "danger" : "warning"
    }));

  const displayRiskEmployees = dynamicRiskEmployees.length > 0 ? dynamicRiskEmployees : riskEmployees;

  useEffect(() => {
    const loadAlerts = async () => {
      setLoadingAi(true);
      const baseAlerts = [
        { type: 'critical', title: 'Risco Crítico: Banco de Horas', desc: `${criticalCount} colaboradores excederam o limite legal de horas extras nas últimas 48h.`, icon: 'error', action: 'Ver Detalhes' },
        { type: 'warning', title: 'Horas Positivas a Vencer', desc: `${expiringCount} colaboradores possuem horas extras positivas que expiram em menos de 30 dias.`, icon: 'event_busy', action: 'Ver Detalhes' },
        { type: 'info', title: 'Feedbacks Atrasados', desc: 'Gerentes do Cluster Oeste possuem 5 avaliações pendentes há mais de 7 dias.', icon: 'chat_bubble', action: 'Notificar Gerentes' }
      ];
      setAiAlerts(baseAlerts);
      setLoadingAi(false);
    };
    loadAlerts();
  }, [criticalCount, expiringCount]);

  useEffect(() => {
    const fetchDeepDive = async () => {
      setLoadingDeepDive(true);
      const data = period === 'semanal' ? weeklyData : monthlyData;
      const resp = await getChartDeepDive(data, period);
      setDeepDive(resp);
      setLoadingDeepDive(false);
    };
    fetchDeepDive();
  }, [period]);

  const handleAction = (action: string) => {
    if (action === 'Ver Detalhes') setShowDetailsModal(true);
    if (action === 'Investigar') {
      setNotification({ msg: 'Investigação iniciada no Cluster Sul. Analisando padrões de escala.', type: 'info' });
      setTimeout(() => setNotification(null), 4000);
    }
    if (action === 'Notificar Gerentes') {
      setNotification({ msg: 'Notificações enviadas aos 5 gerentes responsáveis no Cluster Oeste.', type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const currentChartData = period === 'semanal' ? weeklyData : monthlyData;
  const currentMetrics = clusterMetrics[period];

  const filteredEmployees = displayRiskEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.cluster.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-slate-50 dark:bg-background-dark relative text-slate-900 dark:text-white">
      {notification && (
        <div className={`fixed top-20 right-8 z-[110] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-primary border-primary-light text-white'}`}>
          <span className="material-symbols-outlined">{notification.type === 'success' ? 'check_circle' : 'info'}</span>
          <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Visão Geral da Operação</h1>
            <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-[#9dabb9] text-sm font-medium">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">groups</span> {employees.length || 146} Colaboradores</span>
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              <span>10:42 AM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />
            <button onClick={() => setShowFilterModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">filter_list</span> Filtrar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label="Saúde da Operação" value="88%" trend="+2.4%" trendDir="up" color="success" icon="ecg_heart" progress={88} />
          <KpiCard label="Presença Hoje" value="96%" trend="+1.0%" trendDir="up" color="primary" icon="person_check" progress={96} />
          <KpiCard label="Saldo Banco de Horas" value={formatBalance(totalSeconds)} trend={totalSeconds < 0 ? "Crítico" : "Saudável"} trendDir={totalSeconds < 0 ? "danger" : "up"} color={totalSeconds < 0 ? "danger" : "success"} icon="history" progress={Math.min(100, Math.max(0, 50 + (totalSeconds / 1000)))} subText={totalSeconds < 0 ? "Ação imediata recomendada" : "Saldo equilibrado"} />
          <KpiCard label="Status Feedbacks" value="12" trend="Atrasados" trendDir="danger" color="danger" icon="rate_review" progress={40} avatars={['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3']} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-xl font-black tracking-tight">Performance por Cluster Regional</h3>
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm mt-1">Comparativo de Presença e Eficiência</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-surface-highlight rounded-xl p-1.5 border border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => setPeriod('semanal')} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${period === 'semanal' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>Semanal</button>
                <button onClick={() => setPeriod('mensal')} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${period === 'mensal' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>Mensal</button>
              </div>
            </div>

            <div className="h-[280px] w-full mb-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentChartData} margin={{ top: 30, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9dabb9', fontSize: 13, fontWeight: 800 }} dy={15} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(19, 127, 236, 0.03)' }} contentStyle={{ backgroundColor: '#1c232d', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={55}>
                    {currentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.name === 'Leste' ? 0.8 : 1} />)}
                    <LabelList dataKey="value" position="top" formatter={(val: any) => `${val}%`} style={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} dy={-10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 shrink-0">
              {currentMetrics.map((m: any) => (
                <div key={m.name} className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-highlight border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{m.name}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold">Abs.</span><span className={`text-[10px] font-black ${parseFloat(m.abs) > 4 ? 'text-red-500' : 'text-emerald-500'}`}>{m.abs}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold">Banco</span><span className={`text-[10px] font-black ${m.bank.includes('+') ? 'text-orange-500' : 'text-emerald-500'}`}>{m.bank}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold">Feed.</span><span className="text-[10px] font-black text-primary">{m.feed}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Deep Dive Section - Optimized & Organized */}
            <div className="mt-auto p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 dark:border-primary/20 flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">Gemini Deep Dive <span className="px-1.5 py-0.5 rounded bg-primary text-[8px] text-white">PRO</span></h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl">
                {loadingDeepDive ? <span className="flex items-center justify-center gap-2 animate-pulse">Sintonizando análise estratatégica...</span> : deepDive}
              </p>
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex-1">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><span className="material-symbols-outlined text-primary text-2xl">magic_button</span>Alertas Inteligentes</h3>
              <div className="space-y-6">
                {loadingAi ? <div className="space-y-4 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-surface-highlight rounded-xl" />)}</div> : aiAlerts.map((alert, idx) => <AlertItem key={idx} {...alert} onAction={() => handleAction(alert.action)} />)}
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
              <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-slate-400">Ações Rápidas</h3>
              <button className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-highlight border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all font-bold text-sm">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-xl">add</span></div>Novo Colaborador
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"><h3 className="text-lg font-black">Colaboradores em Risco</h3><button className="text-primary font-bold text-sm hover:underline">Ver Todos</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-surface-highlight text-slate-500 dark:text-[#9dabb9] text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Nome</th>
                  <th className="px-8 py-5">Cluster</th>
                  <th className="px-8 py-5">Indicador</th>
                  <th className="px-8 py-5 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredEmployees.length > 0 ? filteredEmployees.map(emp => <RiskRow key={emp.name} {...emp} />) : <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">Nenhum colaborador encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {showDetailsModal && (
        <Modal title="Detalhes do Banco de Horas" onClose={() => setShowDetailsModal(false)}>
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500 mb-4">Excedentes Legais - Cluster Norte (Últimas 48h):</p>
            <div className="space-y-2">
              {[{ n: 'Ricardo Mendes', v: '+12h' }, { n: 'Amanda Costa', v: '+10h' }, { n: 'Thiago Silva', v: '+11h' }].map(p => (
                <div key={p.n} className="p-4 bg-slate-50 dark:bg-surface-highlight rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700/50"><span className="text-sm font-bold">{p.n}</span><span className="text-xs font-black text-red-500 px-2 py-1 bg-red-500/10 rounded-lg">{p.v}</span></div>
              ))}
            </div>
            <button onClick={() => setShowDetailsModal(false)} className="w-full py-4 bg-primary text-white font-black rounded-2xl mt-6 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Entendido</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const KpiCard = ({ label, value, trend, trendDir, color, icon, progress, subText, avatars }: any) => {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      const resp = await getKpiTip({ label, value, trend });
      setTip(resp);
      setLoading(false);
    };
    fetchTip();
  }, [label, value, trend]);

  const trendColors: any = { up: 'text-emerald-500 bg-emerald-500/10', down: 'text-red-500 bg-red-500/10', warning: 'text-orange-500 bg-orange-500/10', danger: 'text-red-500 bg-red-500/10' };

  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 relative overflow-hidden group shadow-sm transition-all hover:shadow-md h-[240px] flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500"><span className="material-symbols-outlined text-8xl">{icon}</span></div>
      <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-black uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-3 mt-3"><h3 className="text-3xl font-black tracking-tight">{value}</h3><span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-xl ${trendColors[trendDir] || trendColors['up']}`}>{trend}</span></div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-6 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${color === 'success' ? 'bg-emerald-500' : color === 'danger' ? 'bg-red-500' : color === 'warning' ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div></div>
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50"><div className="flex items-start gap-3"><div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-primary text-[14px]">smart_toy</span></div><p className="text-[10px] text-slate-500 dark:text-[#64748b] leading-relaxed italic font-medium">{loading ? "Análise técnica..." : tip}</p></div></div>
    </div>
  );
};

const AlertItem = ({ type, title, desc, icon, action, onAction }: any) => {
  const styles: any = { critical: 'bg-red-500/5 dark:bg-[#251818] border-red-500/20 text-red-500', warning: 'bg-orange-500/5 dark:bg-[#1f1a16] border-orange-500/20 text-orange-500', info: 'bg-blue-500/5 dark:bg-[#161a1f] border-blue-500/20 text-blue-500' };
  const btnStyles: any = { critical: 'bg-red-600 text-white shadow-red-600/20', warning: 'bg-primary text-white shadow-primary/20', info: 'bg-orange-500 text-white shadow-orange-500/20' };
  return (
    <div className={`p-6 border border-slate-200 dark:border-slate-800/50 border-l-4 rounded-3xl ${styles[type]} space-y-4 shadow-sm group hover:scale-[1.01] transition-all`}><div className="flex items-start gap-4"><div className="size-12 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700/50"><span className="material-symbols-outlined text-2xl">{icon}</span></div><div className="flex-1"><h4 className="font-black text-sm leading-tight tracking-tight">{title}</h4><p className="text-[11px] text-slate-500 dark:text-[#aab4c0] font-medium leading-relaxed mt-2">{desc}</p></div></div><div className="flex justify-end pt-1"><button onClick={onAction} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95 ${btnStyles[type]}`}>{action}</button></div></div>
  );
};

const RiskRow = ({ name, cluster, indicator, color }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight transition-colors group"><td className="px-8 py-5"><div className="flex items-center gap-4"><div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-transparent group-hover:border-primary/30 transition-all shadow-sm" /><span className="font-black text-sm">{name}</span></div></td><td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-[#9dabb9]">{cluster}</td><td className="px-8 py-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block ${color === 'danger' ? 'text-red-500 bg-red-500/10' : 'text-orange-500 bg-orange-500/10'}`}>{indicator}</span></td><td className="px-8 py-5 text-center"><button className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">more_vert</span></button></td></tr>
);

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} /><div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative z-10 p-8 animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-slate-200 dark:border-slate-800"><div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl tracking-tight">{title}</h3><button onClick={onClose} className="size-10 flex items-center justify-center bg-slate-100 dark:hover:bg-surface-highlight rounded-full transition-all hover:rotate-90"><span className="material-symbols-outlined text-xl">close</span></button></div>{children}</div></div>
);
