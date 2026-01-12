
import React from 'react';

export const CertificateView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight dark:text-white mb-2">Gestão de Atestados</h2>
            <p className="text-slate-500 text-sm">Monitoramento de ausências médicas e impacto operacional.</p>
          </div>
          <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span> Novo Registro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard label="Impacto Headcount" value="-5 HC" color="red" desc="Vendas e Suporte afetados" icon="group_off" />
          <KpiCard label="Saúde Operacional" value="92%" color="amber" desc="Status: Atenção Necessária" icon="ecg_heart" />
          <KpiCard label="Pendências" value="12" color="blue" desc="Prioridade de validação" icon="pending_actions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-background-dark/30">
              <h3 className="font-black dark:text-white uppercase tracking-widest text-xs text-slate-500">Registros Recentes</h3>
              <div className="flex gap-2">
                <button className="text-[10px] font-black uppercase text-primary hover:underline">Ver todos</button>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Período</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <CertificateRow name="João Silva" type="Médico" period="10/10 - 13/10" status="pending" />
                  <CertificateRow name="Maria Oliveira" type="Licença" period="01/09 - 30/12" status="approved" />
                  <CertificateRow name="Carlos Souza" type="Luto" period="12/10 - 14/10" status="pending" />
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center gap-4 group cursor-pointer hover:border-primary/50 transition-all">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <div>
                <h4 className="font-bold dark:text-white">Upload de Atestado</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Arraste seu PDF aqui ou clique para buscar no dispositivo.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/30 flex justify-between items-center">
                <span className="text-xs font-bold dark:text-white">Visualização Rápida</span>
                <span className="text-[10px] font-black text-slate-500">atestado_v2.pdf</span>
              </div>
              <div className="aspect-[4/3] bg-slate-100 dark:bg-background-dark/50 flex items-center justify-center group overflow-hidden relative">
                <img src="https://picsum.photos/seed/doc/400/300" className="size-full object-cover opacity-50 blur-[1px] group-hover:blur-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <button className="bg-white text-primary p-2 rounded-full shadow-xl"><span className="material-symbols-outlined">zoom_in</span></button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                <button className="py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800">Rejeitar</button>
                <button className="py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">Aprovar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, color, desc, icon }: any) => {
  const styles: any = {
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-primary bg-primary/10 border-primary/20',
  };
  return (
    <div className={`p-5 rounded-2xl border ${styles[color]} relative overflow-hidden group shadow-sm bg-white dark:bg-surface-dark`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-7xl">{icon}</span></div>
      <p className="text-xs font-black uppercase tracking-widest opacity-60">{label}</p>
      <div className="mt-2 flex flex-col gap-1">
        <h3 className="text-3xl font-black leading-none">{value}</h3>
        <p className="text-[10px] font-bold opacity-60 uppercase">{desc}</p>
      </div>
    </div>
  );
};

const CertificateRow = ({ name, type, period, status }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <p className="font-bold dark:text-white">{name}</p>
      </div>
    </td>
    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{type}</td>
    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{period}</td>
    <td className="px-6 py-4">
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
        {status === 'approved' ? 'Aprovado' : 'Pendente'}
      </span>
    </td>
  </tr>
);
