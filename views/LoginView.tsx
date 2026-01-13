
import React, { useState } from 'react';
import { supabase } from '../services/supabase/client';

export const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!email.toLowerCase().endsWith('@claro.com.br')) {
            setError('Por favor, use seu e-mail corporativo @claro.com.br');
            setLoading(false);
            return;
        }

        if (isResetting) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                setError(error.message);
            } else {
                setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
                setIsResetting(false);
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError('E-mail ou senha incorretos');
                } else {
                    setError(error.message);
                }
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10] relative overflow-hidden font-inter">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]"></div>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 space-y-10 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="size-20 bg-gradient-to-br from-primary to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary/20 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <span className="material-symbols-outlined text-white text-5xl font-black">shield_person</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                            {isResetting ? 'Recuperar' : 'Gestão CopRede'}
                        </h1>
                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                            {isResetting ? 'Redefina sua senha' : 'Sistema de Gestão COP REDE'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 transition-colors group-focus-within:text-primary">mail</span>
                                <input
                                    type="email"
                                    required
                                    placeholder="usuario@claro.com.br"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:ring-4 ring-primary/10 focus:border-primary transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isResetting && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsResetting(true)}
                                        className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline"
                                    >
                                        Esqueceu?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 transition-colors group-focus-within:text-primary">lock</span>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:ring-4 ring-primary/10 focus:border-primary transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                                <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{success}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span>{isResetting ? 'Enviar Link de Recuperação' : 'Entrar no Sistema'}</span>
                                    <span className="material-symbols-outlined">{isResetting ? 'send' : 'login'}</span>
                                </div>
                            )}
                        </button>
                    </form>

                    {isResetting && (
                        <div className="text-center pt-2">
                            <button
                                onClick={() => {
                                    setIsResetting(false);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="text-[10px] text-slate-400 hover:text-primary font-black uppercase tracking-[0.2em] transition-colors"
                            >
                                Voltar para o login
                            </button>
                        </div>
                    )}

                    <p className="text-center text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] pt-4">
                        Acesso restrito a colaboradores autorizados
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-3">
                <span>© 2026 Gestão CopRede Professional</span>
                <span className="size-1 bg-slate-700 rounded-full"></span>
                <span>Build with Gemini IA</span>
            </div>
        </div>
    );
};
