import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Employee {
    id: string;
    name: string;
    cluster: string;
    coordinator: string;
    bankBalance: number; // In seconds
    expiringHours: number; // In seconds, if positive and near expiry
    daysToExpire: number; // Number of days until expiry
    lastUpdate: string;
}

interface EmployeeContextType {
    employees: Employee[];
    rawData: any[]; // Dados brutos da última importação
    updateEmployees: (newEmployees: Employee[]) => void;
    importBankData: (data: any[]) => void;
    formatBalance: (seconds: number) => string;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('gestao-cop-employees');
        const savedRaw = localStorage.getItem('gestao-cop-raw-bank');
        if (saved) setEmployees(JSON.parse(saved));
        if (savedRaw) setRawData(JSON.parse(savedRaw));
    }, []);

    const updateEmployees = (newEmployees: Employee[]) => {
        setEmployees(newEmployees);
        localStorage.setItem('gestao-cop-employees', JSON.stringify(newEmployees));
    };

    const updateRawData = (data: any[]) => {
        setRawData(data);
        localStorage.setItem('gestao-cop-raw-bank', JSON.stringify(data));
    };

    const timeToSeconds = (val: any): number => {
        // Se for vazio ou inválido, retorna 0
        if (!val) return 0;

        // Converter para string e limpar
        const str = String(val).trim();

        // Se for string no formato HH:MM:SS ou HH:MM
        if (str.includes(':')) {
            const parts = str.split(':').map(p => parseInt(p) || 0);

            if (parts.length >= 3) {
                // HH:MM:SS
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
                // HH:MM
                return parts[0] * 3600 + parts[1] * 60;
            }
        }

        // Se for número
        if (typeof val === 'number') {
            // Se for muito pequeno (< 1), é fração de dia do Excel
            if (val < 1) {
                return Math.round(val * 86400);
            }
            // Se for entre 1 e 100, são horas
            if (val < 100) {
                return Math.round(val * 3600);
            }
            // Caso contrário, já são segundos
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

    const importBankData = (rawData2D: any[][]) => {
        console.log(" [EmployeeContext] Iniciando processamento de", rawData2D.length, "linhas (2D).");

        if (rawData2D.length === 0) {
            console.warn(" [EmployeeContext] O arquivo parece estar vazio.");
            return;
        }

        // 1. Encontrar a linha do cabeçalho
        let headerRowIndex = -1;
        let colIndices = {
            matricula: -1,
            nome: -1,
            desc: -1,
            saldo: -1,
            gestor: -1,
            venc: -1
        };

        const keywords = {
            matricula: ['MATRICULA', 'ID', 'CODIGO'],
            nome: ['NOME', 'COLABORADOR', 'FUNCIONARIO'],
            desc: ['DESCRICAO', 'TIPO', 'HISTORICO'],
            saldo: ['SALDO', 'HORAS', 'VALOR'],
            gestor: ['GESTOR', 'SUPERVISOR', 'CLUSTER'],
            venc: ['VENCER', 'EXPIRA', 'VENC_DIAS', 'VENCIMENTO']
        };

        // Procura nas primeiras 20 linhas
        for (let i = 0; i < Math.min(rawData2D.length, 20); i++) {
            const row = rawData2D[i];
            if (!Array.isArray(row)) continue;

            const normalizedRow = row.map(cell =>
                String(cell || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
            );

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
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.error(" [EmployeeContext] Cabeçalho não encontrado.");
            alert("Erro: Não consegui localizar as colunas de 'Matrícula' e 'Saldo'. \n\nVerifique se o arquivo tem os nomes corretos no topo da tabela.");
            return;
        }

        console.log(" [EmployeeContext] Cabeçalho encontrado na linha", headerRowIndex, colIndices);

        const aggregatedBalances: Record<string, { name: string; cluster: string; coordinator: string; balance: number; expiring: number; days: number }> = {};
        const parsedRows: any[] = [];
        const headerRow = rawData2D[headerRowIndex];

        let processedCount = 0;
        let skippedCount = 0;

        // 2. Processar dados a partir da linha após o cabeçalho
        for (let i = headerRowIndex + 1; i < rawData2D.length; i++) {
            const row = rawData2D[i];
            if (!Array.isArray(row) || row.length === 0) {
                skippedCount++;
                continue;
            }

            const matricula = String(row[colIndices.matricula] || '').trim();
            const nome = String(row[colIndices.nome] || 'Sem Nome');
            const descricao = String(row[colIndices.desc] || '').toUpperCase();
            const coordinator = String(row[colIndices.gestor] || 'Não Atribuído');
            const cluster = String(row[colIndices.gestor] || 'Matriz'); // Note: The user reference shows "Logística", "Vendas", etc. usually this is a mix of Segment/Guestor
            const saldoVal = row[colIndices.saldo];
            const diasVenc = parseInt(row[colIndices.venc]) || 999;

            if (!matricula || matricula === 'null' || matricula === '') {
                console.log(`  [LINHA ${i}] IGNORADA - Matrícula vazia ou inválida`);
                skippedCount++;
                continue;
            }

            processedCount++;

            // Converter para objeto para o Extrato RH ser compatível
            const rowObj: any = {};
            headerRow.forEach((h, idx) => {
                const key = String(h || `COL_${idx}`).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                rowObj[key] = row[idx];
            });
            parsedRows.push(rowObj);

            if (!aggregatedBalances[matricula]) {
                aggregatedBalances[matricula] = {
                    name: nome,
                    cluster: cluster,
                    coordinator: coordinator,
                    balance: 0,
                    expiring: 0,
                    days: 999
                };
            }

            const seconds = timeToSeconds(saldoVal);

            // Verificar se é crédito ou débito baseado na descrição
            const isCredit = descricao.includes('CREDITO');
            const isDebit = descricao.includes('DEBITO');

            // Somar se for crédito, subtrair se for débito
            if (isCredit) {
                aggregatedBalances[matricula].balance += seconds;
            } else if (isDebit) {
                aggregatedBalances[matricula].balance -= seconds;
            } else {
                // Se não tem nem CREDITO nem DEBITO, somar por padrão
                aggregatedBalances[matricula].balance += seconds;
            }

            // Verificar se está próximo de vencer (para alertas) - apenas para créditos positivos
            if (isCredit && diasVenc < 20 && seconds > 0) {
                aggregatedBalances[matricula].expiring += seconds;
                aggregatedBalances[matricula].days = Math.min(aggregatedBalances[matricula].days, diasVenc);
            }
        }

        console.log(` [EmployeeContext] ===== ESTATÍSTICAS DE PROCESSAMENTO =====`);
        console.log(`  Total de linhas no arquivo: ${rawData2D.length}`);
        console.log(`  Linhas processadas: ${processedCount}`);
        console.log(`  Linhas ignoradas: ${skippedCount}`);
        console.log(` [EmployeeContext] ===== RESUMO FINAL POR MATRÍCULA =====`);
        Object.entries(aggregatedBalances).forEach(([matricula, data]) => {
            const balanceHours = (data.balance / 3600).toFixed(2);
            console.log(`  ${matricula} - ${data.name}: ${balanceHours}h (${data.balance}s)`);
        });

        const newEmployees: Employee[] = Object.entries(aggregatedBalances).map(([id, data]) => ({
            id,
            name: data.name,
            cluster: data.cluster,
            coordinator: data.coordinator,
            bankBalance: data.balance,
            expiringHours: data.expiring,
            daysToExpire: data.days,
            lastUpdate: new Date().toISOString()
        }));

        console.log(" [EmployeeContext] Processamento concluído.", newEmployees.length, "colaboradores únicos.");
        updateRawData(parsedRows);
        updateEmployees(newEmployees);
    };

    return (
        <EmployeeContext.Provider value={{ employees, rawData, updateEmployees, importBankData, formatBalance }}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployees = () => {
    const context = useContext(EmployeeContext);
    if (!context) throw new Error('useEmployees must be used within an EmployeeProvider');
    return context;
};
