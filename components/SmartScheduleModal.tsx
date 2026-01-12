import React, { useState, useEffect } from 'react';
import { generateSmartSchedule } from '../services/gemini';

interface Props {
    onClose: () => void;
    onApply: (alocacoes: any) => void;
    employees: any[];
    initialMonth: Date;
}

export const SmartScheduleModal: React.FC<Props> = ({ onClose, onApply, employees, initialMonth }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [config, setConfig] = useState({
        mes_ano: initialMonth.toISOString().slice(0, 7),
        feriados: [
            { data: "2026-02-16", tipo: "nacional", nome: "Carnaval" },
            { data: "2026-02-17", tipo: "nacional", nome: "Carnaval" }
        ],
        alvo_cobertura: 0.85,
        politicas: {
            max_dias_consecutivos: 6,
            dsr_pre_weekend: true,
            com_semana_posterior_feriado: true
        }
    });

    useEffect(() => {
        setConfig(prevConfig => ({
            ...prevConfig,
            mes_ano: initialMonth.toISOString().slice(0, 7)
        }));
    }, [initialMonth]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Calculate number of days in the selected month
            const [year, month] = config.mes_ano.split('-').map(Number);
            const numDays = new Date(year, month, 0).getDate();

            const input = {
                ...config,
                num_dias_mes: numDays,
                colaboradores: employees.map(e => ({
                    id: e.id,
                    nome: e.name,
                    funcao: e.role,
                    jornada: "5x2",
                    carga_semanal: 44,
                    disponibilidade: [],
                    saldo_banco_horas: 0
                })),
                turnos: [
                    { id: "M", inicio: "07:00", fim: "15:00", min_pessoas: Math.ceil((employees.length || 1) * config.alvo_cobertura), alvo_cobertura_pct: config.alvo_cobertura }
                ]
            };

            const aiResult = await generateSmartSchedule(input);
            if (!aiResult) {
                setError("Ocorreu um erro ao gerar a escala. Verifique a chave da API ou se o modelo está habilitado no seu console do Google AI.");
            } else {
                setResult(aiResult);
            }
        } catch (err: any) {
            console.error("AI Error Details:", err);
            const msg = err.message || "";
            if (msg.includes("404") || msg.includes("not found")) {
                setError("Modelo gemini-1.5-flash não encontrado. Verifique se sua chave da API tem permissão para este modelo ou se sua região é suportada.");
            } else if (msg.includes("403") || msg.includes("API_KEY_INVALID")) {
                setError("Chave de API Inválida. Revise o arquivo .env.local.");
            } else {
                setError("Erro na IA: " + (msg || "Erro inesperado."));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <span className="material-symbols-outlined animate-bounce">auto_awesome</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cérebro WFM</span>
                        </div>
                        <h2 className="text-2xl font-black dark:text-white">Geração de Escala Inteligente</h2>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-90 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* Left: Configuration */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">settings</span> Parâmetros Base
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Mês de Referência</label>
                                        <input
                                            type="month"
                                            value={config.mes_ano}
                                            onChange={(e) => setConfig({ ...config, mes_ano: e.target.value })}
                                            className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 p-0"
                                        />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Alvo Cobertura</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range" min="0.5" max="1" step="0.05"
                                                value={config.alvo_cobertura}
                                                onChange={(e) => setConfig({ ...config, alvo_cobertura: parseFloat(e.target.value) })}
                                                className="flex-1 accent-primary"
                                            />
                                            <span className="text-sm font-black">{(config.alvo_cobertura * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">gavel</span> Políticas e CLT
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'dsr_pre_weekend', label: 'DSR preferencial no Fim de Semana', icon: 'event_busy' },
                                        { key: 'com_semana_posterior_feriado', label: 'Folga Compensatória (COM) pós-feriado', icon: 'restore' },
                                        { key: 'max_dias_consecutivos', label: 'Máximo de 6 dias seguidos de trabalho', icon: 'security', toggle: false },
                                    ].map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-slate-400">{p.icon}</span>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{p.label}</span>
                                            </div>
                                            {p.toggle !== false ? (
                                                <div
                                                    onClick={() => setConfig({ ...config, politicas: { ...config.politicas, [p.key]: !((config.politicas as any)[p.key]) } })}
                                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${(config.politicas as any)[p.key] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${(config.politicas as any)[p.key] ? 'left-6' : 'left-1'}`} />
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-primary px-2 py-1 bg-primary/10 rounded">OBRIGATÓRIO</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-slate-900 dark:bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all overflow-hidden relative group"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">bolt</span>
                                        Gerar Proposta Estratégica
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right: Results / Alerts */}
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px]">
                            {error && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-red-500">
                                    <span className="material-symbols-outlined text-5xl mb-4">error</span>
                                    <h4 className="text-sm font-black uppercase mb-2">Falha na Geração</h4>
                                    <p className="text-xs italic max-w-xs">{error}</p>
                                    <button
                                        onClick={handleGenerate}
                                        className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-slate-300 transition-all"
                                    >
                                        Tentar Novamente
                                    </button>
                                </div>
                            )}

                            {!result && !loading && !error && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                    <div className="size-20 bg-slate-200 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <span className="material-symbols-outlined text-4xl">pending_actions</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase mb-2">Aguardando Parâmetros</h4>
                                    <p className="text-xs text-slate-500 italic max-w-xs">Configure os turnos e políticas para iniciar o cálculo da escala otimizada.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
                                    <div className="relative">
                                        <div className="size-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-3xl text-primary animate-pulse">psychology</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase">Otimizando Alocação...</h4>
                                    <p className="text-[10px] text-slate-500 animate-pulse tracking-widest uppercase font-black">Validando DSRs e COMs</p>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-500 text-sm">fact_check</span> Relatório de Geração
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cobertura Média</p>
                                            <p className="text-lg font-black text-emerald-500">{result.metricas.cobertura_media}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Riscos Legais</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{result.metricas.riscos_clt}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alertas Legais</p>
                                        {result.alertas_legais.map((a: any, i: number) => (
                                            <div key={i} className="flex gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border-l-4 border-amber-400 shadow-sm items-start">
                                                <span className="material-symbols-outlined text-[16px] text-amber-500 mt-0.5">warning</span>
                                                <div>
                                                    <p className="text-[9px] font-black dark:text-white uppercase">{a.colab}</p>
                                                    <p className="text-[10px] text-slate-500 leading-tight">{a.aviso}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => onApply(result.alocacoes)}
                                        className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">verified</span> Aplicar Escala Gerada
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
