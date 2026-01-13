
import React from 'react';
import { ModuleId } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  isOpen: boolean;
  toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen }) => {
  const { userProfile, signOut } = useAuth();

  const allMenuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'hierarchy', icon: 'account_tree', label: 'Hierarquia', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'schedules', icon: 'schedule', label: 'Escalas', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'vacations', icon: 'beach_access', label: 'Férias', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'overtime', icon: 'hourglass_empty', label: 'Banco de Horas', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'feedbacks', icon: 'rate_review', label: 'Feedbacks', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'certificates', icon: 'description', label: 'Atestados', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
    { id: 'profile', icon: 'person', label: 'Perfil Colaborador', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR', 'COLABORADOR', 'ANALISTA', 'TECNICO'] },
    { id: 'portal', icon: 'account_circle', label: 'Portal Colaborador', roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR', 'COLABORADOR', 'ANALISTA', 'TECNICO'] },
    { id: 'ai-insights', icon: 'auto_awesome', label: 'IA Command Center', highlight: true, roles: ['ADMIN', 'GESTOR', 'COORDENADOR', 'SUPERVISOR'] },
  ];

  const userRole = userProfile?.role?.toUpperCase() || 'ADMIN'; // Default to ADMIN if no profile (for global owners)

  const menuItems = allMenuItems.filter(item => {
    if (userRole === 'ADMIN') return true;
    return item.roles.includes(userRole) ||
      (userRole.includes('COORDENADOR') && item.roles.includes('GESTOR')) ||
      (userRole.includes('SUPERVISOR') && item.roles.includes('GESTOR')) ||
      (['ANALISTA', 'TECNICO', 'COLABORADOR'].some(r => userRole.includes(r)) && item.roles.includes('COLABORADOR'));
  });

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-[#111418] flex flex-col transition-all duration-300 z-50`}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white">grid_view</span>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <h1 className="font-bold text-lg leading-tight dark:text-white">PeopleOps</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise v2.4</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 custom-scrollbar overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id as ModuleId)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${activeModule === item.id
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : item.highlight
                ? 'text-primary hover:bg-primary/10'
                : 'text-slate-600 dark:text-[#9dabb9] hover:bg-slate-100 dark:hover:bg-[#283039]'
              }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${activeModule === item.id ? '' : 'group-hover:scale-110 transition-transform'}`}>
              {item.icon}
            </span>
            {isOpen && <span className={`text-sm ${activeModule === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div
          onClick={() => signOut()}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
          <div
            className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-primary/20"
            style={{ backgroundImage: `url(${userProfile?.photo_url || `https://picsum.photos/seed/${userProfile?.id || 'admin'}/200/200`})` }}
          />
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white capitalize">{userProfile?.full_name?.toLowerCase() || 'Admin Global'}</p>
              <p className="text-xs text-slate-500 truncate group-hover:text-red-400 transition-colors uppercase font-black tracking-tighter">Sair do Sistema</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
