
import React, { useState } from 'react';
import { VacationRegistrationModal } from '../components/VacationRegistrationModal';
import { MonthPicker } from '../components/MonthPicker';

const MOCK_EMPLOYEES = [
  { id: 1, name: 'João Souza', role: 'Frontend Dev' },
  { id: 2, name: 'Maria Oliveira', role: 'UX Designer' },
  { id: 3, name: 'Carlos Mendes', role: 'Support L2' },
  { id: 4, name: 'Fernanda Lima', role: 'Support L1' },
];

const SQUAD_DATA = [
  {
    name: 'SQUAD DESENVOLVIMENTO A (COORD. ANA SILVA)',
    employees: [
      { id: 1, name: 'João Souza', role: 'Frontend Dev', start: 4, duration: 7, type: 'approved', label: 'Férias (7 dias)' },
      { id: 2, name: 'Maria Oliveira', role: 'UX Designer', start: 9, duration: 11, type: 'planned', label: 'Planejado' },
    ]
  },
  {
    name: 'SQUAD ATENDIMENTO (COORD. ROBERTO DIAS)',
    employees: [
      { id: 3, name: 'Carlos Mendes', role: 'Support L2', start: 14, duration: 6, type: 'pending', label: 'Solicitado' },
      { id: 4, name: 'Fernanda Lima', role: 'Support L1', start: 14, duration: 17, type: 'approved', label: 'Férias' },
    ]
  }
];

interface Props {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const VacationView: React.FC<Props> = ({ currentMonth, onMonthChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewType, setViewType] = useState('dias');

  const days = Array.from({ length: 16 }, (_, i) => ({
    num: i + 1,
    weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][(i + 1) % 7]
  }));

  return (
    <div className="h-full bg-background-light dark:bg-background-dark overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black dark:text-white flex items-center gap-3 uppercase tracking-tight">
            <span className="material-symbols-outlined text-primary text-3xl">beach_access</span>
            Planejamento de Férias
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Visão cronológica de ausências e monitoramento de riscos operacionais.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
            <input
              type="text"
              placeholder="Buscar colaborador..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Cadastrar Férias
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="px-8 mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Ausentes Hoje"
          value="8"
          subValue="Colaboradores"
          badge="+2%"
          badgeColor="text-emerald-500 bg-emerald-500/10"
          icon="umbrella"
          progress={15}
          progressColor="bg-primary"
        />
        <StatCard
          label="Próximos 30 dias"
          value="12"
          subValue="Agendadas"
          icon="calendar_month"
          progress={40}
          progressColor="bg-blue-500"
        />
        <StatCard
          label="Solicitações Pendentes"
          value="4"
          subValue="Pendentes"
          extra="Aguardando aprovação"
          icon="assignment_late"
          progress={60}
          progressColor="bg-amber-500"
        />
        <StatCard
          label="Impacto Operacional"
          value="2 Clusters"
          subValue="Risco Alto"
          subValueColor="text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg"
          extra="Equipes Tech e Atendimento acima da meta de 15%"
          icon="analytics"
          isAlert
        />
      </div>

      <div className="flex-1 overflow-hidden p-8 pt-0 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        {/* Main Content */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
          {/* Gantt Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-background-dark/30 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />
            </div>

            <div className="flex gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {['Dias', 'Semanas', 'Meses'].map(v => (
                <button
                  key={v}
                  onClick={() => setViewType(v.toLowerCase())}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === v.toLowerCase() ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Gantt Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div style={{ minWidth: '1000px' }}>
              {/* Table Column Headers */}
              <div className="grid grid-cols-[240px_1fr] border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-20">
                <div className="p-5 border-r border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Colaborador
                </div>
                <div className="grid grid-cols-16 divide-x divide-slate-100 dark:divide-slate-800">
                  {days.map(d => (
                    <div key={d.num} className="p-3 text-center flex flex-col items-center justify-center">
                      <span className="text-[11px] font-black dark:text-white leading-none">{d.num}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{d.weekday}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Squad Groups */}
              {SQUAD_DATA.map((squad, sIdx) => (
                <div key={sIdx} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                  <div className="bg-slate-50/50 dark:bg-primary/5 p-4 px-6 border-b border-slate-100 dark:border-slate-800/50">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{squad.name}</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {squad.employees.map(emp => (
                      <GanttRow key={emp.id} {...emp} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-6 bg-slate-50/50 dark:bg-background-dark/30 border-t border-slate-100 dark:border-slate-800 flex items-center gap-8">
            <LegendItem color="bg-primary" label="Confirmado/Em andamento" />
            <LegendItem color="bg-purple-500" label="Planejado (Futuro)" />
            <LegendItem color="bg-slate-500" label="Solicitação Pendente" />
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-2">
            <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-2xl animate-pulse">notifications</span>
            </div>
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Alertas de Impacto</h2>
          </div>

          <div className="space-y-4">
            <ImpactCard
              title="Cluster Atendimento"
              status="CRÍTICO"
              statusColor="bg-red-500"
              borderLeft="border-red-500"
              desc="Ausência projetada excede o limite de segurança operacional para 12-18 Out."
              current="18%"
              max="15%"
              type="critical"
            />
            <ImpactCard
              title="Squad Desenvolvimento A"
              status="ALERTA"
              statusColor="bg-amber-500"
              borderLeft="border-amber-500"
              desc="Sobreposição de férias de 2 seniors (João & Maria)."
              current="12%"
              max="15%"
              type="warning"
            />
          </div>

          {/* Information Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex gap-4 items-start mt-8">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">info</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">
              Férias cadastradas que geram conflito crítico requerem aprovação do Diretor de Operações.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <VacationRegistrationModal
          employees={MOCK_EMPLOYEES}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            console.log('Saved:', data);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const GanttRow = ({ name, role, start, duration, type, label, id }: any) => {
  const typeMap: any = {
    approved: 'bg-primary shadow-lg shadow-primary/30 text-white',
    planned: 'bg-[#a855f7] shadow-lg shadow-purple-900/40 text-white border-x-2 border-dashed border-white/20',
    pending: 'bg-[#2d3b4b] text-slate-400'
  };

  return (
    <div className="grid grid-cols-[240px_1fr] hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-all group">
      <div className="p-5 border-r border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
          <img src={`https://picsum.photos/seed/${id}/100/100`} className="size-full object-cover" alt={name} />
        </div>
        <div className="overflow-hidden">
          <p className="text-[11px] font-black dark:text-white uppercase truncate tracking-tight">{name}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{role}</p>
        </div>
      </div>
      <div className="grid grid-cols-16 items-center px-4 relative h-20">
        {/* Background Grid Lines */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-full border-r border-slate-100/30 dark:border-slate-800/20 last:border-none" />
        ))}

        {/* Vacation Bar */}
        <div
          className={`h-10 rounded-2xl z-10 flex items-center px-4 transition-all hover:brightness-110 cursor-pointer absolute ${typeMap[type]}`}
          style={{
            gridColumnStart: start,
            gridColumnEnd: start + duration,
            left: '16px',
            right: '16px'
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest truncate">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-3">
    <div className={`size-3 rounded-full ${color}`} />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{label}</span>
  </div>
);

const ImpactCard = ({ title, status, statusColor, borderLeft, desc, current, max, type }: any) => (
  <div className={`p-6 bg-white dark:bg-[#1c232d] border border-slate-200 dark:border-slate-800 border-l-4 ${borderLeft} rounded-3xl shadow-sm hover:shadow-md transition-all`}>
    <div className="flex justify-between items-start mb-4">
      <h4 className="text-[11px] font-black dark:text-white uppercase tracking-tight max-w-[140px] leading-tight mt-1">{title}</h4>
      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg text-white ${statusColor}`}>{status}</span>
    </div>
    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mb-6">
      {desc}
    </p>
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400">Ausência</span>
        <span className={type === 'critical' ? 'text-red-500' : 'text-amber-500'}>{current}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${type === 'critical' ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
          style={{ width: current }}
        />
      </div>
      <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-tighter">
        <span>Atual</span>
        <span>Meta Máx: {max}</span>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, subValue, subValueColor = "", extra = "", badge = "", badgeColor = "", icon, progress, progressColor, isAlert }: any) => (
  <div className="bg-white dark:bg-[#1c232d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">{icon}</span>
      </div>
    </div>

    <div className="flex items-baseline gap-2 mb-1">
      <h3 className="text-2xl font-black dark:text-white leading-none">{value}</h3>
      {badge && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${badgeColor}`}>{badge}</span>}
    </div>

    <div className="flex items-center gap-2 mb-6">
      <span className={`text-xs font-black uppercase tracking-tight ${subValueColor || 'dark:text-white'}`}>{subValue}</span>
      {extra && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{extra}</span>}
    </div>

    {isAlert ? (
      <div className="absolute -right-2 -bottom-2 opacity-10">
        <span className="material-symbols-outlined text-7xl text-red-500 animate-pulse">warning</span>
      </div>
    ) : (
      <div className="space-y-1.5">
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    )}
  </div>
);
