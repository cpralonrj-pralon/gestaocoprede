
import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getHeadcountSuggestions } from '../services/gemini';
import { EmployeeRegistrationModal } from '../components/EmployeeRegistrationModal';
import { EmployeeProfileView } from './EmployeeProfileView';

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
  markerEnd,
  data
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [showTrash, setShowTrash] = useState(false);

  const onEdgeDoubleClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setShowTrash(!showTrash);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, cursor: 'pointer' }}
        interactionWidth={20}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onDoubleClick={onEdgeDoubleClick}
        className="react-flow__edge-interaction"
      />
      <EdgeLabelRenderer>
        {showTrash && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              className="size-8 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:bg-red-600 transition-all scale-110 active:scale-95"
              onClick={(evt) => {
                evt.stopPropagation();
                if ((data as any)?.onDelete) {
                  (data as any).onDelete(id);
                }
              }}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

// --- Custom Node Component ---
const CustomNode = ({ data }: any) => {
  const colorMap: any = {
    emerald: 'border-emerald-500 shadow-emerald-500/10',
    orange: 'border-orange-500 shadow-orange-500/10',
    red: 'border-red-500 shadow-red-500/10',
    primary: 'border-primary shadow-primary/10',
    slate: 'border-slate-300 dark:border-slate-700 shadow-sm'
  };

  const statusColor: any = {
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    primary: 'bg-primary'
  };

  const isSmall = data.level === 'team';

  return (
    <div className={`${isSmall ? 'w-44' : 'w-64'} bg-white dark:bg-surface-dark border-2 rounded-2xl shadow-xl p-4 flex flex-col relative transition-all hover:scale-105 ${colorMap[data.color || 'slate']}`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary" />

      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={data.img}
            className={`${isSmall ? 'size-10' : 'size-12'} rounded-full border-2 border-slate-100 dark:border-slate-800`}
            alt={data.name}
          />
          {!isSmall && data.color && (
            <div className={`absolute -bottom-0.5 -right-0.5 size-3.5 border-2 border-white dark:border-slate-800 rounded-full ${statusColor[data.color]}`}></div>
          )}
        </div>
        <div className="text-left overflow-hidden flex-1">
          <h3 className={`font-bold text-slate-900 dark:text-white ${isSmall ? 'text-xs' : 'text-sm'} truncate`}>{data.name}</h3>
          <p className={`text-[9px] text-slate-500 font-black uppercase tracking-widest ${isSmall ? 'mt-0' : 'mt-1'}`}>{data.role}</p>
          {!isSmall && (
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className={`h-full ${statusColor[data.color || 'primary']}`} style={{ width: `${data.perf}%` }}></div>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary" />

      {/* Stats Section for non-team nodes */}
      {!isSmall && data.stats && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-black uppercase tracking-tight">Total Colaboradores</span>
            <span className="font-black text-primary">{data.stats.total}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-50 dark:border-slate-800/50 pt-2">
            {[
              { label: 'Coord. II', val: data.stats.c2 },
              { label: 'Coord. I', val: data.stats.c1 },
              { label: 'Analista II', val: data.stats.a2 },
              { label: 'Analista I', val: data.stats.a1 },
            ].map(stat => (
              <div key={stat.label} className="flex justify-between items-center text-[9px]">
                <span className="text-slate-400 font-bold uppercase tracking-tighter truncate mr-1">{stat.label}</span>
                <span className="font-black text-slate-700 dark:text-slate-300">{stat.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'custom',
    position: { x: 400, y: 0 },
    data: {
      name: 'Carlos Mendes',
      role: 'Diretor de Operações',
      img: 'https://picsum.photos/seed/manager/100/100',
      color: 'primary',
      perf: 98,
      level: 'root',
      stats: { total: 146, c2: 3, c1: 2, a2: 7, a1: 126 }
    }
  },
  {
    id: 'c2-1',
    type: 'custom',
    position: { x: 100, y: 300 },
    data: {
      name: 'Ana Souza',
      role: 'Coord. II - Cluster Norte',
      img: 'https://picsum.photos/seed/ana/100/100',
      color: 'emerald',
      perf: 92,
      level: 'c2',
      headcount: 42,
      stats: { total: 42, c2: 0, c1: 1, a2: 2, a1: 39 }
    }
  },
  {
    id: 'c2-2',
    type: 'custom',
    position: { x: 700, y: 300 },
    data: {
      name: 'Pedro Santos',
      role: 'Coord. II - Cluster Sul',
      img: 'https://picsum.photos/seed/pedro/100/100',
      color: 'orange',
      perf: 75,
      level: 'c2',
      headcount: 58,
      stats: { total: 58, c2: 0, c1: 1, a2: 3, a1: 54 }
    }
  },
  { id: 'c1-1', type: 'custom', position: { x: -50, y: 600 }, data: { name: 'Lucas Rocha', role: 'Coord. I - Fibra', img: 'https://picsum.photos/seed/lucas/100/100', color: 'emerald', perf: 85, level: 'c1', stats: { total: 20, c2: 0, c1: 0, a2: 1, a1: 19 } } },
  { id: 'c1-2', type: 'custom', position: { x: 250, y: 600 }, data: { name: 'Julia Paiva', role: 'Coord. I - Manutenção', img: 'https://picsum.photos/seed/julia/100/100', color: 'emerald', perf: 89, level: 'c1', stats: { total: 22, c2: 0, c1: 0, a2: 1, a1: 21 } } },
  { id: 't-1', type: 'custom', position: { x: -150, y: 800 }, data: { name: 'Equipe Alfa', role: 'Técnicos Senior', img: 'https://picsum.photos/seed/team1/100/100', level: 'team' } },
  { id: 't-2', type: 'custom', position: { x: 50, y: 800 }, data: { name: 'Equipe Beta', role: 'Instaladores', img: 'https://picsum.photos/seed/team2/100/100', level: 'team' } },
];

export const HierarchyView: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedEmployee(node.data);
  }, []);

  const handleAddEmployee = (data: any) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 400 },
      data: {
        ...data,
        perf: 100,
        level: data.role.toLowerCase().includes('coord') ? (data.role.includes('II') ? 'c2' : 'c1') : 'team',
        img: data.photo,
        color: 'slate'
      }
    };

    setNodes((nds) => nds.concat(newNode));

    if (data.managerId) {
      const newEdge: Edge = {
        id: `e-${data.managerId}-${newNode.id}`,
        source: data.managerId,
        target: newNode.id,
        type: 'custom',
        animated: true,
        style: { stroke: '#137fec', strokeWidth: 2 },
        data: { onDelete: handleDeleteEdge }
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
    }

    setNotification({ msg: `Colaborador ${data.name} cadastrado e vinculado!`, type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setConfirmDeleteId(edgeId);
  }, []);

  const executeDelete = () => {
    if (confirmDeleteId) {
      setEdges((eds) => eds.filter((e) => e.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      setNotification({ msg: 'Conexão removida com sucesso.', type: 'info' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      // RULE: Only one parent per node. Remove existing edge if any for the target node.
      const filtered = eds.filter((e) => e.target !== params.target);

      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: 'custom',
        animated: true,
        style: { stroke: '#137fec', strokeWidth: 2 },
        data: { onDelete: handleDeleteEdge }
      } as Edge;

      setNotification({ msg: 'Nova liderança estabelecida!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);

      return addEdge(newEdge, filtered);
    });
  }, [setEdges, handleDeleteEdge]);

  // Initial Edges with custom type and delete handler
  useEffect(() => {
    const defaultEdges: Edge[] = [
      { id: 'e-root-c2-1', source: 'root', target: 'c2-1', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
      { id: 'e-root-c2-2', source: 'root', target: 'c2-2', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
      { id: 'e-c2-1-c1-1', source: 'c2-1', target: 'c1-1', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
      { id: 'e-c2-1-c1-2', source: 'c2-1', target: 'c1-2', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
      { id: 'e-c1-1-t-1', source: 'c1-1', target: 't-1', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
      { id: 'e-c1-1-t-2', source: 'c1-1', target: 't-2', type: 'custom', animated: true, style: { stroke: '#137fec', strokeWidth: 2 } },
    ].map(e => ({ ...e, data: { onDelete: handleDeleteEdge } }));
    setEdges(defaultEdges);
  }, [handleDeleteEdge]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      const managersData = nodes.filter(n => n.data.level !== 'team').map(n => ({
        name: n.data.name,
        area: n.data.role,
        headcount: n.data.headcount || 10
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

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDeleteId(null)} />
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="size-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-center mb-2 tracking-tight">Excluir Conexão?</h3>
            <p className="text-sm text-center text-slate-500 font-medium mb-8 leading-relaxed">Você está prestes a remover o subordinado desta linha de comando. Esta ação pode ser desfeita conectando-os novamente.</p>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dê duplo clique em uma linha para excluir | Arraste para conectar</p>
          </div>
          <div className="flex gap-4">
            <MetricItem label="Conexões" value={edges.length.toString()} color="primary" />
            <MetricItem label="Níveis" value="4" color="emerald" />
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 ml-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              CADASTRAR NOVO
            </button>
          </div>
        </div>

        <div className="flex-1 bg-grid-pattern cursor-crosshair">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background color="#94a3b8" opacity={0.1} />
            <Controls className="!bg-white dark:!bg-surface-dark !border-none !shadow-2xl" />
          </ReactFlow>
        </div>
      </div>

      <EmployeeRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEmployee}
        managers={nodes.filter(n => n.data.level !== 'team').map(n => ({ id: n.id, name: n.data.name }))}
      />

      {/* Profile Sidebar Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[400] overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setSelectedEmployee(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-background-dark shadow-[ -20px_0_50px_rgba(0,0,0,0.1) ] border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500 ease-out">
            <EmployeeProfileView
              employee={selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
            />
          </div>
        </div>
      )}

      <div className="w-full md:w-80 bg-white dark:bg-surface-dark flex flex-col h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl z-20 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-xl">psychology_alt</span>
            </div>
            <h3 className="font-black text-lg tracking-tight">Staffing IA</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Benchmarks de eficácia de gestão multinível.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loadingSuggestions ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 dark:bg-surface-highlight rounded-2xl" />)}
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <SuggestionCard key={idx} {...s} />
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-highlight/50 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Dica de Gestão</p>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">Duplo clique na linha para abrir a lixeira de exclusão.</p>
        </div>
      </div>
    </div>
  );
};

const SuggestionCard = ({ title, description, type }: any) => {
  const styles: any = {
    warning: 'border-orange-500 bg-orange-500/5 text-orange-600',
    info: 'border-blue-500 bg-blue-500/5 text-blue-600',
    success: 'border-emerald-500 bg-emerald-500/5 text-emerald-600'
  };

  const icons: any = {
    warning: 'warning',
    info: 'info',
    success: 'check_circle'
  };

  return (
    <div className={`p-5 rounded-2xl border-l-4 border bg-white dark:bg-surface-highlight shadow-sm space-y-3 transition-all hover:scale-[1.02] ${styles[type]}`}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">{icons[type]}</span>
        <h4 className="font-black text-xs uppercase tracking-widest">{title}</h4>
      </div>
      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{description}</p>
    </div>
  );
};

const MetricItem = ({ label, value, color }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-500',
    primary: 'bg-primary'
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-surface-highlight rounded-xl border border-slate-200 dark:border-slate-800">
      <span className={`size-2 rounded-full ${colorMap[color]}`}></span>
      <span className="text-[10px] text-slate-500 font-black uppercase">{label}:</span>
      <span className="text-xs font-black dark:text-white">{value}</span>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
  .bg-grid-pattern {
    background-size: 40px 40px;
    background-image: 
      linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  }
  .dark .bg-grid-pattern {
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  .react-flow__edge-interaction:hover {
    stroke-opacity: 0.5;
    stroke: #137fec;
    cursor: pointer;
  }
`;
document.head.appendChild(style);
