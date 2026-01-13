import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { getKpiTip, getChartDeepDive } from '../services/gemini';
import { MonthPicker } from '../components/MonthPicker';
import { useEmployees } from '../context/EmployeeContext';
import { getAllFeedbacks } from '../services/supabase/feedback';
import { isOperationalRole } from '../utils/roleUtils';
import { getSchedulesByRange } from '../services/supabase/schedules';

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  searchQuery?: string;
}

export const DashboardView: React.FC<Props> = ({ currentMonth, onMonthChange, searchQuery = '' }) => {
  const { employees, formatBalance, refreshEmployees, loading: loadingEmployees } = useEmployees();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' } | null>(null);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(true);
  const [period, setPeriod] = useState<'semanal' | 'mensal'>('mensal');
  const [deepDive, setDeepDive] = useState<string>('');
  const [loadingDeepDive, setLoadingDeepDive] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoadingFeedbacks(true);
      try {
        const data = await getAllFeedbacks();
        setFeedbacks(data);
      } catch (error) {
        console.error('Error fetching feedbacks for dashboard:', error);
      } finally {
        setLoadingFeedbacks(false);
      }
    };
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoadingSchedules(true);
      try {
        // Validate currentMonth is a valid Date
        if (!currentMonth || !(currentMonth instanceof Date) || isNaN(currentMonth.getTime())) {
          console.warn('Invalid currentMonth:', currentMonth);
          setLoadingSchedules(false);
          return;
        }

        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
        const data = await getSchedulesByRange(startOfMonth, endOfMonth);
        setSchedules(data);
      } catch (error) {
        console.error('Error fetching schedules for dashboard:', error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, [currentMonth]);

  const operationalEmployees = useMemo(() => employees.filter(e => isOperationalRole(e.role)), [employees]);
  const areas = useMemo(() => Array.from(new Set(operationalEmployees.map(e => e.cluster).filter(Boolean))), [operationalEmployees]);

  const areaAggregation = useMemo(() => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

    return areas.map(areaName => {
      const areaEmployees = operationalEmployees.filter(e => e.cluster === areaName);
      const areaEmployeeIds = new Set(areaEmployees.map(e => e.id));

      const areaFeedbacks = feedbacks.filter(f =>
        f.period_month === month &&
        f.period_year === year &&
        areaEmployeeIds.has(f.employee_id)
      );

      // For today's performance, filter schedules for today only
      // Create local date string YYYY-MM-DD to match database format
      const today = new Date();
      const yearStr = today.getFullYear();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      const todayLocalStr = `${yearStr}-${monthStr}-${dayStr}`;

      const todaySchedules = isCurrentMonth
        ? schedules.filter(s => {
          if (!areaEmployeeIds.has(s.employee_id)) return false;
          if (!s.schedule_date) return false;

          // Compare strings directly (assuming YYYY-MM-DD format from DB)
          // Also handle simplified Date objects or ISO strings
          let sDateStr = '';
          if (typeof s.schedule_date === 'string') {
            sDateStr = s.schedule_date.split('T')[0];
          } else if (s.schedule_date instanceof Date) {
            const y = s.schedule_date.getFullYear();
            const m = String(s.schedule_date.getMonth() + 1).padStart(2, '0');
            const d = String(s.schedule_date.getDate()).padStart(2, '0');
            sDateStr = `${y}-${m}-${d}`;
          }

          return sDateStr === todayLocalStr;
        })
        : [];

      if (isCurrentMonth && areaName === areas[0]) {
        console.log(`🔍 [Dashboard] Area: ${areaName} | Hoje: ${todayLocalStr} | Total Escalas Filtradas: ${todaySchedules.length}`);
        if (todaySchedules.length === 0 && schedules.length > 0) {
          console.log('   Exemplo de escala:', schedules[0].schedule_date);
        }
      }

      const offTypes = ['FOLGA', 'DSR', 'FÉRIAS', 'VACATION', 'FB', 'FALTA', 'FALTA INJUSTIFICADA', 'FALTA JUSTIFICADA', 'SUSPENSÃO', 'INSS', 'ATESTADO', 'AFAST'];

      let workingToday = 0;
      let offToday = 0;

      // Iterate over ALL employees in the area to account for those without schedules
      areaEmployees.forEach(emp => {
        const schedule = todaySchedules.find(s => s.employee_id === emp.id);

        if (schedule) {
          const type = (schedule.shift_type || '').toUpperCase().trim();
          if (offTypes.includes(type)) {
            offToday++;
          } else {
            workingToday++;
          }
        } else if (isCurrentMonth) {
          // Default "No Schedule" for today -> Assume Working (Standard Shift)
          workingToday++;
        }
      });

      // Always base denominator on total headcount of the area
      const totalToday = areaEmployees.length;

      const workPercentage = totalToday > 0
        ? (workingToday / totalToday) * 100
        : 0;

      // Debug: Removed

      const totalBalance = areaEmployees.reduce((acc, curr) => acc + (curr.current_hours_balance || 0), 0);
      const feedbackRate = areaEmployees.length > 0
        ? (areaFeedbacks.length / areaEmployees.length) * 100
        : 0;

      return {
        name: areaName,
        value: Math.round(workPercentage),
        trabalhando: Math.round(workPercentage), // Blue bar
        folga: Math.round(100 - workPercentage), // Red bar
        hasSchedules: todaySchedules.length > 0,
        employeeCount: areaEmployees.length,
        workingCount: workingToday,
        offCount: offToday,
        rawCount: totalToday,
        totalWorkable: totalToday,
        abs: totalToday > 0 ? `${((offToday / totalToday) * 100).toFixed(1)}%` : '0.0%',
        bank: formatBalance(totalBalance),
        feed: `${Math.round(feedbackRate)}%`,
        color: workPercentage < 60 ? '#fa6238' : (workPercentage < 90 ? '#f59e0b' : '#10b981')
      };
    }).sort((a, b) => b.value - a.value);
  }, [areas, employees, feedbacks, schedules, currentMonth, formatBalance]);

  const totalSeconds = operationalEmployees.reduce((acc, curr) => acc + (curr.current_hours_balance || 0), 0);
  const criticalCount = operationalEmployees.filter(e => (e.current_hours_balance || 0) < -14400).length;
  // Note: expiringHours might need a real field or calculation, for now using 0 as placeholder if missing
  const expiringCount = operationalEmployees.filter(e => (e as any).expiringHours > 0).length;
  const pendingFeedbacksCount = operationalEmployees.length - feedbacks.filter(f =>
    f.period_month === (currentMonth.getMonth() + 1) &&
    f.period_year === currentMonth.getFullYear() &&
    operationalEmployees.some(e => e.id === f.employee_id)
  ).length;

  const dynamicRiskEmployees = useMemo(() => {
    return operationalEmployees
      .filter(e => (e.current_hours_balance || 0) < 0)
      .sort((a, b) => (a.current_hours_balance || 0) - (b.current_hours_balance || 0))
      .slice(0, 4)
      .map(e => ({
        name: e.name,
        area: e.cluster,
        indicator: `Saldo BH: ${formatBalance(e.current_hours_balance || 0)}`,
        color: (e.current_hours_balance || 0) < -14400 ? "danger" : "warning"
      }));
  }, [operationalEmployees, formatBalance]);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoadingAi(true);
      const baseAlerts = [
        { type: 'critical', title: 'Risco BH Crítico', desc: `${criticalCount} colaboradores excederam o limite legal de horas negativas.`, icon: 'error', action: 'Ver Detalhes' },
        { type: 'warning', title: 'Feedbacks Pendentes', desc: `Restam ${pendingFeedbacksCount} feedbacks para serem realizados neste mês.`, icon: 'chat_bubble', action: 'Notificar gestores' },
        {
          type: 'info',
          title: 'Saúde da Planta',
          desc: `A média de performance global está em ${Math.round(
            areaAggregation.reduce((acc, curr) => acc + curr.rawCount, 0) /
            (areaAggregation.reduce((acc, curr) => acc + curr.totalWorkable, 0) || 1) * 100
          )
            }%`,
          icon: 'analytics',
          action: 'Investigar'
        }
      ];
      setAiAlerts(baseAlerts);
      setLoadingAi(false);
    };
    loadAlerts();
  }, [criticalCount, pendingFeedbacksCount, areaAggregation, areas.length]);

  useEffect(() => {
    const fetchDeepDive = async () => {
      setLoadingDeepDive(true);
      if (areaAggregation.length > 0) {
        const resp = await getChartDeepDive(areaAggregation, period);
        setDeepDive(resp);
      } else {
        setDeepDive("Aguardando dados de áreas para análise profunda.");
      }
      setLoadingDeepDive(false);
    };
    fetchDeepDive();
  }, [period, areaAggregation]);

  const handleAction = (action: string) => {
    if (action === 'Ver Detalhes') setShowDetailsModal(true);
    if (action === 'Notificar gestores') {
      setNotification({ msg: 'Notificações enviadas via sistema para todos os gestores com pendências.', type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    }
    if (action === 'Investigar') {
      setNotification({ msg: 'Iniciando análise preditiva de performance por cluster...', type: 'info' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredRiskEmployees = dynamicRiskEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.area || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-slate-50 dark:bg-background-dark relative text-slate-900 dark:text-white font-inter">
      {notification && (
        <div className={`fixed top-24 right-8 z-[110] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-primary border-primary-light text-white'}`}>
          <span className="material-symbols-outlined">{notification.type === 'success' ? 'check_circle' : 'info'}</span>
          <span className="font-bold text-sm tracking-tight">{notification.msg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard Supabase</h1>
            <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-[#9dabb9] text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">groups</span> {operationalEmployees.length} Colaboradores Operacionais Ativos</span>
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              <span>Sincronizado via Supabase Realtime</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setNotification({ msg: 'Sincronizando dados do banco...', type: 'info' });
                await refreshEmployees();
                setTimeout(() => setNotification({ msg: 'Dados atualizados!', type: 'success' }), 500);
                setTimeout(() => setNotification(null), 3000);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all flex items-center gap-2 text-sm font-black uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-lg">sync</span>
              Atualizar
            </button>
            <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label="Performance Geral" value={`${Math.round(areaAggregation.reduce((acc, curr) => acc + (curr.workingCount || 0), 0) / (areaAggregation.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0) || 1) * 100)}%`} trend="Média Global" trendDir="up" color="primary" icon="analytics" progress={85} />
          <KpiCard label="Feedbacks Concluídos" value={`${feedbacks.filter(f => f.period_month === (currentMonth.getMonth() + 1) && f.period_year === currentMonth.getFullYear() && operationalEmployees.some(e => e.id === f.employee_id)).length}`} trend="Deste Mês" trendDir="info" color="emerald" icon="chat_bubble" progress={(feedbacks.length / (operationalEmployees.length || 1)) * 100} />
          <KpiCard label="Saldo Total BH" value={formatBalance(totalSeconds)} trend={totalSeconds < 0 ? "Negativo" : "Positivo"} trendDir={totalSeconds < 0 ? "danger" : "up"} color={totalSeconds < 0 ? "danger" : "success"} icon="history" progress={50} />
          <KpiCard label="Risco Crítico" value={criticalCount.toString()} trend="Horas Negativas" trendDir="danger" color="danger" icon="warning" progress={criticalCount * 10} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase">Performance por Área</h3>
                <p className="text-slate-500 dark:text-[#9dabb9] text-[10px] font-black uppercase tracking-widest mt-1">
                  % de colaboradores trabalhando hoje
                </p>
              </div>
            </div>



            <div className="h-[300px] w-full mb-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaAggregation} margin={{ top: 30, right: 20, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const name = payload.value || '';

                      // IMPROVED TEXT WRAPPING LOGIC (FORCE SPLIT ON SLASH)
                      const words = name.replace(/\//g, '/ ').split(' ');
                      const lines: string[] = [];
                      let currentLine = '';

                      words.forEach((word: string) => {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        // Stricter wrapping for long area names
                        if (testLine.length > 10 && currentLine) {
                          lines.push(currentLine);
                          currentLine = word;
                        } else {
                          currentLine = testLine;
                        }
                      });
                      if (currentLine) lines.push(currentLine);

                      return (
                        <g transform={`translate(${x},${y})`}>
                          {lines.map((line, index) => (
                            <text
                              key={index}
                              x={0}
                              y={index * 12 + 15}
                              fill="#9dabb9"
                              fontSize={8}
                              fontWeight={800}
                              textAnchor="middle"
                            >
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    }}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(19, 127, 236, 0.03)' }}
                    contentStyle={{ backgroundColor: '#1c232d', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any, name: string) => [`${value}%`, name === 'trabalhando' ? 'Trabalhando' : 'Folga']}
                  />

                  {/* Bar for "Trabalhando" (Blue) */}
                  <Bar dataKey="trabalhando" stackId="a" fill="#137fec" radius={[0, 0, 12, 12]} barSize={55} />

                  {/* Bar for "Folga" (Red) */}
                  <Bar dataKey="folga" stackId="a" fill="#ef4444" radius={[12, 12, 0, 0]} barSize={55}>
                    <LabelList
                      dataKey="folga"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        const item = areaAggregation[index];
                        return (
                          <g>
                            <text
                              x={x + width / 2}
                              y={y - 20}
                              fill="#137fec"
                              textAnchor="middle"
                              fontSize={14}
                              fontWeight={900}
                            >
                              {item.trabalhando}%
                            </text>
                            <text
                              x={x + width / 2}
                              y={y - 5}
                              fill="#64748b"
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={700}
                            >
                              {item?.rawCount || 0} colab.
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 shrink-0">
              {areaAggregation.map((m: any) => (
                <div key={m.name} className="p-5 rounded-2xl bg-slate-50 dark:bg-surface-highlight border border-slate-100 dark:border-slate-800/50 group hover:border-primary/50 transition-all">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{m.name}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-[9px] text-slate-500 font-black uppercase">Abs.</span><span className="text-[10px] font-black text-slate-400">{m.abs}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[9px] text-slate-500 font-black uppercase">Banco</span><span className={`text-[10px] font-black ${m.bank.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>{m.bank}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[9px] text-slate-500 font-black uppercase">Feed.</span><span className="text-[10px] font-black text-primary">{m.feed}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-6 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Gemini AI Analysis</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {loadingDeepDive ? "Processando padrões estatísticos..." : deepDive}
              </p>
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex-1">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3 uppercase tracking-tight"><span className="material-symbols-outlined text-primary text-2xl">notifications_active</span>Alertas</h3>
              <div className="space-y-6">
                {loadingAi ? <div className="space-y-4 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-surface-highlight rounded-2xl" />)}</div> : aiAlerts.map((alert, idx) => <AlertItem key={idx} {...alert} onAction={() => handleAction(alert.action)} />)}
              </div>
            </div>
          </div>
        </div >

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-black uppercase tracking-tight">Foco em Desenvolvimento (Saldos BH)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-surface-highlight text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-6">Colaborador</th>
                  <th className="px-8 py-6">Área</th>
                  <th className="px-8 py-6">Indicador Crítico</th>
                  <th className="px-8 py-6 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredRiskEmployees.length > 0 ? filteredRiskEmployees.map(emp => (
                  <tr key={emp.name} className="hover:bg-slate-50 dark:hover:bg-surface-highlight transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase">{emp.name.charAt(0)}</div>
                        <span className="font-black text-sm dark:text-white uppercase tracking-tight">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.area}</td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${emp.color === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {emp.indicator}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button className="text-slate-300 hover:text-primary transition-colors hover:scale-110 active:scale-90"><span className="material-symbols-outlined">analytics</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Nenhum registro crítico encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div >
    </div >
  );
};

const KpiCard = ({ label, value, trend, trendDir, color, icon, progress }: any) => {
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

  const trendColors: any = {
    up: 'text-emerald-500 bg-emerald-500/10',
    down: 'text-red-500 bg-red-500/10',
    warning: 'text-orange-500 bg-orange-500/10',
    danger: 'text-rose-500 bg-rose-500/10',
    info: 'bg-primary/10 text-primary'
  };

  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 relative overflow-hidden group shadow-sm transition-all hover:shadow-xl h-[260px] flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500"><span className="material-symbols-outlined text-8xl">{icon}</span></div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      <div className="flex items-center gap-3 mt-4">
        <h3 className="text-3xl font-black tracking-tighter dark:text-white">{value}</h3>
        <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${trendColors[trendDir] || 'bg-slate-100 text-slate-400'}`}>{trend}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color === 'success' || color === 'emerald' ? 'bg-emerald-500' : color === 'danger' ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
      </div>
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-start gap-3">
          <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[14px]">psychology</span>
          </div>
          <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed">{loading ? "Analisando métricas..." : tip}</p>
        </div>
      </div>
    </div>
  );
};

const AlertItem = ({ type, title, desc, icon, action, onAction }: any) => {
  const styles: any = { critical: 'border-rose-500/30 text-rose-500', warning: 'border-amber-500/30 text-amber-500', info: 'border-blue-500/30 text-blue-500' };
  return (
    <div className={`p-6 border border-l-4 rounded-3xl bg-slate-50 dark:bg-surface-highlight/50 space-y-4 shadow-sm group hover:scale-[1.01] transition-all ${styles[type]}`}>
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm leading-tight tracking-tight uppercase">{title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-[#aab4c0] font-bold leading-relaxed mt-2">{desc}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={onAction} className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-900 dark:bg-primary text-white shadow-xl transition-all hover:scale-105 active:scale-95">{action}</button>
      </div>
    </div>
  );
};
