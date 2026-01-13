// CSV Parser and Validator Utility

export interface CSVRow {
    [key: string]: string;
}

export interface ValidationError {
    row: number;
    field: string;
    value: string;
    message: string;
}

export interface ParsedCSVData {
    headers: string[];
    rows: CSVRow[];
    errors: ValidationError[];
}

export interface EmployeeCSVData {
    nome: string;
    cargo: string;
    cluster?: string;
    login?: string;
    gestor?: string;
    email?: string;
    telefone?: string;
    dataAdmissao?: string;
}

const VALID_ROLES = [
    'COORDENADOR COP REDE I',
    'COORDENADOR COP REDE II',
    'ANALISTA COP REDE I',
    'ANALISTA COP REDE II',
    'GERENTE TECNICO'
];

/**
 * Detects CSV delimiter (comma or semicolon)
 */
function detectDelimiter(text: string): string {
    const firstLine = text.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parses CSV text into structured data
 */
export function parseCSV(csvText: string): ParsedCSVData {
    const delimiter = detectDelimiter(csvText);
    const lines = csvText.trim().split('\n');

    if (lines.length === 0) {
        return { headers: [], rows: [], errors: [] };
    }

    // Parse headers
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse rows
    const rows: CSVRow[] = [];
    const errors: ValidationError[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const row: CSVRow = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        rows.push(row);
    }

    return { headers, rows, errors };
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates Brazilian phone format
 */
function isValidPhone(phone: string): boolean {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone);
}

/**
 * Validates date format DD/MM/YYYY
 */
function isValidDate(date: string): boolean {
    if (!date) return true; // Optional field
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) return false;

    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDate() === day && dateObj.getMonth() === month - 1;
}


/**
 * Normalizes role name to match system roles
 */
function normalizeRole(role: string): string {
    const normalized = role.trim();

    // Check exact match first
    if (VALID_ROLES.includes(normalized)) {
        return normalized;
    }

    // Try case-insensitive match
    const match = VALID_ROLES.find(r => r.toLowerCase() === normalized.toLowerCase());
    if (match) return match;

    // Try partial matches for convenience
    const lower = normalized.toLowerCase();
    if (lower.includes('coord') && lower.includes('rede') && lower.includes('ii')) return 'COORDENADOR COP REDE II';
    if (lower.includes('coord') && lower.includes('rede') && lower.includes('i')) return 'COORDENADOR COP REDE I';
    if (lower.includes('analista') && lower.includes('rede') && lower.includes('ii')) return 'ANALISTA COP REDE II';
    if (lower.includes('analista') && lower.includes('rede') && lower.includes('i')) return 'ANALISTA COP REDE I';
    if (lower.includes('gerente') && lower.includes('tecnico')) return 'GERENTE TECNICO';

    return normalized; // Return as-is if no match
}

/**
 * Validates employee data from CSV row
 */
export function validateEmployeeData(
    row: CSVRow,
    rowIndex: number,
    columnMapping: { [key: string]: string },
    existingManagers: string[]
): { data: EmployeeCSVData | null; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const data: any = {};

    // Map columns
    Object.entries(columnMapping).forEach(([systemField, csvColumn]) => {
        data[systemField] = row[csvColumn] || '';
    });

    // Validate required fields
    if (!data.nome || data.nome.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'nome',
            value: data.nome,
            message: 'Nome é obrigatório'
        });
    }

    if (!data.cargo || data.cargo.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'cargo',
            value: data.cargo,
            message: 'Cargo é obrigatório'
        });
    } else {
        // Normalize and validate role
        const normalizedRole = normalizeRole(data.cargo);
        if (!VALID_ROLES.includes(normalizedRole)) {
            errors.push({
                row: rowIndex,
                field: 'cargo',
                value: data.cargo,
                message: `Cargo inválido. Valores aceitos: ${VALID_ROLES.join(', ')}`
            });
        } else {
            data.cargo = normalizedRole;
        }
    }

    // Validate optional fields
    if (data.email && !isValidEmail(data.email)) {
        errors.push({
            row: rowIndex,
            field: 'email',
            value: data.email,
            message: 'Email inválido'
        });
    }

    if (data.telefone && !isValidPhone(data.telefone)) {
        errors.push({
            row: rowIndex,
            field: 'telefone',
            value: data.telefone,
            message: 'Telefone inválido. Use formato: (11) 99999-9999'
        });
    }

    if (data.dataAdmissao && !isValidDate(data.dataAdmissao)) {
        errors.push({
            row: rowIndex,
            field: 'dataAdmissao',
            value: data.dataAdmissao,
            message: 'Data inválida. Use formato: DD/MM/YYYY'
        });
    }


    // Validate manager exists (if provided)
    if (data.gestor && data.gestor.trim() !== '') {
        const managerExists = existingManagers.some(
            m => m.toLowerCase() === data.gestor.toLowerCase()
        );
        if (!managerExists) {
            errors.push({
                row: rowIndex,
                field: 'gestor',
                value: data.gestor,
                message: `Gestor "${data.gestor}" não encontrado no sistema`
            });
        }
    }

    return {
        data: errors.length === 0 ? data : null,
        errors
    };
}

/**
 * Reads file as text with encoding detection
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text);
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };

        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Generates example CSV template
 */
export function generateCSVTemplate(): string {
    const headers = ['Nome', 'Cargo', 'Área', 'Login', 'Gestor', 'Email', 'Telefone', 'Data Admissão'];
    const example = [
        'João Silva,Analista I,EMPRESARIAL,joaosilva,Ana Souza,joao@email.com,(11) 99999-9999,01/01/2024',
        'Maria Santos,Coord. I,RESIDENCIAL FIBRA GPON,mariasantos,Pedro Santos,maria@email.com,(11) 98888-8888,15/02/2024'
    ];

    return [headers.join(','), ...example].join('\n');
}

/**
 * Downloads CSV template
 */
export function downloadCSVTemplate(): void {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_colaboradores.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
