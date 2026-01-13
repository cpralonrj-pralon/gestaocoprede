import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  activeModule: string;
  setActiveModule: (module: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, activeModule, setActiveModule, searchQuery, setSearchQuery }) => {
  const { signOut, user, userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTitle = () => {
    switch (activeModule) {
      case 'dashboard': return 'Visão Geral da Operação';
      case 'hierarchy': return 'Estrutura Organizacional';
      case 'ai-insights': return 'AI Command Center';
      case 'feedbacks': return 'Gestão de Feedbacks';
      case 'schedules': return 'Escala Operacional';
      case 'vacations': return 'Planejamento de Férias';
      case 'profile': return 'Perfil do Colaborador';
      case 'overtime': return 'Banco de Horas';
      case 'certificates': return 'Gestão de Atestados';
      case 'portal': return 'Portal do Colaborador';
      default: return 'Painel PeopleOps';
    }
  };

  const notifications = [
    { id: 1, title: 'Risco Crítico: Banco de Horas', time: '10 min atrás', type: 'critical' },
    { id: 2, title: 'Padrão de Absenteísmo Detectado', time: '2h atrás', type: 'warning' },
    { id: 3, title: '5 Feedbacks Pendentes', time: '5h atrás', type: 'info' },
  ];

  const handleMenuClick = (action: string) => {
    setShowProfileMenu(false);
    if (action === 'profile') {
      setActiveModule('profile');
    } else if (action === 'settings') {
      alert('Configurações de sistema em desenvolvimento.');
    } else if (action === 'privacy') {
      alert('Controles de privacidade em desenvolvimento.');
    } else if (action === 'logout') {
      signOut();
    }
  };

  return (
    <header className="flex-shrink-0 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex items-center justify-between px-8 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-xl font-black leading-tight tracking-tight">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar dados ou pessoas..."
            className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-surface-highlight border border-transparent focus:border-primary/30 rounded-lg text-sm w-64 focus:ring-4 focus:ring-primary/5 dark:text-white transition-all outline-none"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg relative transition-all ${showNotifications ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-highlight'}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-black text-sm dark:text-white">Alertas Inteligentes</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-surface-highlight cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <p className={`text-xs font-bold ${n.type === 'critical' ? 'text-red-500' : n.type === 'warning' ? 'text-orange-500' : 'text-primary'}`}>{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 cursor-pointer group transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none group-hover:text-primary transition-colors capitalize">{userProfile?.full_name?.toLowerCase() || user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{userProfile?.role || 'Visitante'}</p>
            </div>
            <div
              className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border-2 border-transparent group-hover:border-primary/50 transition-all shadow-sm"
              style={{ backgroundImage: `url(${userProfile?.photo_url || 'https://i.pravatar.cc/150?u=carlos'})` }}
            />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200">
              <MenuButton icon="person" label="Meu Perfil" onClick={() => handleMenuClick('profile')} />
              <MenuButton icon="settings" label="Configurações" onClick={() => handleMenuClick('settings')} />
              <MenuButton icon="shield_person" label="Privacidade" onClick={() => handleMenuClick('privacy')} />
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <MenuButton icon="logout" label="Sair do Sistema" color="text-red-500" onClick={() => handleMenuClick('logout')} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const MenuButton = ({ icon, label, onClick, color = "text-slate-700 dark:text-slate-200" }: any) => (
  <button onClick={onClick} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-surface-highlight transition-colors text-left group">
    <span className={`material-symbols-outlined text-xl ${color} opacity-70 group-hover:opacity-100`}>{icon}</span>
    <span className={`text-sm font-bold ${color}`}>{label}</span>
  </button>
);
