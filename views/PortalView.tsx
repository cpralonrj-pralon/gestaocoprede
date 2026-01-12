
import React from 'react';

export const PortalView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-10 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight dark:text-white">Olá, Mariana!</h1>
            <p className="text-slate-500 text-lg">Aqui está o resumo da sua jornada e pendências de hoje.</p>
          </div>
          <div className="flex gap-3">
            <button className="h-10 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Solicitar Férias</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <PortalStat label="Banco de Horas" value="+12:30" icon="schedule" highlight="+2h hoje" color="blue" />
              <PortalStat label="Férias" value="15 dias" icon="beach_access" highlight="Disponíveis" color="purple" />
              <PortalStat label="Dias Úteis" value="18/22" icon="calendar_month" highlight="Outubro" color="orange" />
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-8">
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_calendar</span> Minha Escala (5x2)
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black uppercase text-slate-400 pb-2">{day}</div>
                ))}
                {Array.from({length: 5}).map((_, i) => (
                  <div key={i} className={`h-24 p-3 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${i === 2 ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-background-dark/50 border-slate-100 dark:border-slate-800'}`}>
                    <span className={`text-sm font-bold ${i === 2 ? 'text-white' : 'dark:text-slate-300'}`}>{i + 1}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${i === 2 ? 'text-white/80' : 'text-primary'}`}>09:00 - 18:00</span>
                  </div>
                ))}
                <div className="h-24 p-3 rounded-2xl border border-transparent flex flex-col justify-between bg-slate-100 dark:bg-background-dark/20 opacity-40">
                  <span className="text-sm font-bold text-slate-400">6</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">Folga</span>
                </div>
                <div className="h-24 p-3 rounded-2xl border border-transparent flex flex-col justify-between bg-slate-100 dark:bg-background-dark/20 opacity-40">
                  <span className="text-sm font-bold text-slate-400">7</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">Folga</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/30 flex justify-between items-center">
                <h3 className="font-bold text-sm">Avisos da Gestão</h3>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 Novos</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <NoticeItem sender="RH Oficial" time="10:45" msg="Lembrete: Prazo para assinatura do ponto encerra hoje." />
                <NoticeItem sender="Sistema" time="Ontem" msg="Manutenção programada no portal dia 15/10." />
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-lg">Último Feedback</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Avaliação Mensal</span>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-emerald-500/20">Excelente</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed italic">"Mariana demonstrou excelente proatividade no projeto Delta. Atingiu 110% da meta mensal."</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span className="material-symbols-outlined text-sm">person</span> Por: Carlos Silva (Gestor)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortalStat = ({ label, value, icon, highlight, color }: any) => {
  const colorMap: any = {
    blue: 'text-primary bg-primary/10',
    purple: 'text-purple-500 bg-purple-500/10',
    orange: 'text-orange-500 bg-orange-500/10'
  };
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm group hover:shadow-xl transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}><span className="material-symbols-outlined">{icon}</span></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <div>
        <h3 className="text-3xl font-black dark:text-white leading-none tracking-tight">{value}</h3>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${colorMap[color].split(' ')[0]}`}>{highlight}</p>
      </div>
    </div>
  );
};

const NoticeItem = ({ sender, time, msg }: any) => (
  <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
    <div className="flex justify-between items-start mb-1">
      <span className="text-[10px] font-black uppercase text-slate-400">{sender}</span>
      <span className="text-[10px] text-slate-400">{time}</span>
    </div>
    <p className="text-sm font-bold dark:text-slate-200 group-hover:text-primary transition-colors leading-snug">{msg}</p>
  </div>
);
