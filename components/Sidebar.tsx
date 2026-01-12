
import React from 'react';
import { ModuleId } from '../types';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  isOpen: boolean;
  toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'hierarchy', icon: 'account_tree', label: 'Hierarquia' },
    { id: 'schedules', icon: 'schedule', label: 'Escalas' },
    { id: 'vacations', icon: 'beach_access', label: 'Férias' },
    { id: 'overtime', icon: 'hourglass_empty', label: 'Banco de Horas' },
    { id: 'feedbacks', icon: 'rate_review', label: 'Feedbacks' },
    { id: 'certificates', icon: 'description', label: 'Atestados' },
    { id: 'profile', icon: 'person', label: 'Perfil Colaborador' },
    { id: 'portal', icon: 'account_circle', label: 'Portal Colaborador' },
    { id: 'ai-insights', icon: 'auto_awesome', label: 'IA Command Center', highlight: true },
  ];

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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
              activeModule === item.id
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
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <div 
            className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-primary/20"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA72gOGa0IQ0QeS4ldwvHgCNZaP2nvFp8Nx36OIp_Ol-LQLoLNrmd16Mwh2ZfTnhlT586G7MQ0UwpfGMFn_P1HF2t99aouPChxi6qy9GrODbLFPnQFKOONCLajv01kWxP58Bjah_BGLNhB5p39fEK8X78IhqS6BTiYhlnKu6Nu6WmvEYwWcuLw3Mr2dCUh3brb8xhrInIOWItTv3b-ho3UU8PPc9bbxpI3ArukHYDCySmMiImoaeOvpXpUfiLg8e_USW4TLfhrKzw')` }}
          />
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white">Admin Global</p>
              <p className="text-xs text-slate-500 truncate">Sair</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
