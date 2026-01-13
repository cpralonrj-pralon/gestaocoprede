import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VacationRegistrationModal } from '../components/VacationRegistrationModal';
import { MonthPicker } from '../components/MonthPicker';
import { useEmployees } from '../context/EmployeeContext';
import { isOperationalRole } from '../utils/roleUtils';
import { getSchedulesByRange, saveSchedulesBulk, deleteSchedulesByRange } from '../services/supabase/schedules';

export const VacationView: React.FC<{ currentMonth: Date; onMonthChange: (date: Date) => void }> = ({ currentMonth, onMonthChange }) => {
  const { employees } = useEmployees();
  const operationalEmployees = useMemo(() => employees.filter(e => isOperationalRole(e.role)), [employees]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewType, setViewType] = useState('dias');
  const [vacationSchedules, setVacationSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVacation, setEditingVacation] = useState<any>(null);

  const fetchVacations = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      const data = await getSchedulesByRange(start, end);
      setVacationSchedules(data.filter(s => s.shift_type === 'vacation' || s.shift_type === 'FÉRIAS'));
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        num: i + 1,
        weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()],
        dateStr: date.toISOString().split('T')[0]
      };
    });
  }, [currentMonth]);

  const squadData = useMemo(() => {
    const clusters = Array.from(new Set(operationalEmployees.map(e => e.cluster).filter(Boolean)));
    return clusters.map(cluster => ({
      name: cluster || 'Sem Cluster',
      employees: operationalEmployees.filter(e => e.cluster === cluster).map(emp => {
        const empVacations = vacationSchedules.filter(s => s.employee_id === emp.id);
        if (empVacations.length === 0) return { ...emp, vacations: [] };

        // Group into ranges (consecutive days)
        const ranges: any[] = [];
        if (empVacations.length > 0) {
          const sorted = [...empVacations].sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
          let currentRange: any = null;

          sorted.forEach(s => {
            const day = parseInt(s.schedule_date.split('-')[2]);
            const status = s.status || 'approved';

            if (!currentRange || day !== currentRange.start + currentRange.duration || status !== currentRange.type) {
              if (currentRange) ranges.push(currentRange);
              currentRange = {
                employeeId: emp.id,
                employeeName: emp.full_name,
                startDate: s.schedule_date,
                endDate: s.schedule_date,
                start: day,
                duration: 1,
                type: status,
                label: status === 'planned' ? 'Planejado' : status === 'pending' ? 'Pendente' : 'Férias'
              };
            } else {
              currentRange.duration++;
              currentRange.endDate = s.schedule_date;
            }
          });
          if (currentRange) ranges.push(currentRange);
        }

        return { ...emp, vacations: ranges };
      })
    })).filter(s => s.employees.length > 0);
  }, [employees, vacationSchedules]);

  const vacationStats = useMemo(() => {
    const uniqueEmps = new Set();
    let totalPeriods = 0;

    squadData.forEach(squad => {
      squad.employees.forEach(emp => {
        if (emp.vacations && emp.vacations.length > 0) {
          uniqueEmps.add(emp.id);
          totalPeriods += emp.vacations.length;
        }
      });
    });

    return {
      empCount: uniqueEmps.size,
      periodCount: totalPeriods
    };
  }, [squadData]);

  const handleSaveVacation = async (data: any) => {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const schedules: any[] = [];

      let current = new Date(start);
      while (current <= end) {
        schedules.push({
          employee_id: data.employeeId,
          schedule_date: current.toISOString().split('T')[0],
          shift_type: 'FÉRIAS',
          status: data.status,
          notes: 'Lançamento de férias'
        });
        current.setDate(current.getDate() + 1);
      }

      await saveSchedulesBulk(schedules);
      fetchVacations();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving vacation:', error);
      alert('Erro ao salvar férias.');
    }
  };

  const handleApproveVacation = async (vacation: any) => {
    try {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      const schedules: any[] = [];

      let current = new Date(start);
      while (current <= end) {
        schedules.push({
          employee_id: vacation.employeeId,
          schedule_date: current.toISOString().split('T')[0],
          shift_type: 'FÉRIAS',
          status: 'approved',
          notes: 'Férias aprovadas pelo gestor'
        });
        current.setDate(current.getDate() + 1);
      }

      await saveSchedulesBulk(schedules);
      fetchVacations();
      setEditingVacation(null);
    } catch (error) {
      console.error('Error approving vacation:', error);
      alert('Erro ao aprovar férias.');
    }
  };

  const handleDeleteVacation = async (vacation: any) => {
    if (!confirm('Tem certeza que deseja remover este período de férias?')) return;
    try {
      await deleteSchedulesByRange(vacation.employeeId, vacation.startDate, vacation.endDate);
      fetchVacations();
      setEditingVacation(null);
    } catch (error) {
      console.error('Error deleting vacation:', error);
      alert('Erro ao excluir férias.');
    }
  };

  return (
    <div className="h-full bg-background-light dark:bg-background-dark overflow-hidden flex flex-col font-inter">
      <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black dark:text-white flex items-center gap-3 uppercase tracking-tight">
            <span className="material-symbols-outlined text-primary text-3xl">beach_access</span>
            Planejamento de Férias
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Sincronizado com Supabase Database.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span> Cadastrar Férias
        </button>
      </div>

      <div className="px-8 mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Colabs em Férias"
          value={vacationStats.empCount.toString()}
          subValue={`${vacationStats.periodCount} Períodos`}
          icon="umbrella"
          progress={Math.round((vacationStats.empCount / (operationalEmployees.length || 1)) * 100)}
          progressColor="bg-primary"
        />
        <StatCard label="Ativos no Período" value={operationalEmployees.length.toString()} subValue="Headcount Total" icon="group" progress={100} progressColor="bg-emerald-500" />
      </div>

      <div className="flex-1 overflow-hidden p-8 pt-0 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-background-dark/30 flex justify-between items-center">
            <MonthPicker currentDate={currentMonth} onChange={onMonthChange} />
            <div className="flex gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">Dias do Mês</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div style={{ minWidth: (daysInMonth.length * 50 + 240) + 'px' }}>
              <div className="grid grid-cols-[240px_1fr] border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-20">
                <div className="p-5 border-r border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Colaborador</div>
                <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
                  {daysInMonth.map(d => (
                    <div key={d.num} className="w-[50px] p-3 text-center flex flex-col items-center justify-center shrink-0">
                      <span className="text-[11px] font-black dark:text-white leading-none">{d.num}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{d.weekday}</span>
                    </div>
                  ))}
                </div>
              </div>

              {squadData.map((squad, sIdx) => (
                <div key={sIdx} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                  <div className="bg-slate-50/50 dark:bg-primary/5 p-4 px-6 border-b border-slate-100 dark:border-slate-800/50">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{squad.name}</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {squad.employees.map(emp => (
                      <GanttRow
                        key={emp.id}
                        {...emp}
                        daysCount={daysInMonth.length}
                        onEdit={(v: any) => setEditingVacation(v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 p-2">
            <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-2xl">info</span>
            </div>
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Status do Período</h2>
          </div>
          <div className="p-6 bg-white dark:bg-[#1c232d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Os dados exibidos são extraídos em tempo real da tabela de escalas do Supabase filtrando pelo tipo 'vacation'.</p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <VacationRegistrationModal
          employees={operationalEmployees}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveVacation}
        />
      )}

      {editingVacation && (
        <VacationDetailsModal
          vacation={editingVacation}
          onClose={() => setEditingVacation(null)}
          onApprove={() => handleApproveVacation(editingVacation)}
          onDelete={() => handleDeleteVacation(editingVacation)}
        />
      )}
    </div>
  );
};

const VacationDetailsModal = ({ vacation, onClose, onApprove, onDelete }: any) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">{vacation.employeeName}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detalhes do Período</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Período</span>
            <span className="dark:text-white font-black">{new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Total de Dias</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black">{vacation.duration} Dias</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Status Atual</span>
            <span className="font-black uppercase tracking-widest opacity-80">{vacation.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {vacation.type !== 'approved' && (
            <button
              onClick={onApprove}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">verified</span> Aprovar Férias
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">delete</span> Excluir Registro
          </button>
          <button
            onClick={onClose}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const GanttRow = ({ name, role, vacations, id, daysCount, onEdit }: any) => {
  const typeMap: any = {
    approved: 'bg-primary shadow-lg shadow-primary/30 text-white',
    planned: 'bg-[#a855f7] shadow-lg shadow-purple-900/40 text-white',
    pending: 'bg-[#2d3b4b] text-slate-400'
  };

  return (
    <div className="grid grid-cols-[240px_1fr] hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-all group">
      <div className="p-5 border-r border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
          {name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-[11px] font-black dark:text-white uppercase truncate tracking-tight">{name}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{role}</p>
        </div>
      </div>
      <div className="flex items-center h-20 relative overflow-hidden" style={{ width: (daysCount * 50) + 'px' }}>
        {vacations.map((v: any, idx: number) => (
          <div
            key={idx}
            onClick={() => onEdit(v)}
            className={`h-10 rounded-2xl z-10 flex items-center justify-center px-4 transition-all hover:brightness-110 hover:scale-[1.02] cursor-pointer absolute ${typeMap[v.type]}`}
            style={{
              left: ((v.start - 1) * 50 + 10) + 'px',
              width: (v.duration * 50 - 20) + 'px'
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-widest truncate">
              {v.label} ({v.duration} Dias)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon, progress, progressColor }: any) => (
  <div className="bg-white dark:bg-[#1c232d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <span className="material-symbols-outlined text-slate-400">{icon}</span>
    </div>
    <div className="flex items-baseline gap-2 mb-1">
      <h3 className="text-2xl font-black dark:text-white leading-none">{value}</h3>
    </div>
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs font-black uppercase tracking-tight dark:text-white">{subValue}</span>
    </div>
    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);
