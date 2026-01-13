import React, { useState } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onPasswordChanged: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onPasswordChanged }) => {
    const { user, userProfile, refreshProfile } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'A senha deve ter pelo menos 8 caracteres';
        }
        if (!/[A-Z]/.test(password)) {
            return 'A senha deve ter pelo menos uma letra maiúscula';
        }
        if (!/[a-z]/.test(password)) {
            return 'A senha deve ter pelo menos uma letra minúscula';
        }
        if (!/[0-9]/.test(password)) {
            return 'A senha deve ter pelo menos um número';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validações
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        const validationError = validatePassword(newPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            // Atualizar senha no Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }

            // Atualizar flag must_change_password para false
            if (userProfile?.id) {
                const { error: dbError } = await supabase
                    .from('employees')
                    .update({ must_change_password: false })
                    .eq('id', userProfile.id);

                if (dbError) {
                    console.error('Erro ao atualizar flag:', dbError);
                }
            }

            // Recarregar perfil e notificar sucesso
            await refreshProfile();
            onPasswordChanged();
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar senha');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (): { strength: number; label: string; color: string } => {
        let strength = 0;
        if (newPassword.length >= 8) strength++;
        if (/[A-Z]/.test(newPassword)) strength++;
        if (/[a-z]/.test(newPassword)) strength++;
        if (/[0-9]/.test(newPassword)) strength++;
        if (/[^A-Za-z0-9]/.test(newPassword)) strength++;

        if (strength <= 2) return { strength, label: 'Fraca', color: 'bg-red-500' };
        if (strength <= 3) return { strength, label: 'Média', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength, label: 'Forte', color: 'bg-emerald-500' };
        return { strength, label: 'Muito Forte', color: 'bg-emerald-600' };
    };

    const { strength, label, color } = getPasswordStrength();

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-8 m-4 animate-in zoom-in duration-300">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight dark:text-white">Altere sua Senha</h2>
                    <p className="text-sm text-slate-500 mt-2">
                        Olá, <span className="font-bold text-primary">{userProfile?.full_name?.split(' ')[0] || user?.email}</span>!
                        <br />Por segurança, você deve criar uma nova senha.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nova Senha */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nova Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                                key
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite sua nova senha"
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-surface-highlight border-2 border-transparent focus:border-primary rounded-xl text-sm font-medium transition-all outline-none dark:text-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        {/* Password Strength */}
                        {newPassword && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${color} transition-all duration-300`}
                                        style={{ width: `${(strength / 5) * 100}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>{label}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirmar Senha */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                                lock
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme sua nova senha"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-surface-highlight border-2 border-transparent focus:border-primary rounded-xl text-sm font-medium transition-all outline-none dark:text-white"
                                required
                            />
                            {confirmPassword && newPassword === confirmPassword && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-emerald-500">
                                    check_circle
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Requisitos */}
                    <div className="bg-slate-50 dark:bg-surface-highlight rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Requisitos da Senha</p>
                        <RequirementItem met={newPassword.length >= 8} text="Mínimo 8 caracteres" />
                        <RequirementItem met={/[A-Z]/.test(newPassword)} text="Uma letra maiúscula" />
                        <RequirementItem met={/[a-z]/.test(newPassword)} text="Uma letra minúscula" />
                        <RequirementItem met={/[0-9]/.test(newPassword)} text="Um número" />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm font-medium flex items-center gap-3">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary hover:brightness-110 text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Alterando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                Confirmar Nova Senha
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? 'text-emerald-500' : 'text-slate-400'}`}>
        <span className="material-symbols-outlined text-sm">{met ? 'check_circle' : 'radio_button_unchecked'}</span>
        {text}
    </div>
);
