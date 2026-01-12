
import React from 'react';

interface EmployeeProfileProps {
  employee: {
    id: string;
    name: string;
    role: string;
    img: string;
    cluster?: string;
    address?: string;
    city?: string;
    uf?: string;
    whatsapp?: string;
    login?: string;
    level?: string;
    perf?: number;
    stats?: any;
    absenteeism?: string;
    timeBank?: string;
    accuracy?: string;
    sla?: string;
    productivity?: string;
    history?: any[];
  } | null;
  onClose?: () => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileProps> = ({ employee, onClose }) => {
  if (!employee) return null;

  const roleLower = employee.role.toLowerCase();
  const isManagement = roleLower.includes('diretor') || roleLower.includes('coord');
  const isAnalyst = roleLower.includes('analista');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-background-dark outline-none">
      {/* Header with Close for Sidebar */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Perfil do Colaborador</h2>
        {onClose && (
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Main Info */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`size-24 rounded-2xl border-4 ${employee.perf && employee.perf > 90 ? 'border-emerald-500/20' : 'border-slate-100 dark:border-slate-800'} p-1`}>
              <img src={employee.img} className="size-full rounded-xl object-cover" alt={employee.name} />
            </div>
            <div className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-white dark:border-background-dark ${employee.perf && employee.perf > 90 ? 'bg-emerald-500' : 'bg-primary'}`}></div>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{employee.name}</h1>
            <p className="text-sm text-primary font-bold">{employee.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black border border-slate-200 dark:border-slate-700 uppercase">ID: {employee.id}</span>
              {employee.login && (
                <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[9px] font-black border border-primary/10 uppercase">Login: {employee.login}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Grid (Behavioral Metrics) */}
        {!isManagement && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <span className="material-symbols-outlined text-sm">event_busy</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Absenteísmo</span>
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{employee.absenteeism || '1.2%'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Banco Horas</span>
              </div>
              <p className={`text-lg font-black ${employee.timeBank?.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                {employee.timeBank || '+12h'}
              </p>
            </div>
          </div>
        )}

        {/* Operational Metrics (Analyst only) */}
        {isAnalyst && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Indicadores de Qualidade</h3>
            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 rounded-2xl p-5 border border-primary/10 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Acurácia COP</p>
                  <p className="text-2xl font-black">{employee.accuracy || '98.5%'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Médio</p>
                  <p className="text-xl font-black text-slate-700 dark:text-slate-300">{employee.sla || '14min'}</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-[0_0_8px_rgba(19,127,236,0.3)]" style={{ width: employee.accuracy || '98%' }}></div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                <span>Produtividade: {employee.productivity || '112%'}</span>
                <span className="flex items-center gap-1 text-emerald-500"><span className="material-symbols-outlined text-xs">trending_up</span> Meta Batida</span>
              </div>
            </div>
          </div>
        )}

        {/* Details List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dados de Registro</h3>
          <div className="space-y-3">
            <DetailItem icon="hub" label="Cluster" value={employee.cluster || 'Geral'} />
            <DetailItem icon="location_on" label="Endereço" value={employee.address || 'Não informado'} />
            <DetailItem icon="phone" label="Contato" value={employee.whatsapp || 'WhatsApp'} />
          </div>
        </div>

        {/* History / Timeline */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Histórico e Feedbacks</h3>
          <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
            <TimelineEvent
              date="05 Jan, 2024"
              title="Feedback Positivo"
              desc="Agilidade exemplar no tratamento de chamados de alta prioridade."
              type="sentiment_satisfied"
              aiTag="Elogio"
            />
            <TimelineEvent
              date="12 Out, 2023"
              title="Ajuste Operacional"
              desc="Transferido para o Cluster Leste para reforço técnico."
              type="sync_alt"
            />
          </div>
        </div>
      </div>

      {/* Footer Button */}
      {employee.whatsapp && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
            <span className="material-symbols-outlined">chat</span> Chamar no WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value }: any) => (
  <div className="flex items-start gap-3">
    <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">{icon}</span>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  </div>
);

const TimelineEvent = ({ date, title, desc, type, aiTag }: any) => (
  <div className="relative">
    <div className="absolute -left-[25px] top-0 size-5 rounded-full bg-white dark:bg-background-dark border-2 border-primary flex items-center justify-center text-primary z-10">
      <span className="material-symbols-outlined text-[12px]">{type}</span>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
        {aiTag && (
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            {aiTag}
          </span>
        )}
      </div>
      <h4 className="text-xs font-black dark:text-white leading-tight">{title}</h4>
      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);
