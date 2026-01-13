
import React, { useState, useCallback, useEffect } from 'react';
import { getAllCertificates, saveCertificate } from '../services/supabase/certificates';
import { useEmployees } from '../context/EmployeeContext';
import { isOperationalRole } from '../utils/roleUtils';

export const CertificateView: React.FC = () => {
  const { employees } = useEmployees();
  const operationalEmployees = employees.filter(e => isOperationalRole(e.role));
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    certificate_name: '',
    issue_date: '',
    expiry_date: '',
    status: 'pending' as 'valid' | 'expired' | 'pending'
  });

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCertificates();
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleSave = async () => {
    if (!formData.employee_id || !formData.certificate_name) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    try {
      await saveCertificate(formData);
      await fetchCertificates();
      // Reset form data após salvar
      setFormData({
        employee_id: '',
        certificate_name: '',
        issue_date: '',
        expiry_date: '',
        status: 'pending'
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error saving certificate:', error);
      alert('Erro ao salvar atestado.');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight dark:text-white mb-2">Gestão de Atestados</h2>
            <p className="text-slate-500 text-sm">Monitoramento de ausências médicas e impacto operacional.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all font-inter"
          >
            <span className="material-symbols-outlined text-[20px]">add</span> Novo Registro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard label="Impacto Headcount" value={`-${certificates.filter(c => c.status === 'pending' && operationalEmployees.some(e => e.id === c.employee_id)).length} HC`} color="red" desc="Atestados pendentes" icon="group_off" />
          <KpiCard label="Total Registros" value={certificates.filter(c => operationalEmployees.some(e => e.id === c.employee_id)).length.toString()} color="amber" desc="Mês atual" icon="ecg_heart" />
          <KpiCard label="Pendências" value={certificates.filter(c => c.status === 'pending' && operationalEmployees.some(e => e.id === c.employee_id)).length.toString()} color="blue" desc="Prioridade de validação" icon="pending_actions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-inter">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-background-dark/30">
              <h3 className="font-black dark:text-white uppercase tracking-widest text-xs text-slate-500">Registros Recentes</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 font-inter">
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Tipo/Nome</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-inter">
                  {certificates.map((cert) => (
                    <CertificateRow
                      key={cert.id}
                      name={cert.employees?.full_name || 'Desconhecido'}
                      type={cert.certificate_name}
                      period={cert.expiry_date || 'N/A'}
                      status={cert.status}
                    />
                  ))}
                  {certificates.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">Nenhum atestado registrado.</td>
                    </tr>
                  )}
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
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 relative overflow-hidden border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-black dark:text-white">Novo Registro</h3>
            <div className="space-y-4 font-inter">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Colaborador</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="">Selecione...</option>
                  {operationalEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Nome/Tipo do Atestado</label>
                <input
                  type="text"
                  value={formData.certificate_name}
                  onChange={(e) => setFormData({ ...formData, certificate_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="Ex: Atestado Médico - Gripe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Data de Emissão</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="pending">Pendente</option>
                  <option value="valid">Válido</option>
                  <option value="expired">Expirado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-surface-highlight font-black text-sm transition-all hover:bg-slate-200">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 transition-all hover:brightness-110">Salvar</button>
            </div>
          </div>
        </div>
      )}
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
    <div className={`p-5 rounded-2xl border ${styles[color]} relative overflow-hidden group shadow-sm bg-white dark:bg-surface-dark font-inter`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-7xl">{icon}</span></div>
      <p className="text-xs font-black uppercase tracking-widest opacity-60 font-inter">{label}</p>
      <div className="mt-2 flex flex-col gap-1">
        <h3 className="text-3xl font-black leading-none font-inter">{value}</h3>
        <p className="text-[10px] font-bold opacity-60 uppercase font-inter">{desc}</p>
      </div>
    </div>
  );
};

const CertificateRow = ({ name, type, period, status }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-inter">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-[10px]">{name.charAt(0)}</div>
        <p className="font-bold dark:text-white text-sm">{name}</p>
      </div>
    </td>
    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{type}</td>
    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{period}</td>
    <td className="px-6 py-4">
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'valid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
        {status === 'valid' ? 'Válido' : (status === 'expired' ? 'Expirado' : 'Pendente')}
      </span>
    </td>
  </tr>
);
