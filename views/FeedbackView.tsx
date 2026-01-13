import React, { useState, useCallback, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getAllFeedbacks, saveFeedback } from '../services/supabase/feedback';
import { useEmployees } from '../context/EmployeeContext';
import { isOperationalRole } from '../utils/roleUtils';

export const FeedbackView: React.FC = () => {
  const { employees } = useEmployees();
  const operationalEmployees = employees.filter(e => isOperationalRole(e.role));
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    strengths: '',
    improvements: '',
    goals: [],
    pdi: [],
    employee_id: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });
  const [sendEmail, setSendEmail] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const totalExpected = operationalEmployees.length;
  const completed = feedbacks.filter(f => operationalEmployees.some(e => e.id === f.employee_id)).length;
  const pending = Math.max(0, totalExpected - completed);
  const overdue = 0;

  const coordinators = [
    { name: 'Ana Souza', completed: 85, pending: 15 },
    { name: 'Carlos Lima', completed: 60, pending: 40 },
    { name: 'Beatriz M.', completed: 95, pending: 5 },
    { name: 'João Pedro', completed: 40, pending: 60 }
  ];

  const handleOpenModal = (feedback?: any) => {
    if (feedback) {
      setSelectedFeedback(feedback);
      setFormData({
        ...feedback,
        goals: feedback.metadata?.goals || [],
        pdi: feedback.metadata?.pdi || []
      });
    } else {
      setSelectedFeedback(null);
      setFormData({
        strengths: '',
        improvements: '',
        goals: [],
        pdi: [],
        employee_id: '',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear()
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
    setFormData({
      strengths: '',
      improvements: '',
      goals: [],
      pdi: [],
      employee_id: '',
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear()
    });
    setSendEmail(false);
  };

  const handleAddGoal = () => {
    const newGoal = { id: Date.now().toString(), text: '', completed: false };
    setFormData((prev: any) => ({
      ...prev,
      goals: [...(prev.goals || []), newGoal]
    }));
  };

  const handleAddPDI = () => {
    const newPDI = { id: Date.now().toString(), action: '', deadline: '' };
    setFormData((prev: any) => ({
      ...prev,
      pdi: [...(prev.pdi || []), newPDI]
    }));
  };

  const handleImproveWithAI = async (field: 'strengths' | 'improvements', currentText: string) => {
    if (!currentText.trim()) {
      alert('⚠️ Por favor, escreva algo primeiro para que a IA possa melhorar o texto.');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        alert('⚠️ Configure VITE_GEMINI_API_KEY para usar a IA.');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = field === 'strengths'
        ? `Você é um especialista em RH e feedback corporativo. Melhore o seguinte texto sobre PONTOS FORTES de um colaborador, tornando-o mais profissional, específico e construtivo... Texto original: ${currentText}`
        : `Você é um especialista em RH e feedback corporativo. Melhore o seguinte texto sobre PONTOS DE MELHORIA de um colaborador... Texto original: ${currentText}`;

      const result = await model.generateContent(prompt);
      const improvedText = result.response.text().trim();

      setFormData((prev: any) => ({
        ...prev,
        [field]: improvedText
      }));

      alert('✨ Texto melhorado com IA!');
    } catch (error: any) {
      console.error('Erro ao melhorar texto:', error);
      alert('⚠️ Erro ao melhorar texto.');
    }
  };

  const handleGenerateEmailPreview = async () => {
    if (!formData.strengths && !formData.improvements && (!formData.goals || formData.goals.length === 0)) {
      alert('⚠️ Preencha pelo menos um campo para gerar uma prévia do e-mail.');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        alert('⚠️ Configure VITE_GEMINI_API_KEY para usar a IA.');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const employee = employees.find(e => e.id === formData.employee_id);
      const prompt = `Crie um e-mail profissional de feedback para ${employee?.name || '[Nome]'}... Strengths: ${formData.strengths}... Improvements: ${formData.improvements}`;

      const result = await model.generateContent(prompt);
      const emailPreview = result.response.text().trim();

      alert(`✨ Prévia do E-mail Gerada pela IA:\n\n${emailPreview}`);
    } catch (error: any) {
      console.error('Erro ao gerar prévia:', error);
      alert('⚠️ Erro ao gerar prévia.');
    }
  };

  const handleSaveFeedback = async () => {
    if (!formData.employee_id) {
      alert('Selecione um colaborador.');
      return;
    }
    try {
      const feedbackToSave = {
        id: selectedFeedback?.id,
        employee_id: formData.employee_id,
        period_month: formData.period_month,
        period_year: formData.period_year,
        strengths: formData.strengths,
        improvements: formData.improvements,
        status: 'sent' as const,
        metadata: {
          goals: formData.goals,
          pdi: formData.pdi
        }
      };

      await saveFeedback(feedbackToSave);

      if (sendEmail) {
        const employee = employees.find(e => e.id === formData.employee_id);
        if (employee) {
          const emailSubject = `Feedback Mensal - ${employee.name}`;
          const mailtoLink = `mailto:${employee.email}?subject=${encodeURIComponent(emailSubject)}&body=Feedback...`;
          window.location.href = mailtoLink;
        }
      }

      setNotification({ msg: 'Feedback salvo com sucesso!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      fetchFeedbacks();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Erro ao salvar feedback.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'pending':
        return 'text-amber-500 bg-amber-500/10';
      case 'overdue':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'Concluído';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      default:
        return status;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-primary border-primary-light text-white'}`}>
          <span className="material-symbols-outlined">{notification.type === 'success' ? 'check_circle' : 'info'}</span>
          <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black dark:text-white">Gestão de Feedbacks Mensais</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Novo Feedback
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Esperado" value={totalExpected.toString()} icon="groups" subtitle="Colaboradores ativos" />
          <StatCard label="Realizados" value={completed.toString()} icon="check_circle" color="text-emerald-500" />
          <StatCard label="Pendentes" value={pending.toString()} icon="schedule" color="text-amber-500" />
          <StatCard label="Atrasados" value={overdue.toString()} icon="warning" color="text-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Adesão por Coordenador</h3>
            <div className="space-y-6">
              {coordinators.map((coord) => (
                <div key={coord.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold dark:text-slate-300">
                    <span>{coord.name}</span>
                    <span>{coord.completed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${coord.completed}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Status</h3>
            <div className="h-[200px] w-full relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Concluído', value: completed, color: '#10b981' },
                      { name: 'Pendente', value: pending, color: '#f59e0b' },
                      { name: 'Atrasado', value: overdue, color: '#ef4444' }
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {[
                      { color: '#10b981' },
                      { color: '#f59e0b' },
                      { color: '#ef4444' }
                    ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black dark:text-white">{totalExpected}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold dark:text-white">Feedbacks da Equipe</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-background-dark/50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {feedbacks.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {f.employees?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{f.employees?.full_name}</p>
                        <p className="text-xs text-slate-500">{f.employees?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(f.status)}`}>
                      {getStatusText(f.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(f)} className="text-primary font-bold text-xs hover:underline">
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">{selectedFeedback ? 'Ver Feedback' : 'Novo Feedback'}</h2>
              <button onClick={handleCloseModal} className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {!selectedFeedback && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Colaborador</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, employee_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {operationalEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pontos Fortes</label>
                  <button onClick={() => handleImproveWithAI('strengths', formData.strengths || '')} className="text-xs text-primary font-bold hover:underline">Melhorar com IA</button>
                </div>
                <textarea
                  value={formData.strengths || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, strengths: e.target.value }))}
                  rows={3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pontos de Melhoria</label>
                  <button onClick={() => handleImproveWithAI('improvements', formData.improvements || '')} className="text-xs text-primary font-bold hover:underline">Melhorar com IA</button>
                </div>
                <textarea
                  value={formData.improvements || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, improvements: e.target.value }))}
                  rows={3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Metas</label>
                  <button onClick={handleAddGoal} className="text-primary text-xs font-bold hover:underline">+ Meta</button>
                </div>
                <div className="space-y-2">
                  {(formData.goals || []).map((goal: any, index: number) => (
                    <div key={goal.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={goal.completed} onChange={(e) => {
                        const newGoals = [...(formData.goals || [])];
                        newGoals[index].completed = e.target.checked;
                        setFormData((prev: any) => ({ ...prev, goals: newGoals }));
                      }} />
                      <input type="text" value={goal.text} onChange={(e) => {
                        const newGoals = [...(formData.goals || [])];
                        newGoals[index].text = e.target.value;
                        setFormData((prev: any) => ({ ...prev, goals: newGoals }));
                      }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-background-dark dark:text-white" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={handleGenerateEmailPreview} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Prévia E-mail IA</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium dark:text-white">Enviar resumo por e-mail</span>
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-lg border font-bold">Cancelar</button>
              <button onClick={handleSaveFeedback} className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <h3 className={`text-3xl font-black ${color || 'dark:text-white'}`}>{value}</h3>
  </div>
);
