
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

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalDate, setGlobalDate] = useState(new Date());

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

  return (
    <EmployeeProvider>
      <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
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
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <main className="flex-1 overflow-hidden">
            {renderModule()}
          </main>
        </div>
      </div>
    </EmployeeProvider>
  );
};

export default App;
