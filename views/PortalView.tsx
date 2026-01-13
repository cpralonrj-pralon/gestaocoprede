import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployeeFeedbacks } from '../services/supabase/feedback';
import { getEmployeeSchedules, saveSchedulesBulk } from '../services/supabase/schedules';
import { PortalVacationModal } from '../components/PortalVacationModal';

export const PortalView: React.FC = () => {
  const { userProfile, loading: loadingAuth } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [allVacations, setAllVacations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [currentMonth] = useState(new Date());

  const currentUser = userProfile;

  const formatBalance = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '+';
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}h`;
  };

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoadingData(true);
    try {
      const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const lastOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const [fb, sc, allSc] = await Promise.all([
        getEmployeeFeedbacks(currentUser.id),
        getEmployeeSchedules(currentUser.id, firstOfMonth, lastOfMonth),
        getEmployeeSchedules(currentUser.id, '2024-01-01', '2026-12-31')
      ]);

      setFeedbacks(fb);
      setSchedules(sc);
      setAllVacations(allSc.filter(s => s.shift_type === 'FÉRIAS' || s.shift_type === 'vacation'));
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [currentUser?.id, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latestFeedback = useMemo(() => feedbacks[0], [feedbacks]);

  // Map schedules to a more readable format for the calendar
  const scheduleMap = useMemo(() => {
    const map: Record<number, any> = {};
    schedules.forEach(s => {
      const day = new Date(s.schedule_date + 'T00:00:00').getDate();
      map[day] = s;
    });
    return map;
  }, [schedules]);

  const vacationNotices = useMemo(() => {
    const notices: any[] = [];

    // Group individual days into logical vacation periods
    const sorted = [...allVacations].sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
    const ranges: any[] = [];
    let currentRange: any = null;

    sorted.forEach(s => {
      const dateStr = s.schedule_date;
      const status = s.status || 'approved';
      const date = new Date(dateStr + 'T00:00:00');

      if (!currentRange || date.getTime() > new Date(currentRange.end + 'T00:00:00').getTime() + 86400000 || status !== currentRange.status) {
        if (currentRange) ranges.push(currentRange);
        currentRange = { start: dateStr, end: dateStr, status, count: 1 };
      } else {
        currentRange.end = dateStr;
        currentRange.count++;
      }
    });
    if (currentRange) ranges.push(currentRange);

    // Convert ranges to notices
    ranges.slice(-3).reverse().forEach(r => {
      const startLabel = new Date(r.start + 'T00:00:00').toLocaleDateString();
      const endLabel = new Date(r.end + 'T00:00:00').toLocaleDateString();
      if (r.status === 'pending') {
        notices.push({
          sender: 'SISTEMA DE ESCALAS',
          time: 'Agora',
          msg: `Solicitação de férias aguardando aprovação: ${startLabel} a ${endLabel} (${r.count} dias).`,
          urgent: true
        });
      } else if (r.status === 'approved') {
        notices.push({
          sender: 'RECURSOS HUMANOS',
          time: 'Recente',
          msg: `Suas férias foram APROVADAS! Período: ${startLabel} a ${endLabel}. Aproveite seu descanso!`,
          urgent: false
        });
      }
    });

    return notices;
  }, [allVacations]);

  const accumulatedVacation = useMemo(() => {
    if (!currentUser?.admission_date) return '15 Dias'; // Fallback

    const admission = new Date(currentUser.admission_date);
    const today = new Date();

    // Calculate months of tenure
    const months = (today.getFullYear() - admission.getFullYear()) * 12 + (today.getMonth() - admission.getMonth());

    // standard 2.5 days per month (30 per year)
    const earned = months * 2.5;

    // subtract already taken vacations (approved only)
    const taken = allVacations.filter(v => v.status === 'approved').length;

    const balance = Math.max(0, Math.floor(earned - taken));
    return `${balance} Dias`;
  }, [currentUser, allVacations]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  const startOffset = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const day = date.getDay(); // 0 is Sunday
    return day === 0 ? 6 : day - 1; // Map to 0=Seg, 1=Ter...
  }, [currentMonth]);

  const handleSaveVacation = async (data: { startDate: string; endDate: string }) => {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const bulkSchedules: any[] = [];

      let current = new Date(start);
      while (current <= end) {
        bulkSchedules.push({
          employee_id: currentUser.id,
          schedule_date: current.toISOString().split('T')[0],
          shift_type: 'FÉRIAS',
          status: 'pending',
          notes: 'Solicitado via Portal do Colaborador'
        });
        current.setDate(current.getDate() + 1);
      }

      await saveSchedulesBulk(bulkSchedules);
      await fetchData();
      setIsVacationModalOpen(false);
      alert('Sua solicitação de férias foi enviada com sucesso!');
    } catch (error) {
      console.error('Error requesting vacation:', error);
      alert('Erro ao solicitar férias. Tente novamente.');
    }
  };

  if (loadingAuth || loadingData) return (
    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-background-dark">
      <div className="flex flex-col items-center gap-6">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Sincronizando sua Identidade Digital...</p>
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-background-dark">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-slate-300">person_off</span>
        <p className="text-slate-500 font-bold">Nenhum colaborador encontrado para o portal.</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-10 custom-scrollbar bg-slate-50 dark:bg-background-dark font-inter">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-white dark:bg-surface-dark p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-3xl overflow-hidden border-2 border-primary/20 p-1">
                <img src={currentUser.photo_url || `https://picsum.photos/seed/${currentUser.id}/200/200`} className="size-full object-cover rounded-2xl" alt="Profile" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight dark:text-white uppercase leading-none">Olá, {currentUser.full_name?.split(' ')[0]}!</h1>
                <p className="text-slate-500 text-lg font-medium mt-2">{currentUser.role} • Área {currentUser.cluster || 'Geral'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsVacationModalOpen(true)}
              className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined">beach_access</span> Solicitar Férias
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <PortalStat label="Banco de Horas" value={formatBalance(currentUser.current_hours_balance || 0)} icon="history" highlight={(currentUser.current_hours_balance || 0) < 0 ? "Compensar Horas" : "Saldo Livre"} color={(currentUser.current_hours_balance || 0) < 0 ? "red" : "blue"} />
              <PortalStat label="Férias Acumuladas" value={accumulatedVacation} icon="event_repeat" highlight={`Desde ${new Date(currentUser.admission_date || '').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`} color="purple" />
              <PortalStat label="Feedbacks" value={feedbacks.length.toString()} icon="reviews" highlight="Sessões Realizadas" color="orange" />
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                  <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span> Minha Escala de Trabalho
                </h3>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-[11px] font-black uppercase text-slate-400 pb-4 tracking-widest">{day}</div>
                ))}

                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-32 opacity-0" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const sched = scheduleMap[day];
                  const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();

                  return (
                    <div key={i} className={`h-32 p-5 rounded-[2rem] border flex flex-col justify-between transition-all hover:scale-[1.08] hover:shadow-2xl hover:z-10 cursor-pointer group ${isToday ? 'bg-primary border-primary shadow-2xl shadow-primary/20 text-white' : (sched ? 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800' : 'bg-slate-100/30 dark:bg-slate-900/10 border-transparent opacity-40')}`}>
                      <span className={`text-sm font-black ${isToday ? 'text-white' : 'dark:text-slate-300'}`}>{day}</span>
                      <div className="flex flex-col gap-1">
                        {sched ? (
                          <>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-white/80' : 'text-primary'}`}>
                              {['FOLGA', 'off', 'FB'].includes(sched.shift_type) ? 'Folga' :
                                (sched.shift_type === 'vacation' || sched.shift_type === 'FÉRIAS') ? 'Férias' :
                                  (sched.shift_type || 'Plantão')}
                            </span>
                            <span className={`text-[8px] font-bold uppercase truncate ${isToday ? 'text-white/60' : 'text-slate-400'}`}>
                              {sched.status === 'pending' ? 'Solicitado' :
                                ['FÉRIAS', 'vacation', 'FB', 'FOLGA', 'off'].includes(sched.shift_type) ? 'Indisponível' : 'Escala'}
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 italic">Sem escala</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm flex flex-col">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-background-dark/30 flex justify-between items-center">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Avisos Recentes</h3>
                {vacationNotices.some(n => n.urgent) && (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-rose-500/20">Urgente</span>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {vacationNotices.length > 0 ? (
                  vacationNotices.map((notice, idx) => (
                    <NoticeItem key={idx} {...notice} />
                  ))
                ) : (
                  <>
                    <NoticeItem sender="Recursos Humanos" time="10:45" msg="Lembrete: Assine seu cartão de ponto até amanhã às 18h." />
                    <NoticeItem sender="Gestão de TI" time="Ontem" msg="Nova atualização do sistema de chamados disponível." />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm space-y-8 group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-lg uppercase tracking-tight dark:text-white">Último Feedback</h3>
                <span className="material-symbols-outlined text-emerald-500">verified</span>
              </div>

              {latestFeedback ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Nota Global</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-emerald-500/20">
                      {latestFeedback.overall_rating || 'Excelente'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destaques:</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic font-medium">"{latestFeedback.strengths || 'Resumo de performance não disponível.'}"</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><span className="material-symbols-outlined text-xl">person</span></div>
                    Feedback nº {feedbacks.length}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4 opacity-50">
                  <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
                  <p className="text-xs font-bold text-slate-400 italic">Nenhum feedback registrado para o período.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isVacationModalOpen && (
        <PortalVacationModal
          employeeName={currentUser.full_name || ''}
          onClose={() => setIsVacationModalOpen(false)}
          onSave={handleSaveVacation}
        />
      )}
    </div>
  );
};

const PortalStat = ({ label, value, icon, highlight, color }: any) => {
  const colorMap: any = {
    blue: 'text-primary bg-primary/10',
    purple: 'text-purple-500 bg-purple-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    red: 'text-rose-500 bg-rose-500/10'
  };
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-6 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500"><span className="material-symbols-outlined text-8xl">{icon}</span></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`p-4 rounded-[1.25rem] shadow-sm ${colorMap[color]}`}><span className="material-symbols-outlined text-3xl">{icon}</span></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors">{label}</span>
      </div>
      <div className="relative z-10">
        <h3 className="text-4xl font-black dark:text-white leading-none tracking-tighter">{value}</h3>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-6 bg-slate-50 dark:bg-surface-highlight w-fit px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 ${colorMap[color].split(' ')[0]}`}>{highlight}</p>
      </div>
    </div>
  );
};

const NoticeItem = ({ sender, time, msg, urgent }: any) => (
  <div className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
    <div className="flex justify-between items-start mb-3">
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${urgent ? 'text-rose-500' : 'text-slate-400'}`}>{sender}</span>
      <span className="text-[10px] text-slate-400 font-bold">{time}</span>
    </div>
    <p className="text-[15px] font-black dark:text-slate-200 group-hover:text-primary transition-colors leading-snug">{msg}</p>
  </div>
);
