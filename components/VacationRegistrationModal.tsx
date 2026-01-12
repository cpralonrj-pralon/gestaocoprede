import React, { useState } from 'react';

interface Props {
    onClose: () => void;
    onSave: (data: any) => void;
    employees: any[];
}

export const VacationRegistrationModal: React.FC<Props> = ({ onClose, onSave, employees }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        startDate: '',
        endDate: '',
        status: 'planned'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Cadastrar Férias</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Planejamento Estratégico</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-90 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Colaborador</label>
                        <select
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/50"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        >
                            <option value="">Selecione um colaborador</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Início</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Término</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Status do Planejamento</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'approved', label: 'Confirmado', color: 'bg-primary' },
                                { id: 'planned', label: 'Planejado', color: 'bg-purple-500' },
                                { id: 'pending', label: 'Pendente', color: 'bg-slate-500' }
                            ].map(st => (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: st.id })}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.status === st.id ? 'border-primary bg-primary/5' : 'border-transparent bg-slate-50 dark:bg-slate-900'}`}
                                >
                                    <div className={`size-3 rounded-full ${st.color}`} />
                                    <span className="text-[9px] font-black uppercase">{st.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                    >
                        Salvar Planejamento
                    </button>
                </form>
            </div>
        </div>
    );
};
