
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase, Employee } from '../services/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { getEmployeeByUserId } from '../services/supabase/employees';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: Employee | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const isLoadingProfile = useRef(false);
    const isMounted = useRef(true);

    const loadProfile = useCallback(async (userId: string) => {
        // Evitar chamadas duplicadas
        if (isLoadingProfile.current) {
            console.log('[AuthContext] loadProfile já em execução, ignorando...');
            return;
        }

        isLoadingProfile.current = true;

        try {
            console.log('[AuthContext] loadProfile - buscando perfil para:', userId);

            // Fazer a consulta diretamente aqui com timeout
            const timeoutPromise = new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), 10000);
            });

            const profilePromise = getEmployeeByUserId(userId);

            const profile = await Promise.race([profilePromise, timeoutPromise]);

            if (isMounted.current) {
                console.log('[AuthContext] loadProfile - perfil carregado:', profile?.full_name, profile?.role);
                setUserProfile(profile);
            }
        } catch (error: any) {
            // Ignorar AbortError
            if (error?.name !== 'AbortError') {
                console.error('[AuthContext] Erro ao carregar perfil:', error);
            }
            if (isMounted.current) {
                setUserProfile(null);
            }
        } finally {
            isLoadingProfile.current = false;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (session?.user) {
            await loadProfile(session.user.id);
        }
    }, [session, loadProfile]);

    useEffect(() => {
        isMounted.current = true;

        // Usar onAuthStateChange como fonte primária - é mais confiável
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, newSession: Session | null) => {
                console.log('[AuthContext] Auth state changed:', event, newSession?.user?.email);

                if (!isMounted.current) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    // Usar setTimeout para evitar problemas de timing com o Supabase
                    setTimeout(async () => {
                        if (isMounted.current) {
                            await loadProfile(newSession.user!.id);
                            setLoading(false);
                        }
                    }, 100);
                } else {
                    setUserProfile(null);
                    setLoading(false);
                }
            }
        );

        // Fallback: tentar obter sessão inicial após um delay
        const initialLoadTimeout = setTimeout(async () => {
            if (isMounted.current && loading) {
                try {
                    const { data: { session: initialSession } } = await supabase.auth.getSession();
                    console.log('[AuthContext] Fallback session check:', initialSession?.user?.email);

                    if (isMounted.current) {
                        if (initialSession?.user) {
                            setSession(initialSession);
                            setUser(initialSession.user);
                            await loadProfile(initialSession.user.id);
                        }
                        setLoading(false);
                    }
                } catch (err) {
                    console.log('[AuthContext] Fallback getSession error (ignorando):', err);
                    if (isMounted.current) {
                        setLoading(false);
                    }
                }
            }
        }, 1000);

        return () => {
            isMounted.current = false;
            clearTimeout(initialLoadTimeout);
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    const signOut = async () => {
        try {
            setSession(null);
            setUser(null);
            setUserProfile(null);
            localStorage.removeItem('gestao-cop-raw-bank');
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, userProfile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
