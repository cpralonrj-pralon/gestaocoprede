import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  Node,
  getBezierPath,
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getHeadcountSuggestions } from '../services/gemini';
import { EmployeeRegistrationModal } from '../components/EmployeeRegistrationModal';
import { CSVImportModal } from '../components/CSVImportModal';
import { EmployeeProfileView } from './EmployeeProfileView';
import { EmployeeCSVData } from '../utils/csvParser';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  createEmployeesBulk,
  updateEmployeePosition
} from '../services/supabase/employees';
import {
  getAllConnections,
  createConnection,
  deleteConnection
} from '../services/supabase/hierarchy';

// --- Custom Edge Component ---
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? '#ef4444' : (style.stroke || '#137fec'),
          strokeWidth: selected ? 3 : 2
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center justify-center"
        >
          {selected && (
            <button
              className="bg-red-500 text-white size-9 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer animate-in zoom-in duration-200 border-2 border-white ring-4 ring-red-500/20"
              onClick={(event) => {
                event.stopPropagation();
                (data as any).onDelete(id);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};




// Custom Node Component - Restored Premium Design
const CustomNode = ({ data }: { data: any }) => (
  <div className={`p-4 rounded-[2rem] shadow-2xl border-2 bg-white dark:bg-surface-dark min-w-[220px] relative transition-all hover:scale-105 active:scale-95 group overflow-hidden ${data.color === 'primary' ? 'border-primary' : (data.color === 'emerald' ? 'border-emerald-500' : 'border-orange-400')}`}>
    <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
      <span className="material-symbols-outlined text-7xl">person</span>
    </div>
    <div className="flex items-center gap-4">
      <div className={`size-14 rounded-2xl p-1 border-2 rotate-3 group-hover:rotate-0 transition-transform ${data.color === 'primary' ? 'border-primary/20' : (data.color === 'emerald' ? 'border-emerald-500/20' : 'border-orange-400/20')}`}>
        <img src={data.img} className="size-full object-cover rounded-xl" alt={data.name} />
      </div>
      <div className="flex-1">
        <h3 className="font-black text-sm dark:text-white uppercase tracking-tighter leading-tight truncate max-w-[120px]">{data.name}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{data.role}</p>
      </div>
    </div>

    <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${data.perf > 90 ? 'bg-emerald-500' : (data.perf > 70 ? 'bg-amber-500' : 'bg-red-500')}`} style={{ width: `${data.perf}%` }} />
          </div>
          <span className="text-[10px] font-black dark:text-white">{data.perf}%</span>
        </div>
      </div>
      <div className={`size-8 rounded-xl flex items-center justify-center ${data.color === 'primary' ? 'bg-primary/10 text-primary' : (data.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-400/10 text-orange-400')}`}>
        <span className="material-symbols-outlined text-lg">{data.level === 'root' ? 'star' : (data.level === 'c2' ? 'verified' : 'group')}</span>
      </div>
    </div>

    {data.stats && data.stats.total > 0 && (
      <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Headcount Total</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">{data.stats.total}</span>
        </div>
        <div className="space-y-1">
          {data.stats?.roles && Object.entries(data.stats.roles).map(([role, count]: [any, any]) => (
            <div key={role} className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase">
              <span className="truncate max-w-[140px]">{role}</span>
              <span className="text-slate-400">({count})</span>
            </div>
          ))}
        </div>
      </div>
    )}

    <Handle type="target" position={Position.Top} className="!bg-slate-300 !border-2 !border-white !size-3" />
    <Handle type="source" position={Position.Bottom} className="!bg-primary !border-2 !border-white !size-3" />
  </div>
);

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

export const HierarchyView = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Manual handlers for React Flow
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      const updatedNodes = [...nds];
      changes.forEach((change: any) => {
        if (change.type === 'position' && change.position) {
          const node = updatedNodes.find(n => n.id === change.id);
          if (node) node.position = change.position;
        }
        if (change.type === 'remove') {
          const index = updatedNodes.findIndex(n => n.id === change.id);
          if (index > -1) updatedNodes.splice(index, 1);
        }
      });
      return updatedNodes;
    });
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      const updatedEdges = [...eds];
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          const index = updatedEdges.findIndex(e => e.id === change.id);
          if (index > -1) updatedEdges.splice(index, 1);
        }
      });
      return updatedEdges;
    });
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reactFlowKey, setReactFlowKey] = useState(0);
  const [allEmployees, setAllEmployees] = useState<any[]>([]); // Store all employees for managers dropdown

  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 [HierarchyView] Carregando dados...');
      const [allEmployees, allConnections] = await Promise.all([
        getAllEmployees(),
        getAllConnections()
      ]);

      console.log('📊 [HierarchyView] Dados carregados:', {
        employees: allEmployees.length,
        connections: allConnections.length
      });

      // Store all employees for managers dropdown
      setAllEmployees(allEmployees);

      if (allEmployees.length === 0) {
        console.warn('⚠️ [HierarchyView] Nenhum colaborador encontrado!');
      }

      const childrenMap: Record<string, string[]> = {};
      const empMap: Record<string, any> = {};
      allEmployees.forEach(e => empMap[e.id] = e);
      allConnections.forEach(c => {
        if (!childrenMap[c.source_employee_id]) childrenMap[c.source_employee_id] = [];
        childrenMap[c.source_employee_id].push(c.target_employee_id);
      });

      const statsMap: Record<string, { total: number, roles: Record<string, number> }> = {};
      const calculateStats = (id: string, visited: Set<string> = new Set()) => {
        if (statsMap[id]) return statsMap[id];
        if (visited.has(id)) return { total: 0, roles: {} }; // Cycle detected

        visited.add(id);
        const res = { total: 0, roles: {} as Record<string, number> };
        const childIds = childrenMap[id] || [];

        childIds.forEach(cId => {
          const cEmp = empMap[cId];
          if (cEmp) {
            res.total += 1;
            res.roles[cEmp.role] = (res.roles[cEmp.role] || 0) + 1;

            // Create a new set for the branch traversal
            const sub = calculateStats(cId, new Set(visited));
            res.total += sub.total;
            Object.entries(sub.roles).forEach(([r, count]) => {
              res.roles[r] = (res.roles[r] || 0) + count;
            });
          }
        });

        statsMap[id] = res;
        return res;
      };

      allEmployees.forEach(e => calculateStats(e.id));

      const newNodes: Node[] = allEmployees
        .filter(emp => emp.id && emp.full_name) // Only include valid employees
        .map((emp, index) => ({
          id: emp.id,
          type: 'custom',
          position: {
            x: emp.graph_position_x || (index % 10) * 200,
            y: emp.graph_position_y || Math.floor(index / 10) * 150
          },
          data: {
            name: emp.full_name || 'Sem nome',
            role: emp.role || 'Colaborador',
            img: emp.photo_url || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#137fec" width="100" height="100"/><text fill="white" font-size="40" font-family="Arial" x="50%" y="50%" text-anchor="middle" dy=".3em">${(emp.full_name || 'U').charAt(0).toUpperCase()}</text></svg>`)}`,
            color: emp.hierarchy_level === 'root' ? 'primary' : (emp.hierarchy_level === 'c2' ? 'emerald' : 'orange'),
            perf: emp.performance_score || 100,
            level: emp.hierarchy_level || 'team',
            stats: statsMap[emp.id] || { total: 0, roles: {} },
            id: emp.id,
            employee_number: emp.employee_number,
            login: (emp as any).login,
            email: emp.email,
            whatsapp: emp.phone,
            address: (emp as any).address,
            city: (emp as any).city,
            uf: (emp as any).uf,
            admission_date: emp.admission_date,
            shift: (emp as any).shift,
            managerId: (emp as any).manager_id
          }
        }));

      const handleDeleteEdgeLocal = (id: string) => setConfirmDeleteId(id);

      const newEdges: Edge[] = allConnections.map((conn) => ({
        id: conn.id,
        source: conn.source_employee_id,
        target: conn.target_employee_id,
        type: 'custom',
        animated: true,
        style: { stroke: '#137fec', strokeWidth: 2 },
        data: { onDelete: handleDeleteEdgeLocal }
      }));

      console.log('📍 [HierarchyView] Criando nodes e edges:', {
        nodes: newNodes.length,
        edges: newEdges.length
      });

      // Apply directly without setTimeout
      console.log('⏰ [HierarchyView] Aplicando', newNodes.length, 'nodes DIRETAMENTE');
      setReactFlowKey(prev => prev + 1); // Force React Flow to remount
      setNodes(newNodes);
      setEdges(newEdges);
      setIsLoading(false);
      console.log('✅ [HierarchyView] Chamou setIsLoading(false), reactFlowKey incrementado');
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Debug: Monitor nodes state
  useEffect(() => {
    console.log('🔴 [HierarchyView RENDER] nodes.length =', nodes.length, 'isLoading =', isLoading);
  }, [nodes, isLoading]);

  const handleAddEmployee = async (data: any) => {
    try {
      setNotification({ msg: `Sincronizando dados...`, type: 'info' });

      const payload: any = {
        full_name: data.name,
        role: data.role,
        cluster: data.cluster || 'Matriz',
        store: data.store || '',
        phone: data.whatsapp,
        email: data.email || `${data.login.toLowerCase()}@claro.com.br`,
        admission_date: data.admissionDate,
        manager_id: data.managerId === 'root' ? null : data.managerId,
        hierarchy_level: (data.level as any) || 'team',
        status: 'active' as 'active' | 'inactive' | 'on_leave'
      };

      // Only add employee_number if it has a value to avoid unique constraint violations
      if (data.id && data.id.trim() !== '') {
        payload.employee_number = data.id;
      }

      let employeeId = '';

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload);
        employeeId = editingEmployee.id;
      } else {
        const newEmp = await createEmployee(payload as any);
        employeeId = newEmp.id;
      }

      if (data.managerId && data.managerId !== 'root') {
        try {
          // If editing, we might need to delete old connection first to avoid duplicates
          // for simplicity we just attempt create, many-to-many might need cleanup
          await createConnection(data.managerId, employeeId, 'reports_to');
        } catch (connError) {
          console.error('Error creating hierarchy connection:', connError);
        }
      }

      refreshData();
      setIsModalOpen(false);
      setEditingEmployee(null);
      setSelectedEmployee(null);
      setNotification({ msg: editingEmployee ? 'Dados atualizados!' : 'Colaborador cadastrado!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error adding employee:', error);

      // Check for specific error types
      if (error?.message?.includes('employees_employee_number_key') ||
        error?.details?.includes('employee_number')) {
        alert('❌ ERRO: Matrícula duplicada!\n\nEssa matrícula já está cadastrada para outro colaborador.\n\nSolução:\n- Deixe o campo Matrícula VAZIO\n- Ou use um número único (ex: GT001, MROS001)');
      } else {
        alert('Erro ao cadastrar colaborador no Supabase.\n\nDetalhes: ' + (error?.message || error?.details || 'Erro desconhecido'));
      }
    }
  };

  const handleCSVImport = async (data: EmployeeCSVData[]) => {
    try {
      setNotification({ msg: `Importando ${data.length} registros...`, type: 'info' });

      // Get all existing employees to find managers
      const allEmployees = await getAllEmployees();
      console.log(`[CSV Import] Total de funcionários existentes: ${allEmployees.length}`);

      const employeesToCreate = data.map(d => {
        // Build employee object with ONLY fields that exist in Supabase
        const employee: any = {
          full_name: d.nome,
          role: d.cargo,
          cluster: d.cluster || 'Matriz',
          hierarchy_level: 'team',
          status: 'active'
        };

        // Only add optional fields if they have values
        if (d.email) employee.email = d.email;
        if (d.telefone) employee.phone = d.telefone;
        if (d.dataAdmissao) employee.admission_date = d.dataAdmissao;

        // Find manager by name if 'gestor' field is provided
        if (d.gestor && d.gestor.trim() !== '') {
          const manager = allEmployees.find(emp =>
            emp.full_name.toLowerCase().trim() === d.gestor.toLowerCase().trim()
          );

          if (manager) {
            employee.manager_id = manager.id;
            console.log(`[CSV Import] ✅ Vinculando "${d.nome}" ao gestor "${manager.full_name}" (ID: ${manager.id})`);
          } else {
            console.warn(`[CSV Import] ⚠️  Gestor "${d.gestor}" NÃO encontrado para "${d.nome}"`);
          }
        }

        return employee;
      });

      console.log('[CSV Import] Sending to Supabase:', JSON.stringify(employeesToCreate[0], null, 2));
      const createdEmployees = await createEmployeesBulk(employeesToCreate);

      console.log(`[CSV Import] ✅ Criados ${createdEmployees.length} colaboradores!`);

      // Now create hierarchy connections for employees that have managers
      let connectionsCreated = 0;
      for (let i = 0; i < createdEmployees.length; i++) {
        const employee = createdEmployees[i];
        const originalData = data[i];

        if (employee.manager_id) {
          try {
            await createConnection(employee.manager_id, employee.id, 'reports_to');
            connectionsCreated++;
            console.log(`[CSV Import] 🔗 Conexão criada: ${employee.full_name} → Gestor`);
          } catch (connError) {
            console.error(`[CSV Import] ❌ Erro ao criar conexão para ${employee.full_name}:`, connError);
          }
        }
      }

      console.log(`[CSV Import] ✅ Total de conexões criadas: ${connectionsCreated}`);

      refreshData();
      setIsCSVModalOpen(false);
      setNotification({ msg: 'Importação concluída com sucesso!', type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      console.error('[CSV Import] Erro completo:', error);
      console.error('[CSV Import] Error message:', error?.message);
      console.error('[CSV Import] Error details:', error?.details);

      // Show detailed error to user
      const errorMsg = error?.message || error?.details || 'Erro desconhecido ao importar CSV no Supabase';
      alert(`Erro ao importar CSV:\n\n${errorMsg}\n\nVerifique o console (F12) para mais detalhes.`);
    }
  };

  const executeDelete = async () => {
    if (confirmDeleteId) {
      try {
        const edgeToDelete = edges.find(e => e.id === confirmDeleteId);

        // 1. Delete from hierarchy_connections
        await deleteConnection(confirmDeleteId);

        // 2. If it was a reports_to connection, nullify the manager_id on the employee
        if (edgeToDelete) {
          const subordinateId = edgeToDelete.target;
          try {
            // Import the update function if it exists or use it directly from context if available
            // For now we use the exported service
            const { updateEmployee } = await import('../services/supabase/employees');
            await updateEmployee(subordinateId, { manager_id: undefined } as any);
          } catch (err) {
            console.warn('Failed to nullify manager_id, but connection was deleted:', err);
          }
        }

        setEdges((eds) => eds.filter((e) => e.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        refreshData(); // Refresh to update headcount stats
        setNotification({ msg: 'Conexão removida com sucesso.', type: 'info' });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error deleting edge:', error);
        alert('Erro ao excluir conexão no banco de dados.');
      }
    }
  };

  const onConnect = useCallback(async (params: Connection) => {
    try {
      await createConnection(params.source!, params.target!, 'reports_to');
      refreshData();
      setNotification({ msg: 'Nova liderança estabelecida e salva!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Erro ao salvar conexão no banco de dados.');
    }
  }, [refreshData]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedEmployee(node.data);
  }, []);

  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    try {
      await updateEmployeePosition(node.id, node.position.x, node.position.y);
    } catch (error) {
      console.error('Error saving node position:', error);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (nodes.length === 0) return;
      setLoadingSuggestions(true);
      const managersData = nodes.filter(n => n.data.level !== 'team').map(n => ({
        name: n.data.name,
        area: n.data.role,
        headcount: 10 // Placeholder
      }));
      const resp = await getHeadcountSuggestions(managersData);
      setSuggestions(resp);
      setLoadingSuggestions(false);
    };
    fetchSuggestions();
  }, [nodes.length]);

  return (
    <div className="h-full relative bg-slate-50 dark:bg-background-dark overflow-hidden flex flex-col md:flex-row">
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-10 duration-300 flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-primary border-primary-light text-white'}`}>
          <span className="material-symbols-outlined">{notification.type === 'success' ? 'check_circle' : 'sync'}</span>
          <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDeleteId(null)} />
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="size-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-center mb-2 tracking-tight">Excluir Conexão?</h3>
            <p className="text-sm text-center text-slate-500 font-medium mb-8 leading-relaxed">Você está prestes a remover o subordinado desta linha de comando.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="py-3.5 rounded-2xl bg-slate-100 dark:bg-surface-highlight font-black text-sm transition-all hover:bg-slate-200">Cancelar</button>
              <button onClick={executeDelete} className="py-3.5 rounded-2xl bg-red-500 text-white font-black text-sm shadow-lg shadow-red-500/20 transition-all hover:brightness-110 active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-slate-800">
        <div className="flex-shrink-0 p-6 flex items-center justify-between bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black tracking-tight">Gestão Hierárquica</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-inter">Dê duplo clique em uma linha para excluir | Arraste para conectar</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-500/20 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Importar CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Novo Colaborador
            </button>
          </div>
        </div>

        <div className="flex-1 bg-grid-pattern cursor-crosshair relative" style={{ minHeight: '600px' }}>
          {/* Show ReactFlow always - if no nodes, it will just be empty */}
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              key={reactFlowKey}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDragStop={onNodeDragStop}
              onEdgeDoubleClick={(e, edge) => setConfirmDeleteId(edge.id)}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
              zoomOnScroll={true}
              panOnScroll={true}
              fitView
            >
              <Background color="#94a3b8" opacity={0.1} />
              <Controls className="!bg-white dark:!bg-surface-dark !border-none !shadow-2xl" />
            </ReactFlow>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 bg-white dark:bg-surface-dark flex flex-col h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl z-20 overflow-hidden font-inter">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <h3 className="font-black text-lg tracking-tight uppercase">Staffing IA</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Benchmarks de eficácia operacional.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loadingSuggestions ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 dark:bg-surface-highlight rounded-2xl" />)}
            </div>
          ) : suggestions.map((s, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${s.type === 'optimizing' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <h4 className="font-black text-[10px] uppercase text-slate-400 mb-1">{s.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      <EmployeeRegistrationModal
        isOpen={isModalOpen || !!editingEmployee}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleAddEmployee}
        managers={allEmployees.map(emp => ({
          id: emp.id,
          name: emp.full_name || emp.name || 'Sem Nome'
        }))}
        editData={editingEmployee}
      />
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImport={handleCSVImport}
        existingManagers={nodes
          .filter(n => n.data.role?.includes('COORDENADOR') || n.data.role?.includes('GERENTE'))
          .map(n => ({ id: n.id, name: n.data.name }))}
      />

      {selectedEmployee && (
        <div className="fixed inset-0 z-[400] overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setSelectedEmployee(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-background-dark shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500">
            <EmployeeProfileView
              employee={selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
              onEdit={(emp) => {
                setEditingEmployee(emp);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

