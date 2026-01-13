import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { HierarchyView } from './views/HierarchyView';
import { FeedbackView } from './views/FeedbackView';
import { AIInsightsView } from './views/AIInsightsView';
import { ScheduleView } from './views/ScheduleView';
import { VacationView } from './views/VacationView';
import { EmployeeProfileView } from './views/EmployeeProfileView';
import { OvertimeView } from './views/OvertimeView';
import { CertificateView } from './views/CertificateView';
import { PortalView } from './views/PortalView';
import { ModuleId } from './types';
import { EmployeeProvider } from './context/EmployeeContext';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';

const AuthenticatedApp: React.FC = () => {
  const { session, userProfile, loading, refreshProfile } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalDate, setGlobalDate] = useState(new Date());
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Set initial module based on role
  React.useEffect(() => {
    if (userProfile) {
      const role = userProfile.role?.toUpperCase();
      if (['ANALISTA', 'TECNICO', 'COLABORADOR'].some(r => role?.includes(r))) {
        setActiveModule('portal');
      } else {
        setActiveModule('dashboard');
      }
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0c10]">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  // Verificar se precisa trocar a senha
  const mustChangePassword = userProfile?.must_change_password && !passwordChanged;

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardView currentMonth={globalDate} onMonthChange={setGlobalDate} searchQuery={searchQuery} />;
      case 'hierarchy': return <HierarchyView searchQuery={searchQuery} />;
      case 'feedbacks': return <FeedbackView />;
      case 'ai-insights': return <AIInsightsView />;
      case 'schedules': return <ScheduleView currentMonth={globalDate} onMonthChange={setGlobalDate} />;
      case 'vacations': return <VacationView currentMonth={globalDate} onMonthChange={setGlobalDate} />;
      case 'profile': return <EmployeeProfileView />;
      case 'overtime': return <OvertimeView />;
      case 'certificates': return <CertificateView />;
      case 'portal': return <PortalView />;
      default: return <DashboardView currentMonth={globalDate} onMonthChange={setGlobalDate} searchQuery={searchQuery} />;
    }
  };

  const handlePasswordChanged = async () => {
    setPasswordChanged(true);
    await refreshProfile();
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Modal de troca de senha obrigatória */}
      <ChangePasswordModal
        isOpen={mustChangePassword || false}
        onPasswordChanged={handlePasswordChanged}
      />

      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="flex-1 overflow-hidden">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <EmployeeProvider>
        <AuthenticatedApp />
      </EmployeeProvider>
    </AuthProvider>
  );
};

export default App;
