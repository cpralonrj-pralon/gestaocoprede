import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getScheduleAnalysis } from '../services/gemini';
import { SmartScheduleModal } from '../components/SmartScheduleModal';
import { useEmployees } from '../context/EmployeeContext';
import { getSchedulesByRange, saveSchedulesBulk, saveSchedule } from '../services/supabase/schedules';
import { MonthPicker } from '../components/MonthPicker';
import { isOperationalRole } from '../utils/roleUtils';

const STATUS_MAP: any = {
  '08-17': { label: '08-17', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  '09-18': { label: '09-18', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  '10-19': { label: '10-19', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  '13-22': { label: '13-22', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  'FOLGA': { label: 'FOLGA', class: 'bg-slate-100 dark:bg-slate-800/50 text-slate-400' },
  'FÉRIAS': { label: 'FÉRIAS', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  'FB': { label: 'FB', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  'INSS': { label: 'INSS', class: 'bg-red-600/10 text-red-600 border-red-600/20 font-black' },
  'ATESTADO': { label: 'ATEST', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  'AFAST': { label: 'AFAST', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  'FALTA': { label: 'FALTA', class: 'bg-red-500/10 text-red-500 border-red-500/20' }, // Legacy fallback
  'FALTA JUSTIFICADA': { label: 'F-JUST', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black' },
  'FALTA NÃO JUSTIFICADA': { label: 'F-INJUST', class: 'bg-rose-600/10 text-rose-600 border-rose-600/20 font-black' },
  'vacation': { label: 'FÉRIAS', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
};

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const ScheduleView: React.FC<Props> = ({ currentMonth, onMonthChange }) => {
  const { employees } = useEmployees();
  const operationalEmployees = useMemo(() => employees.filter(e => isOperationalRole(e.role)), [employees]);
  const [filterArea, setFilterArea] = useState('Todas');
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [isSmartGenOpen, setIsSmartGenOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ empId: string, dayIdx: number } | null>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      const data = await getSchedulesByRange(start, end);

      const mapped: any = {};
      operationalEmployees.forEach(emp => {
        mapped[emp.id] = daysInMonth.map(day => {
          const dayStr = day.toISOString().split('T')[0];
          const found = data.find(s => s.employee_id === emp.id && s.schedule_date === dayStr);
          if (found) return found.shift_type;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return isWeekend ? 'FOLGA' : '08-17';
        });
      });
      setScheduleData(mapped);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, operationalEmployees, daysInMonth]);

  useEffect(() => {
    if (operationalEmployees.length > 0) fetchSchedules();
  }, [fetchSchedules, operationalEmployees.length]);

  const filteredEmployees = useMemo(() => {
    if (filterArea === 'Todas') return operationalEmployees;
    return operationalEmployees.filter(e => e.cluster === filterArea);
  }, [filterArea, operationalEmployees]);

  const chartData = useMemo(() => {
    return daysInMonth.map((day, idx) => {
      let active = 0;
      let off = 0;
      filteredEmployees.forEach(emp => {
        const shifts = scheduleData[emp.id];
        if (shifts) {
          const s = shifts[idx];
          const isOff = ['FOLGA', 'FÉRIAS', 'FB', 'INSS', 'ATESTADO', 'AFAST', 'vacation'].includes(s);
          if (s && !isOff) active++;
          else off++;
        }
      });
      return {
        day: (idx + 1).toString().padStart(2, '0'),
        presença: active,
        ausentes: off,
      };
    });
  }, [daysInMonth, scheduleData, filteredEmployees]);

  const todayStats = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

    if (!isCurrentMonth) {
      return { presence: 0, total: 0, percentage: 0 };
    }

    const dayIdx = today.getDate() - 1;
    const dayData = chartData[dayIdx];

    if (!dayData) return { presence: 0, total: 0, percentage: 0 };

    const total = dayData.presença + dayData.ausentes;
    const percentage = total > 0 ? Math.round((dayData.presença / total) * 100) : 0;

    return { presence: dayData.presença, total, percentage };
  }, [chartData, currentMonth]);

  const updateShift = async (empId: string, dayIdx: number, newStatus: string) => {
    try {
      const dayStr = daysInMonth[dayIdx].toISOString().split('T')[0];
      await saveSchedule({
        employee_id: empId,
        schedule_date: dayStr,
        shift_type: newStatus
      });

      setScheduleData((prev: any) => ({
        ...prev,
        [empId]: prev[empId].map((s: string, i: number) => i === dayIdx ? newStatus : s)
      }));
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Erro ao atualizar escala.');
    }
  };

  const handleBulkUpdate = async (empId: string | 'all', status: string) => {
    try {
      const targets = empId === 'all' ? operationalEmployees.map(e => e.id) : [empId];
      const schedulesToUpsert: any[] = [];

      targets.forEach(id => {
        daysInMonth.forEach(day => {
          schedulesToUpsert.push({
            employee_id: id,
            schedule_date: day.toISOString().split('T')[0],
            shift_type: status
          });
        });
      });

      await saveSchedulesBulk(schedulesToUpsert);
      fetchSchedules();
      setIsBulkAdjustOpen(false);
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Erro ao atualizar escalas em massa.');
    }
  };

  const handleApplySmartSchedule = async (alocacoes: any) => {
    try {
      const schedulesToUpsert: any[] = [];
      Object.entries(alocacoes).forEach(([empId, shifts]: [any, any]) => {
        shifts.forEach((shift: string, idx: number) => {
          schedulesToUpsert.push({
            employee_id: empId,
            schedule_date: daysInMonth[idx].toISOString().split('T')[0],
            shift_type: shift
          });
        });
      });

      await saveSchedulesBulk(schedulesToUpsert);
      fetchSchedules();
      setIsSmartGenOpen(false);
    } catch (error) {
      console.error('Error applying smart schedule:', error);
      alert('Erro ao aplicar escala inteligente.');
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoadingAi(true);
      try {
        const dataForAi = chartData.map(d => ({ dia: d.day, presentes: d.presença }));
        const insights = await getScheduleAnalysis(dataForAi);
        setAiInsights(insights);
      } catch (error) {
        console.error('AI Analysis Error:', error);
      } finally {
        setIsLoadingAi(false);
      }
    };

    if (chartData.some(d => d.presença > 0)) {
      fetchAnalysis();
    }
  }, [chartData]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-30 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_view_month</span>
              Escala Operacional
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative shrink-0">
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Todas">Todas as Áreas</option>
                  {Array.from(new Set(operationalEmployees.map(e => e.cluster).filter(Boolean))).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none scale-75">filter_list</span>
              </div>

              <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />

              <button
                onClick={() => setIsBulkAdjustOpen(true)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-5 py-2 rounded-xl font-black flex items-center gap-2 transition-all text-[10px] active:scale-95 uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span> Ajustar
              </button>

              <button
                onClick={() => setIsSmartGenOpen(true)}
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-primary/20 transition-all text-[10px] active:scale-95 uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span> Geração AI
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatSmall
              label="Presença Hoje"
              value={`${todayStats.percentage}%`}
              trend={todayStats.percentage > 0 ? "Real" : "Vazio"}
              icon="trending_up"
              color="emerald"
            />
            <StatSmall
              label="Escalas Ativas"
              value={todayStats.presence.toString()}
              trend={`De ${todayStats.total}`}
              icon="event_available"
              color="primary"
            />
            <StatSmall label="Alertas AI" value={isLoadingAi ? "..." : aiInsights.length} trend="Pendentes" icon="bolt" color="amber" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4 lg:p-6 space-y-6">
        <div className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Capacidade Operacional</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="presença" stroke="#137fec" fillOpacity={1} fill="url(#colorPresence)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 pr-4 font-inter">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0">
            <div style={{ minWidth: (daysInMonth.length * 55 + 200) + 'px' }}>
              <div className="grid grid-cols-[200px_1fr] bg-slate-50 dark:bg-background-dark/30 border-b border-slate-200 dark:border-slate-800">
                <div className="p-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-background-dark z-20 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Colaborador
                </div>
                <div className="flex">
                  {daysInMonth.map((day, idx) => (
                    <div key={idx} className={`w-[55px] shrink-0 p-4 text-center border-r border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase flex flex-col ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-200/50 dark:bg-background-dark/80 text-primary' : 'text-slate-500'}`}>
                      <span>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
                      <span className="text-xs dark:text-white">{day.getDate().toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="grid grid-cols-[200px_1fr] hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <div className="p-3 border-r border-slate-100 dark:border-slate-800 flex items-center gap-3 sticky left-0 bg-white dark:bg-surface-dark z-10">
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="size-full bg-primary flex items-center justify-center text-white font-bold text-[10px]">{emp.name.charAt(0)}</div>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black dark:text-white truncate uppercase tracking-tighter">{emp.name}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">{emp.role}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {(scheduleData[emp.id] || []).map((s: string, i: number) => (
                        <div key={i} className="w-[55px] shrink-0 p-1 border-r border-slate-50 dark:border-slate-800 flex items-center justify-center">
                          <button
                            onClick={() => setEditingCell({ empId: emp.id, dayIdx: i })}
                            className={`w-full h-8 rounded-lg flex items-center justify-center text-[9px] font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 ${STATUS_MAP[s]?.class || 'bg-slate-100 text-slate-400'}`}
                          >
                            {STATUS_MAP[s]?.label || '---'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[300px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col self-start sticky right-0 shadow-2xl z-20">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <span className="material-symbols-outlined animate-pulse">psychology</span>
              <span className="text-[10px] font-black uppercase tracking-widest">IA Insight</span>
            </div>
            <div className="space-y-3">
              {isLoadingAi ? (
                <div className="py-8 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase animate-pulse tracking-widest">Analisando...</div>
              ) : aiInsights.map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${insight.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  <p className="text-[9px] font-black uppercase mb-1 text-white">{insight.title}</p>
                  <p className="text-[10px] leading-relaxed opacity-80">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editingCell && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditingCell(null)} />
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-400">Alterar Plantão</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(STATUS_MAP).map(key => (
                <button
                  key={key}
                  onClick={() => updateShift(editingCell.empId, editingCell.dayIdx, key)}
                  className={`p-3 rounded-xl text-[10px] font-black uppercase text-left transition-all hover:ring-2 hover:ring-primary/50 ${STATUS_MAP[key].class}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isBulkAdjustOpen && (
        <BulkAdjustModal
          employees={operationalEmployees}
          onClose={() => setIsBulkAdjustOpen(false)}
          onApply={handleBulkUpdate}
        />
      )}

      {isSmartGenOpen && (
        <SmartScheduleModal
          employees={operationalEmployees}
          initialMonth={currentMonth}
          onClose={() => setIsSmartGenOpen(false)}
          onApply={handleApplySmartSchedule}
        />
      )}
    </div>
  );
};

const BulkAdjustModal = ({ employees, onClose, onApply }: any) => {
  const [target, setTarget] = useState('all');
  const [status, setStatus] = useState('FÉRIAS');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-black mb-1">Ajuste em Massa</h2>
        <div className="space-y-6 mt-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Colaborador Alvo</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold border-none"
            >
              <option value="all">Toda a Área</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Novo Status</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(STATUS_MAP).map(k => (
                <button
                  key={k}
                  onClick={() => setStatus(k)}
                  className={`p-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${status === k ? 'border-primary' : 'border-transparent'}`}
                >
                  <div className={`p-1 rounded ${STATUS_MAP[k].class}`}>{k}</div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onApply(target, status)}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs"
          >
            Aplicar Alteração
          </button>
        </div>
      </div>
    </div>
  );
};

const StatSmall = ({ label, value, trend, icon, color }: any) => {
  const colorMap: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    primary: 'text-primary bg-primary/10',
    amber: 'text-amber-500 bg-amber-500/10',
  };
  return (
    <div className="bg-white dark:bg-surface-highlight/5 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
      <div className={`size-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] text-slate-400 uppercase font-black leading-none mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black dark:text-white">{value}</span>
          <span className="text-[8px] font-black opacity-60 uppercase">{trend}</span>
        </div>
      </div>
    </div>
  );
};
