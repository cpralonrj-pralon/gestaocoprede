import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllEmployees, subscribeToEmployees } from '../services/supabase/employees';
import { Employee as SupabaseEmployee } from '../services/supabase/client';
import { importHoursBank, HoursBankImportRow } from '../services/supabase/hoursBank';

export interface Employee {
    id: string;
    name: string;
    cluster: string;
    coordinator: string;
    bankBalance: number; // In seconds
    role: string;
    expiringHours: number; // In seconds
    daysToExpire: number; // Number of days until expiry
    lastUpdate: string;
    employee_number?: string;
}

interface EmployeeContextType {
    employees: Employee[];
    rawData: any[]; // Dados brutos da última importação
    updateEmployees: (newEmployees: Employee[]) => void;
    importBankData: (data: any[]) => void;
    formatBalance: (seconds: number) => string;
    loading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    // Recuperar dados brutos do localStorage ao inicializar
    const [rawData, setRawData] = useState<any[]>(() => {
        try {
            const stored = localStorage.getItem('gestao-cop-raw-bank');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading rawData from localStorage:', error);
            return [];
        }
    });
    const [loading, setLoading] = useState(true);

    const mapSupabaseToLocal = (emp: SupabaseEmployee): Employee => ({
        id: emp.id,
        name: emp.full_name,
        cluster: emp.cluster || 'Matriz',
        coordinator: emp.manager_id || 'Não Atribuído',
        role: emp.role,
        bankBalance: emp.current_hours_balance || 0,
        expiringHours: 0,
        daysToExpire: 999,
        lastUpdate: emp.updated_at || '',
        employee_number: emp.employee_number
    });

    const refreshEmployees = async (isMounted: { current: boolean } = { current: true }) => {
        try {
            const data = await getAllEmployees();

            // Safety check: specific fix for the "disappearing data" bug
            if (data.length === 0 && employees.length > 5) {
                console.warn(" [EmployeeContext] Recebeu 0 colaboradores enquanto tinha dados carregados. Ignorando possível falha de sync.");
                return;
            }

            if (isMounted.current) {
                setEmployees(data.map(mapSupabaseToLocal));
            }
        } catch (error: any) {
            // Ignorar AbortError (comum no React dev mode)
            if (error?.name !== 'AbortError' && !error?.message?.includes('abort')) {
                console.error('Error refreshing employees:', error);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const isMounted = { current: true };

        refreshEmployees(isMounted);

        const subscription = subscribeToEmployees(() => {
            if (isMounted.current) {
                refreshEmployees(isMounted);
            }
        });

        return () => {
            isMounted.current = false;
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);

    const updateEmployees = (newEmployees: Employee[]) => {
        setEmployees(newEmployees);
    };

    const updateRawData = (data: any[]) => {
        setRawData(data);
        localStorage.setItem('gestao-cop-raw-bank', JSON.stringify(data));
    };

    const timeToSeconds = (val: any): number => {
        if (!val) return 0;
        const str = String(val).trim();
        if (str.includes(':')) {
            const parts = str.split(':').map(p => parseInt(p) || 0);
            if (parts.length >= 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
        }
        if (typeof val === 'number') {
            if (val < 1) return Math.round(val * 86400);
            if (val < 100) return Math.round(val * 3600);
            return Math.round(val);
        }
        return 0;
    };

    const formatBalance = (seconds: number): string => {
        const absSeconds = Math.abs(seconds);
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;
        const sign = seconds < 0 ? '-' : '+';
        return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}h`;
    };

    const importBankData = async (rawData2D: any[][]) => {
        console.log(" [EmployeeContext] Iniciando processamento de", rawData2D.length, "linhas (2D).");

        if (rawData2D.length === 0) return;

        let headerRowIndex = -1;
        let colIndices = { matricula: -1, nome: -1, desc: -1, saldo: -1, gestor: -1, venc: -1, horas_prev: -1, horas_trab: -1 };
        const keywords = {
            matricula: ['MATRICULA', 'ID', 'CODIGO'],
            nome: ['NOME', 'COLABORADOR', 'FUNCIONARIO'],
            desc: ['DESCRICAO', 'TIPO', 'HISTORICO'],
            saldo: ['SALDO', 'HORAS', 'VALOR'],
            horas_prev: ['PREVISTA', 'ESPERADA'],
            horas_trab: ['TRABALHADA', 'REALIZADA'],
            gestor: ['GESTOR', 'SUPERVISOR', 'CLUSTER'],
            venc: ['VENCER', 'EXPIRA', 'VENC_DIAS', 'VENCIMENTO']
        };

        for (let i = 0; i < Math.min(rawData2D.length, 20); i++) {
            const row = rawData2D[i];
            if (!Array.isArray(row)) continue;
            const normalizedRow = row.map(cell => String(cell || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
            const foundMatricula = normalizedRow.findIndex(cell => keywords.matricula.some(kw => cell.includes(kw)));
            const foundSaldo = normalizedRow.findIndex(cell => keywords.saldo.some(kw => cell.includes(kw)));
            if (foundMatricula !== -1 && foundSaldo !== -1) {
                headerRowIndex = i;
                colIndices.matricula = foundMatricula;
                colIndices.saldo = foundSaldo;
                colIndices.nome = normalizedRow.findIndex(cell => keywords.nome.some(kw => cell.includes(kw)));
                colIndices.desc = normalizedRow.findIndex(cell => keywords.desc.some(kw => cell.includes(kw)));
                colIndices.gestor = normalizedRow.findIndex(cell => keywords.gestor.some(kw => cell.includes(kw)));
                colIndices.venc = normalizedRow.findIndex(cell => keywords.venc.some(kw => cell.includes(kw)));
                colIndices.horas_prev = normalizedRow.findIndex(cell => keywords.horas_prev.some(kw => cell.includes(kw)));
                colIndices.horas_trab = normalizedRow.findIndex(cell => keywords.horas_trab.some(kw => cell.includes(kw)));
                break;
            }
        }

        if (headerRowIndex === -1) {
            alert("Erro: Não consegui localizar as colunas de 'Matrícula' e 'Saldo'.");
            return;
        }

        const importRows: HoursBankImportRow[] = [];
        const headerRow = rawData2D[headerRowIndex];
        const parsedRows: any[] = [];

        for (let i = headerRowIndex + 1; i < rawData2D.length; i++) {
            const row = rawData2D[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            const matricula = String(row[colIndices.matricula] || '').trim();
            if (!matricula) continue;

            const rowObj: any = {};
            headerRow.forEach((h, idx) => {
                const key = String(h || `COL_${idx}`).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                rowObj[key] = row[idx];
            });
            parsedRows.push(rowObj);

            // Mapping for Supabase
            const workedHours = timeToSeconds(row[colIndices.horas_trab]) / 3600 || 0;
            const expectedHours = timeToSeconds(row[colIndices.horas_prev]) / 3600 || 0;
            const saldoHours = timeToSeconds(row[colIndices.saldo]) / 3600 || 0;

            // Se não tiver colunas de prevista/trabalhada, usa o saldo direto
            const finalWorked = workedHours || (saldoHours > 0 ? saldoHours : 0);
            const finalExpected = expectedHours || (saldoHours < 0 ? Math.abs(saldoHours) : 0);

            importRows.push({
                employeeIdentifier: matricula,
                name: String(row[colIndices.nome] || ''),
                date: new Date().toISOString().split('T')[0], // Simplified
                workedHours: workedHours || saldoHours,
                expectedHours: expectedHours || 0,
                notes: `Importação via planilha: ${String(row[colIndices.desc] || '')}`
            });
        }

        updateRawData(parsedRows);

        try {
            setLoading(true);
            const result = await importHoursBank(importRows, "upload_manual.xlsx");
            alert(`Sincronização concluída! ${result.success} registros processados com sucesso. ${result.errors.length} erros.`);
            refreshEmployees();
        } catch (error) {
            console.error("Erro na sincronização com Supabase:", error);
            alert("Erro ao sincronizar com o banco de dados.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <EmployeeContext.Provider value={{ employees, rawData, updateEmployees, importBankData, formatBalance, loading }}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployees = () => {
    const context = useContext(EmployeeContext);
    if (!context) throw new Error('useEmployees must be used within an EmployeeProvider');
    return context;
};
