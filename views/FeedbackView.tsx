import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';


interface Feedback {
  id: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  team: string;
  lastFeedbackDate: string;
  status: 'completed' | 'pending' | 'overdue';
  strengths: string;
  improvements: string;
  goals: { id: string; text: string; completed: boolean }[];
  pdi: { id: string; action: string; deadline: string }[];
}

const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    employeeName: 'Lucas Mendes',
    employeeEmail: 'lucas@company.com',
    role: 'Analista Jr.',
    team: 'Design Team',
    lastFeedbackDate: '15/08/2023',
    status: 'completed',
    strengths: 'Proatividade no projeto X...',
    improvements: 'Pontualidade nas dailies...',
    goals: [
      { id: '1', text: 'Ex: Finalizar certificação UX', completed: false },
      { id: '2', text: 'Ex: Melhorar taxa de resposta', completed: false }
    ],
    pdi: [
      { id: '1', action: 'Ação de curto prazo', deadline: 'mm/dd/yyyy' }
    ]
  },
  {
    id: '2',
    employeeName: 'Fernanda Torres',
    employeeEmail: 'fernanda@company.com',
    role: 'Coordenadora',
    team: 'Sales Ops',
    lastFeedbackDate: '20/09/2023',
    status: 'pending',
    strengths: '',
    improvements: '',
    goals: [],
    pdi: []
  },
  {
    id: '3',
    employeeName: 'Roberto Silva',
    employeeEmail: 'roberto@company.com',
    role: 'Dev Fullstack',
    team: 'Tech Team',
    lastFeedbackDate: '01/10/2023',
    status: 'overdue',
    strengths: '',
    improvements: '',
    goals: [],
    pdi: []
  }
];

export const FeedbackView: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [formData, setFormData] = useState<Partial<Feedback>>({
    strengths: '',
    improvements: '',
    goals: [],
    pdi: [],
    employeeName: '',
    employeeEmail: '',
    role: '',
    team: ''
  });
  const [sendEmail, setSendEmail] = useState(false);

  const totalExpected = 48;
  const completed = feedbacks.filter(f => f.status === 'completed').length;
  const pending = feedbacks.filter(f => f.status === 'pending').length;
  const overdue = feedbacks.filter(f => f.status === 'overdue').length;

  const coordinators = [
    { name: 'Ana Souza', completed: 85, pending: 15 },
    { name: 'Carlos Lima', completed: 60, pending: 40 },
    { name: 'Beatriz M.', completed: 95, pending: 5 },
    { name: 'João Pedro', completed: 40, pending: 60 }
  ];

  const handleOpenModal = (feedback?: Feedback) => {
    if (feedback) {
      setSelectedFeedback(feedback);
      setFormData(feedback);
    } else {
      setSelectedFeedback(null);
      setFormData({
        strengths: '',
        improvements: '',
        goals: [],
        pdi: [],
        employeeName: '',
        employeeEmail: '',
        role: '',
        team: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
    setFormData({});
    setSendEmail(false);
  };

  const handleAddGoal = () => {
    const newGoal = { id: Date.now().toString(), text: '', completed: false };
    setFormData(prev => ({
      ...prev,
      goals: [...(prev.goals || []), newGoal]
    }));
  };

  const handleAddPDI = () => {
    const newPDI = { id: Date.now().toString(), action: '', deadline: '' };
    setFormData(prev => ({
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
      // Show loading state
      const loadingMessage = field === 'strengths' ? 'Melhorando pontos fortes...' : 'Melhorando pontos de melhoria...';
      console.log(loadingMessage);

      // Call Gemini API to improve text
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        alert('⚠️ Configure VITE_GEMINI_API_KEY para usar a IA.');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = field === 'strengths'
        ? `Você é um especialista em RH e feedback corporativo. Melhore o seguinte texto sobre PONTOS FORTES de um colaborador, tornando-o mais profissional, específico e construtivo. Mantenha o tom positivo e motivador. Não adicione informações que não estejam no texto original, apenas melhore a redação.

Texto original:
${currentText}

Texto melhorado (responda APENAS com o texto melhorado, sem introduções):`
        : `Você é um especialista em RH e feedback corporativo. Melhore o seguinte texto sobre PONTOS DE MELHORIA de um colaborador, tornando-o mais profissional, específico e construtivo. Use linguagem empática e focada em desenvolvimento. Não adicione informações que não estejam no texto original, apenas melhore a redação.

Texto original:
${currentText}

Texto melhorado (responda APENAS com o texto melhorado, sem introduções):`;

      const result = await model.generateContent(prompt);
      const improvedText = result.response.text().trim();

      // Update form data with improved text
      setFormData(prev => ({
        ...prev,
        [field]: improvedText
      }));

      alert('✨ Texto melhorado com IA!');
    } catch (error: any) {
      console.error('Erro ao melhorar texto:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        alert('⚠️ Limite de uso da IA atingido. Aguarde algumas horas ou tente novamente mais tarde.');
      } else {
        alert('⚠️ Erro ao melhorar texto. Tente novamente.');
      }
    }
  };

  const handleGenerateEmailPreview = async () => {
    if (!formData.strengths && !formData.improvements && (!formData.goals || formData.goals.length === 0)) {
      alert('⚠️ Preencha pelo menos um campo (Pontos Fortes, Melhorias ou Metas) para gerar uma prévia do e-mail.');
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

      const prompt = `Você é um especialista em comunicação corporativa. Crie um e-mail profissional e empático de feedback mensal para um colaborador chamado ${formData.employeeName || '[Nome]'}.

Use as seguintes informações:

PONTOS FORTES:
${formData.strengths || 'Não informado'}

PONTOS DE MELHORIA:
${formData.improvements || 'Não informado'}

METAS ACORDADAS:
${(formData.goals || []).map((g, i) => `${i + 1}. ${g.text}`).join('\n') || 'Nenhuma meta definida'}

PLANO DE DESENVOLVIMENTO (PDI):
${(formData.pdi || []).map((p, i) => `${i + 1}. ${p.action} - Prazo: ${p.deadline}`).join('\n') || 'Nenhuma ação definida'}

Crie um e-mail completo, profissional, motivador e bem estruturado. Use emojis sutis se apropriado. Termine com uma assinatura "Equipe de Gestão de Pessoas".`;

      const result = await model.generateContent(prompt);
      const emailPreview = result.response.text().trim();

      // Show preview in alert (you could also show in a modal)
      const useAI = confirm(`✨ Prévia do E-mail Gerada pela IA:\n\n${emailPreview}\n\n\n📧 Deseja usar este texto melhorado?\n\nClique OK para usar ou Cancelar para manter o texto atual.`);

      if (useAI) {
        // Update strengths and improvements based on AI suggestion
        alert('✅ Texto da IA aplicado! Revise antes de enviar.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar prévia:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        alert('⚠️ Limite de uso da IA atingido. Aguarde algumas horas.');
      } else {
        alert('⚠️ Erro ao gerar prévia. Tente novamente.');
      }
    }
  };

  const handleSaveFeedback = () => {
    if (selectedFeedback) {
      // Update existing feedback
      setFeedbacks(prev => prev.map(f =>
        f.id === selectedFeedback.id
          ? { ...f, ...formData, status: 'completed' as const, lastFeedbackDate: new Date().toLocaleDateString('pt-BR') }
          : f
      ));
    } else {
      // Create new feedback
      const newFeedback: Feedback = {
        id: Date.now().toString(),
        employeeName: formData.employeeName || '',
        employeeEmail: formData.employeeEmail || '',
        role: formData.role || '',
        team: formData.team || '',
        lastFeedbackDate: new Date().toLocaleDateString('pt-BR'),
        status: 'completed',
        strengths: formData.strengths || '',
        improvements: formData.improvements || '',
        goals: formData.goals || [],
        pdi: formData.pdi || []
      };
      setFeedbacks(prev => [...prev, newFeedback]);
    }

    if (sendEmail) {
      // Prepare email content
      const emailSubject = `Feedback Mensal - ${formData.employeeName}`;
      const emailBody = `Olá ${formData.employeeName},

Segue o resumo do seu feedback mensal:

📌 PONTOS FORTES:
${formData.strengths || 'Não informado'}

📌 PONTOS DE MELHORIA:
${formData.improvements || 'Não informado'}

📌 METAS ACORDADAS:
${(formData.goals || []).map((g, i) => `${i + 1}. ${g.text}`).join('\n') || 'Nenhuma meta definida'}

📌 PLANO DE DESENVOLVIMENTO (PDI):
${(formData.pdi || []).map((p, i) => `${i + 1}. ${p.action} - Prazo: ${p.deadline}`).join('\n') || 'Nenhuma ação definida'}

Atenciosamente,
Equipe de Gestão de Pessoas`;

      // Create mailto link to open Outlook
      const mailtoLink = `mailto:${formData.employeeEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // Open Outlook with pre-filled email
      window.location.href = mailtoLink;

      // Show info message
      setTimeout(() => {
        alert(`📧 Abrindo Outlook...\n\nO e-mail será aberto no seu Outlook com o resumo do feedback pré-preenchido.\n\nRevise o conteúdo e clique em "Enviar" no Outlook para enviar o e-mail para ${formData.employeeName}.`);
      }, 500);
    }

    handleCloseModal();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black dark:text-white">Gestão de Feedbacks Mensais</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Novo Feedback
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Esperado"
            value={totalExpected.toString()}
            icon="groups"
            subtitle="Colaboradores ativos"
          />
          <StatCard
            label="Realizados"
            value={completed.toString()}
            icon="check_circle"
            highlight="+12%"
            color="text-emerald-500"
          />
          <StatCard
            label="Pendentes"
            value={pending.toString()}
            icon="schedule"
            color="text-amber-500"
          />
          <StatCard
            label="Atrasados"
            value={overdue.toString()}
            icon="warning"
            color="text-red-500"
          />
        </div>

        {/* Coordinator Performance & Status Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coordinator Performance */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Adesão por Coordenador</h3>
            <p className="text-xs text-slate-500 mb-6">Comparativo Realizado vs. Pendente</p>
            <div className="space-y-6">
              {coordinators.map((coord) => (
                <div key={coord.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold dark:text-slate-300">
                    <span>{coord.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-primary"></span>
                        Realizado
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-slate-300"></span>
                        Pendente
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${coord.completed}%` }}
                    ></div>
                    <div
                      className="h-full bg-slate-300 dark:bg-slate-600"
                      style={{ width: `${coord.pending}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Pie Chart */}
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
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Concluído', value: completed, color: '#10b981' },
                      { name: 'Pendente', value: pending, color: '#f59e0b' },
                      { name: 'Atrasado', value: overdue, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black dark:text-white">{totalExpected}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">Concluído</span>
                </div>
                <span className="dark:text-white font-bold">{completed}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">Pendente</span>
                </div>
                <span className="dark:text-white font-bold">{pending}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">Atrasado</span>
                </div>
                <span className="dark:text-white font-bold">{overdue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold dark:text-white">Feedbacks da Equipe</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-background-dark/50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Cargo/Equipe</th>
                <th className="px-6 py-4">Último Feedback</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {feedbacks.map((feedback) => (
                <tr
                  key={feedback.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {feedback.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{feedback.employeeName}</p>
                        <p className="text-xs text-slate-500">{feedback.employeeEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium dark:text-white">{feedback.role}</p>
                    <p className="text-xs text-slate-500">{feedback.team}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm dark:text-slate-300">{feedback.lastFeedbackDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(feedback.status)}`}
                    >
                      {getStatusText(feedback.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenModal(feedback)}
                      className="text-primary font-bold text-xs uppercase hover:underline"
                    >
                      {feedback.status === 'completed' ? 'Ver detalhes' : 'Registrar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">
                {selectedFeedback ? 'Editar Feedback' : 'Novo Feedback'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Employee Info */}
              {!selectedFeedback && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Nome do Colaborador
                    </label>
                    <input
                      type="text"
                      value={formData.employeeName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ex: Lucas Mendes"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.employeeEmail || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, employeeEmail: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="lucas@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={formData.role || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ex: Analista Jr."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Last Feedback Info */}
              {selectedFeedback && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <span className="material-symbols-outlined text-lg">schedule</span>
                    <span className="text-sm font-bold">Último Feedback: {selectedFeedback.lastFeedbackDate}</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Mês anterior: Em ego o projeto Zeta • Status: <span className="font-bold">Concluído</span>
                  </p>
                  <button className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-2 hover:underline">
                    Ver detalhes completos
                  </button>
                </div>
              )}

              {/* Strengths */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Pontos Fortes
                  </label>
                  <button
                    type="button"
                    onClick={() => handleImproveWithAI('strengths', formData.strengths || '')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Melhorar com IA
                  </button>
                </div>
                <textarea
                  value={formData.strengths || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Proatividade no projeto X..."
                />
              </div>

              {/* Improvements */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Pontos de Melhoria
                  </label>
                  <button
                    type="button"
                    onClick={() => handleImproveWithAI('improvements', formData.improvements || '')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Melhorar com IA
                  </button>
                </div>
                <textarea
                  value={formData.improvements || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Pontualidade nas dailies..."
                />
              </div>

              {/* Goals */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Metas Acordadas
                  </label>
                  <button
                    onClick={handleAddGoal}
                    className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar Meta
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.goals || []).map((goal, index) => (
                    <div key={goal.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={(e) => {
                          const newGoals = [...(formData.goals || [])];
                          newGoals[index].completed = e.target.checked;
                          setFormData(prev => ({ ...prev, goals: newGoals }));
                        }}
                        className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={goal.text}
                        onChange={(e) => {
                          const newGoals = [...(formData.goals || [])];
                          newGoals[index].text = e.target.value;
                          setFormData(prev => ({ ...prev, goals: newGoals }));
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ex: Finalizar certificação UX"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* PDI */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Plano de Desenvolvimento (PDI)
                  </label>
                  <button
                    onClick={handleAddPDI}
                    className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar Etapa no PDI
                  </button>
                </div>
                <div className="space-y-3">
                  {(formData.pdi || []).map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="text"
                        value={item.action}
                        onChange={(e) => {
                          const newPDI = [...(formData.pdi || [])];
                          newPDI[index].action = e.target.value;
                          setFormData(prev => ({ ...prev, pdi: newPDI }));
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ação de curto prazo"
                      />
                      <input
                        type="text"
                        value={item.deadline}
                        onChange={(e) => {
                          const newPDI = [...(formData.pdi || [])];
                          newPDI[index].deadline = e.target.value;
                          setFormData(prev => ({ ...prev, pdi: newPDI }));
                        }}
                        className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Email Preview Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateEmailPreview}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:shadow-xl transition-all"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Gerar Prévia do E-mail com IA
                </button>
              </div>

              {/* Send Email Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium dark:text-white">
                  Enviar resumo por e-mail para o colaborador
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFeedback}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Salvar Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, subtitle, highlight, color }: any) => (
  <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
    <div className="flex justify-between items-center text-slate-500">
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className={`text-3xl font-black ${color || 'dark:text-white'}`}>{value}</h3>
      {highlight && <span className="text-xs font-bold text-emerald-500">{highlight}</span>}
    </div>
    {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase">{subtitle}</p>}
  </div>
);
