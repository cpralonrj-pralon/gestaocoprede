
export type ModuleId = 
  | 'dashboard' 
  | 'hierarchy' 
  | 'feedbacks' 
  | 'ai-insights' 
  | 'schedules' 
  | 'vacations' 
  | 'profile' 
  | 'overtime' 
  | 'certificates' 
  | 'portal';

export interface Employee {
  id: string;
  name: string;
  role: string;
  cluster: string;
  status: 'active' | 'on-leave' | 'vacation';
  avatar: string;
  performance: number;
  presence: number;
  overtime: string;
}

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}
