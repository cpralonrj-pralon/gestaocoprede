
import React, { useState, useMemo, useEffect } from 'react';
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
// BulkAdjustModal is defined in this file

// --- Mock Data ---
const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Pedro Alcantara', role: 'Op. Logístico', area: 'Norte' },
  { id: 2, name: 'Ana Souza', role: 'Analista COP', area: 'Sul' },
  { id: 3, name: 'Carlos Silva', role: 'Coordenador I', area: 'Leste' },
  { id: 4, name: 'Beatriz Lima', role: 'Atendente', area: 'Norte' },
  { id: 5, name: 'Ricardo Oliveira', role: 'Técnico Senior', area: 'Oeste' },
  { id: 6, name: 'Juliana Costa', role: 'Analista COP', area: 'Sul' },
  { id: 7, name: 'Marcos Pires', role: 'Supervisor', area: 'Leste' },
];

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
};

import { MonthPicker } from '../components/MonthPicker';

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const ScheduleView: React.FC<Props> = ({ currentMonth, onMonthChange }) => {
  const [filterArea, setFilterArea] = useState('Todas');
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [isSmartGenOpen, setIsSmartGenOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ empId: number, dayIdx: number } | null>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Management state for schedule data
  const [scheduleData, setScheduleData] = useState<any>({});

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

  // Initialize schedule data if not exists or if month changes
  useEffect(() => {
    setScheduleData((prev: any) => {
      const next: any = { ...prev };
      let changed = false;
      INITIAL_EMPLOYEES.forEach(emp => {
        if (!next[emp.id] || next[emp.id].length !== daysInMonth.length) {
          next[emp.id] = daysInMonth.map((day) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return isWeekend ? 'FOLGA' : '08-17';
          });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [daysInMonth]);

  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Presence data for the chart based on actual scheduleData
  const chartData = useMemo(() => {
    return daysInMonth.map((day, idx) => {
      let active = 0;
      let off = 0;
      Object.values(scheduleData).forEach((shifts: any) => {
        const s = shifts[idx];
        if (s && !['FOLGA', 'FÉRIAS', 'INSS', 'ATESTADO', 'AFAST'].includes(s)) active++;
        else off++;
      });
      return {
        day: (idx + 1).toString().padStart(2, '0'),
        presença: active,
        ausentes: off,
      };
    });
  }, [daysInMonth, scheduleData]);

  const filteredEmployees = useMemo(() => {
    if (filterArea === 'Todas') return INITIAL_EMPLOYEES;
    return INITIAL_EMPLOYEES.filter(e => e.area === filterArea);
  }, [filterArea]);

  const updateShift = (empId: number, dayIdx: number, newStatus: string) => {
    setScheduleData((prev: any) => ({
      ...prev,
      [empId]: prev[empId].map((s: string, i: number) => i === dayIdx ? newStatus : s)
    }));
    setEditingCell(null);
  };

  const handleBulkUpdate = (empId: string | 'all', status: string, start?: string, end?: string) => {
    setScheduleData((prev: any) => {
      const next = { ...prev };
      const targets = empId === 'all' ? INITIAL_EMPLOYEES.map(e => e.id) : [parseInt(empId)];

      targets.forEach(id => {
        if (next[id]) {
          next[id] = next[id].map((curr: string, idx: number) => {
            // Simplified logic: apply to whole month for now as requested for "Carlos Silva" example
            return status;
          });
        }
      });
      return next;
    });
    setIsBulkAdjustOpen(false);
  };

  const handleApplySmartSchedule = (alocacoes: any) => {
    setScheduleData((prev: any) => ({
      ...prev,
      ...alocacoes
    }));
    setIsSmartGenOpen(false);
  };

  // AI Analysis trigger
  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoadingAi(true);
      const dataForAi = chartData.map(d => ({ dia: d.day, presentes: d.presença }));
      const insights = await getScheduleAnalysis(dataForAi);
      setAiInsights(insights);
      setIsLoadingAi(false);
    };

    if (Object.keys(scheduleData).length > 0) {
      fetchAnalysis();
    }
  }, [currentMonth, scheduleData]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Top Header */}
      <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-30 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_view_month</span>
              Escala Operacional
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {/* Area Filter */}
              <div className="relative shrink-0">
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-primary/50"
                >
                  {['Todas', 'Norte', 'Sul', 'Leste', 'Oeste'].map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none scale-75">filter_list</span>
              </div>

              {/* Month Selector */}
              <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />

              <button
                onClick={() => setIsBulkAdjustOpen(true)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2 rounded-xl font-black flex items-center gap-2 transition-all text-[10px] active:scale-95 uppercase tracking-widest"
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
            <StatSmall label="Presença Hoje" value="94%" trend="+2%" icon="trending_up" color="emerald" />
            <StatSmall label="Folgas Agendadas" value="32" trend="Hoje" icon="event_available" color="primary" />
            <StatSmall label="Férias Ativas" value="12" trend="Colabs" icon="beach_access" color="indigo" />
            <StatSmall label="Urgência Escala" value={isLoadingAi ? "..." : aiInsights.length} trend="Alertas AI" icon="bolt" color="amber" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4 lg:p-6 space-y-6">
        {/* Presence Chart */}
        <div className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex mb-6 justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Capacidade Operacional</h3>
              <p className="text-[10px] text-slate-400 font-medium italic">Monitoramento de headcount ativo vs ausências programadas</p>
            </div>
          </div>
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
                  itemStyle={{ fontWeight: 'black', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="presença" stroke="#137fec" fillOpacity={1} fill="url(#colorPresence)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Container for Table and AI Sidebar */}
        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 pr-4">
          {/* Schedule Table */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0">
            <div style={{ minWidth: (daysInMonth.length * 55 + 200) + 'px' }}>
              {/* Header */}
              <div className="grid grid-cols-[200px_1fr] bg-slate-50 dark:bg-background-dark/30 border-b border-slate-200 dark:border-slate-800">
                <div className="p-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-background-dark z-20 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Colaborador
                </div>
                <div className="flex">
                  {daysInMonth.map((day, idx) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div key={idx} className={`w-[55px] shrink-0 p-4 text-center border-r border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase flex flex-col ${isWeekend ? 'bg-slate-200/50 dark:bg-background-dark/80 text-primary' : 'text-slate-500'}`}>
                        <span>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
                        <span className="text-xs dark:text-white">{day.getDate().toString().padStart(2, '0')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="grid grid-cols-[200px_1fr] hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <div className="p-3 border-r border-slate-100 dark:border-slate-800 flex items-center gap-3 sticky left-0 bg-white dark:bg-surface-dark z-10 shadow-xl lg:shadow-none">
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={`https://picsum.photos/seed/${emp.id}/100/100`} className="size-full object-cover" alt={emp.name} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black dark:text-white truncate uppercase tracking-tighter">{emp.name}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">{emp.area}</p>
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

            <div className="p-4 bg-slate-50 dark:bg-background-dark/30 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Legenda:</span>
              {Object.entries(STATUS_MAP).slice(4).map(([key, value]: any) => (
                <div key={key} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className={`size-2.5 rounded ${value.class.split(' ')[0]}`}></div>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <div className="w-[300px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col self-start sticky right-0 shadow-2xl z-20">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <span className="material-symbols-outlined animate-pulse">psychology</span>
              <span className="text-[10px] font-black uppercase tracking-widest">IA Insight: Gaps</span>
            </div>
            <div className="space-y-3">
              {isLoadingAi ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase animate-pulse">Analisando...</div>
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

      {/* Editing Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditingCell(null)} />
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
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

      {/* Bulk Adjust Modal */}
      {isBulkAdjustOpen && (
        <BulkAdjustModal
          onClose={() => setIsBulkAdjustOpen(false)}
          onApply={handleBulkUpdate}
        />
      )}

      {/* Smart Generation Modal */}
      {isSmartGenOpen && (
        <SmartScheduleModal
          employees={INITIAL_EMPLOYEES}
          initialMonth={currentMonth}
          onClose={() => setIsSmartGenOpen(false)}
          onApply={handleApplySmartSchedule}
        />
      )}
    </div>
  );
};

const BulkAdjustModal = ({ onClose, onApply }: any) => {
  const [target, setTarget] = useState('all');
  const [status, setStatus] = useState('FÉRIAS');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black mb-1">Ajuste Estratégico em Massa</h2>
        <p className="text-slate-500 text-sm mb-8 font-medium italic">Alteração coletiva para o mês vigente.</p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Colaborador Alvo</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold border-none"
            >
              <option value="all">Toda a Área / Filtro</option>
              {INITIAL_EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Novo Status (Mês Inteiro)</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(STATUS_MAP).map(k => (
                <button
                  key={k}
                  onClick={() => setStatus(k)}
                  className={`p-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${status === k ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                >
                  <div className={`p-1 rounded ${STATUS_MAP[k].class}`}>{k}</div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onApply(target, status)}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all text-xs"
          >
            Aplicar Alteração Massiva
          </button>
        </div>
      </div>
    </div>
  );
};

const StatSmall = ({ label, value, trend, icon, color }: any) => {
  const colorMap: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    indigo: 'text-indigo-500 bg-indigo-500/10',
    red: 'text-red-500 bg-red-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    primary: 'text-primary bg-primary/10',
  };

  return (
    <div className="bg-white dark:bg-surface-highlight/5 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
      <div className={`size-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black dark:text-white">{value}</span>
          <span className="text-[8px] font-black opacity-60 uppercase">{trend}</span>
        </div>
      </div>
    </div>
  );
};
