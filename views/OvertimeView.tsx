import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useEmployees } from '../context/EmployeeContext';
import { isOperationalRole } from '../utils/roleUtils';

export const OvertimeView: React.FC = () => {
  const { employees, rawData, importBankData, formatBalance, loading } = useEmployees();
  const operationalEmployees = useMemo(() => employees.filter(e => isOperationalRole(e.role)), [employees]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'extract'>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array', cellDates: true, raw: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (!data || data.length === 0) {
          alert("O arquivo parece estar vazio ou não possui dados legíveis.");
          // Reset input para permitir reimportação
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        importBankData(data as any[][]);
        // Reset input após importação bem-sucedida
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error("Erro na importação:", err);
        alert("Erro ao importar o arquivo. Verifique o console.");
        // Reset input em caso de erro
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredEmployees = useMemo(() => {
    return operationalEmployees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cluster.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [operationalEmployees, searchTerm]);

  const totalPositive = operationalEmployees
    .filter(e => e.bankBalance > 0)
    .reduce((acc, curr) => acc + curr.bankBalance, 0);

  const totalNegative = operationalEmployees
    .filter(e => e.bankBalance < 0)
    .reduce((acc, curr) => acc + curr.bankBalance, 0);

  const totalExpiring = operationalEmployees.reduce((acc, curr) => acc + (curr.expiringHours || 0), 0);
  const expiringCount = operationalEmployees.filter(e => (e.expiringHours || 0) > 0).length;

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8 custom-scrollbar space-y-8 bg-slate-50 dark:bg-background-dark font-inter">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight dark:text-white mb-2">Banco de Horas</h2>
            <p className="text-slate-500 text-sm">Gestão centralizada de saldos e compensações via Supabase.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all font-inter disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              {loading ? 'Processando...' : 'Importar Extrato'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Saldo Total Positivo" value={formatBalance(totalPositive)} trend="+2.5%" trendDir="up" color="emerald" icon="trending_up" />
          <StatCard label="Saldo Total Negativo" value={formatBalance(totalNegative)} trend="-5%" trendDir="down" color="orange" icon="trending_down" />
          <StatCard
            label="Créditos a Vencer"
            value={formatBalance(totalExpiring)}
            trend={`${expiringCount} pessoas`}
            trendDir={expiringCount > 0 ? "danger" : "up"}
            color="rose"
            icon="event_busy"
            subText="Expiração em menos de 30 dias"
          />
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50 dark:bg-background-dark/30">
            <div className="flex gap-6">
              <button
                onClick={() => setViewMode('summary')}
                className={`text-sm font-black uppercase tracking-widest border-b-2 transition-all pb-2 ${viewMode === 'summary' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
              >
                Resumo Colaboradores
              </button>
              <button
                onClick={() => setViewMode('extract')}
                className={`text-sm font-black uppercase tracking-widest border-b-2 transition-all pb-2 ${viewMode === 'extract' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
              >
                Extrato Bruto
              </button>
            </div>

            <div className="flex-1 max-w-md relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Buscar por nome ou cluster..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {viewMode === 'summary' ? (
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Cluster</th>
                    <th className="px-6 py-4 text-right">Saldo Atual</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                  {loading && operationalEmployees.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Carregando dados do Supabase...</td></tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registro encontrado.</td></tr>
                  ) : filteredEmployees.map(emp => (
                    <OvertimeRow
                      key={emp.id}
                      id={emp.id}
                      name={emp.name}
                      cluster={emp.cluster}
                      coordinator={emp.coordinator}
                      value={formatBalance(emp.bankBalance)}
                      status={emp.bankBalance < -14400 * 3600 ? 'critical' : emp.bankBalance > 7200 * 3600 ? 'warning' : 'healthy'}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Matrícula</th>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs">
                  {rawData.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">Nenhum dado bruto importado recentemente.</td></tr>
                  ) : rawData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono opacity-60">#{row['MATRICULA'] || row['ID'] || '-'}</td>
                      <td className="px-6 py-3 font-bold dark:text-white uppercase">{row['NOME'] || '-'}</td>
                      <td className="px-6 py-3 text-slate-500 italic">{row['DESCRICAO'] || row['HISTORICO'] || '-'}</td>
                      <td className="px-6 py-3 text-right font-black dark:text-white">{row['SALDO'] || row['VALOR'] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, trendDir, color, icon, subText }: any) => {
  const colorStyles: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
  };
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
          <h3 className="text-3xl font-black dark:text-white tabular-nums tracking-tighter">{value.replace('h', '')}<span className="text-sm opacity-40 ml-1">H</span></h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorStyles[color]}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trendDir === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </span>
        {subText && <p className="text-[10px] text-slate-500 font-medium italic">{subText}</p>}
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-8xl">{icon}</span>
      </div>
    </div>
  );
};

const OvertimeRow = ({ id, name, cluster, value, status }: any) => {
  const statusMap: any = {
    critical: { label: 'Risco Crítico', style: 'bg-red-500/10 text-red-500 border-red-500/20' },
    warning: { label: 'Alerta', style: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    healthy: { label: 'Regular', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 font-bold border border-slate-200 dark:border-slate-600">
            <span className="material-symbols-outlined text-xl">account_circle</span>
          </div>
          <div>
            <p className="font-black dark:text-white text-sm uppercase tracking-tight">{name}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: #{id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">{cluster}</span>
      </td>
      <td className={`px-6 py-5 text-right font-black text-lg tabular-nums ${value.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
        {value}
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-center">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-[0.1em] ${statusMap[status]?.style || ''}`}>
            {statusMap[status]?.label}
          </span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <button className="text-slate-300 hover:text-primary transition-colors hover:scale-110 active:scale-90"><span className="material-symbols-outlined">analytics</span></button>
      </td>
    </tr>
  );
};
