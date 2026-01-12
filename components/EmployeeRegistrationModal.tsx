
import React, { useState } from 'react';

interface EmployeeRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: any) => void;
    managers: { id: string, name: string }[];
}

export const EmployeeRegistrationModal: React.FC<EmployeeRegistrationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    managers
}) => {
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        login: '',
        photo: 'https://picsum.photos/seed/' + Math.random() + '/200/200',
        address: '',
        city: '',
        uf: '',
        whatsapp: '',
        role: 'Técnico de Campo',
        cluster: 'Norte',
        admissionDate: new Date().toISOString().split('T')[0],
        shift: 'Comercial (8h-18h)',
        managerId: managers[0]?.id || 'root'
    });

    const [newCargo, setNewCargo] = useState('');
    const [newCluster, setNewCluster] = useState('');
    const [newShift, setNewShift] = useState('');

    const [isAddingCargo, setIsAddingCargo] = useState(false);
    const [isAddingCluster, setIsAddingCluster] = useState(false);
    const [isAddingShift, setIsAddingShift] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            role: isAddingCargo ? newCargo : formData.role,
            cluster: isAddingCluster ? newCluster : formData.cluster,
            shift: isAddingShift ? newShift : formData.shift,
        };
        onSave(finalData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 to-purple-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">person_add</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Novo Colaborador</h3>
                                <p className="text-xs text-slate-500 font-medium">Cadastro dinâmico com reatribuição IA</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all text-slate-400">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Section: Identificação */}
                        <div className="md:col-span-2">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">1. Identificação e Acesso</h4>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="Ex: Roberto Carlos Silva"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Login do Sistema</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="Ex: roberto.silva"
                                value={formData.login}
                                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Matrícula (ID)</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="Ex: #12345"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                            <input
                                type="tel"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="(00) 00000-0000"
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                        </div>

                        {/* Section: Localização */}
                        <div className="md:col-span-2 mt-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">2. Localização</h4>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Endereço Completo</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="Rua, Número, Bairro, Complemento"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cidade</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                placeholder="Ex: São Paulo"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">UF</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                value={formData.uf}
                                onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                <option value="SP">SP</option>
                                <option value="RJ">RJ</option>
                                <option value="MG">MG</option>
                                <option value="ES">ES</option>
                            </select>
                        </div>

                        {/* Section: Operacional e Hierarquia */}
                        <div className="md:col-span-2 mt-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">3. Vínculo e Perfil Operacional</h4>
                        </div>

                        {/* CARGO DYNAMIC FIELD */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                value={isAddingCargo ? "NEW" : formData.role}
                                onChange={(e) => {
                                    if (e.target.value === "NEW") {
                                        setIsAddingCargo(true);
                                    } else {
                                        setIsAddingCargo(false);
                                        setFormData({ ...formData, role: e.target.value });
                                    }
                                }}
                            >
                                <option value="Diretor de Operações">Diretor de Operações</option>
                                <option value="Coordenador II">Coordenador II</option>
                                <option value="Coordenador I">Coordenador I</option>
                                <option value="Técnico de Campo">Técnico de Campo</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Analista">Analista</option>
                                <option value="NEW">+ Adicionar Novo Cargo...</option>
                            </select>
                            {isAddingCargo && (
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nome do novo cargo"
                                    className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 text-sm animate-in slide-in-from-top-2"
                                    value={newCargo}
                                    onChange={(e) => setNewCargo(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Gestor Direto</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all font-bold text-primary"
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            >
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* CLUSTER DYNAMIC FIELD */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cluster</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                value={isAddingCluster ? "NEW" : formData.cluster}
                                onChange={(e) => {
                                    if (e.target.value === "NEW") {
                                        setIsAddingCluster(true);
                                    } else {
                                        setIsAddingCluster(false);
                                        setFormData({ ...formData, cluster: e.target.value });
                                    }
                                }}
                            >
                                <option value="Norte">Norte</option>
                                <option value="Sul">Sul</option>
                                <option value="Leste">Leste</option>
                                <option value="Oeste">Oeste</option>
                                <option value="NEW">+ Adicionar Novo Cluster...</option>
                            </select>
                            {isAddingCluster && (
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nome do novo cluster"
                                    className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 text-sm animate-in slide-in-from-top-2"
                                    value={newCluster}
                                    onChange={(e) => setNewCluster(e.target.value)}
                                />
                            )}
                        </div>

                        {/* ESCALA DYNAMIC FIELD */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Escala</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-surface-highlight border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 ring-primary transition-all"
                                value={isAddingShift ? "NEW" : formData.shift}
                                onChange={(e) => {
                                    if (e.target.value === "NEW") {
                                        setIsAddingShift(true);
                                    } else {
                                        setIsAddingShift(false);
                                        setFormData({ ...formData, shift: e.target.value });
                                    }
                                }}
                            >
                                <option value="Comercial (8h-18h)">Comercial (8h-18h)</option>
                                <option value="Turno A (6h-14h)">Turno A (6h-14h)</option>
                                <option value="Turno B (14h-22h)">Turno B (14h-22h)</option>
                                <option value="NEW">+ Adicionar Nova Escala...</option>
                            </select>
                            {isAddingShift && (
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Detalhes da nova escala"
                                    className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 text-sm animate-in slide-in-from-top-2"
                                    value={newShift}
                                    onChange={(e) => setNewShift(e.target.value)}
                                />
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-12 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-black text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                        >
                            Salvar Colaborador
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
