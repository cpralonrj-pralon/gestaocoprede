import React, { useState } from 'react';

interface Props {
    onClose: () => void;
    onSave: (data: { startDate: string; endDate: string }) => void;
    employeeName: string;
}

export const PortalVacationModal: React.FC<Props> = ({ onClose, onSave, employeeName }) => {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 text-slate-900">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Solicitar Férias</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Olá, {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-90 transition-all">
                        <span className="material-symbols-outlined dark:text-white">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 mb-6">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-amber-500">info</span>
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed">
                                Sua solicitação será enviada para o gestor imediato. Você receberá um aviso no portal assim que for aprovada.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Data de Início</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold dark:text-white dark:placeholder-slate-500"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Data de Término</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold dark:text-white dark:placeholder-slate-500"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
