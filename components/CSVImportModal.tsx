import React, { useState, useRef } from 'react';
import { parseCSV, validateEmployeeData, readFileAsText, downloadCSVTemplate, ValidationError, CSVRow, EmployeeCSVData } from '../utils/csvParser';

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (employees: EmployeeCSVData[]) => void;
    existingManagers: { id: string; name: string }[];
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing';

const SYSTEM_FIELDS = [
    { key: 'nome', label: 'Nome *', required: true },
    { key: 'cargo', label: 'Cargo *', required: true },
    { key: 'cluster', label: 'Cluster', required: false },
    { key: 'loja', label: 'Loja', required: false },
    { key: 'gestor', label: 'Gestor', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'telefone', label: 'Telefone', required: false },
    { key: 'dataAdmissao', label: 'Data Admissão', required: false },
    { key: 'salario', label: 'Salário', required: false },
];

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    existingManagers
}) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [validEmployees, setValidEmployees] = useState<EmployeeCSVData[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setColumnMapping({});
        setValidationErrors([]);
        setValidEmployees([]);
        setImporting(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.name.endsWith('.csv')) {
            alert('Por favor, selecione um arquivo CSV válido.');
            return;
        }

        // Validate file size (5MB max)
        if (selectedFile.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande. Tamanho máximo: 5MB');
            return;
        }

        try {
            const text = await readFileAsText(selectedFile);
            const parsed = parseCSV(text);

            if (parsed.rows.length === 0) {
                alert('Arquivo CSV vazio ou inválido.');
                return;
            }

            if (parsed.rows.length > 500) {
                alert('Máximo de 500 colaboradores por importação. Por favor, divida o arquivo.');
                return;
            }

            setFile(selectedFile);
            setCsvHeaders(parsed.headers);
            setCsvRows(parsed.rows);

            // Auto-map columns based on header names
            const autoMapping: { [key: string]: string } = {};
            SYSTEM_FIELDS.forEach(field => {
                const match = parsed.headers.find(h =>
                    h.toLowerCase().includes(field.key.toLowerCase()) ||
                    field.label.toLowerCase().includes(h.toLowerCase())
                );
                if (match) {
                    autoMapping[field.key] = match;
                }
            });
            setColumnMapping(autoMapping);

            setStep('mapping');
        } catch (error) {
            console.error('Error reading CSV:', error);
            alert('Erro ao ler arquivo CSV. Verifique o formato e encoding.');
        }
    };

    const handleMappingChange = (systemField: string, csvColumn: string) => {
        setColumnMapping(prev => ({
            ...prev,
            [systemField]: csvColumn
        }));
    };

    const handleValidateAndPreview = () => {
        const errors: ValidationError[] = [];
        const valid: EmployeeCSVData[] = [];
        const managerNames = existingManagers.map(m => m.name);

        csvRows.forEach((row, index) => {
            const result = validateEmployeeData(row, index + 2, columnMapping, managerNames);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            if (result.data) {
                valid.push(result.data);
            }
        });

        setValidationErrors(errors);
        setValidEmployees(valid);
        setStep('preview');
    };

    const handleImport = async () => {
        setImporting(true);

        // Simulate async import
        await new Promise(resolve => setTimeout(resolve, 1000));

        onImport(validEmployees);
        setImporting(false);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose} />

            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-2xl">upload_file</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Importar Colaboradores</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {step === 'upload' && 'Selecione um arquivo CSV'}
                                {step === 'mapping' && 'Mapeie as colunas do arquivo'}
                                {step === 'preview' && 'Revise os dados antes de importar'}
                                {step === 'importing' && 'Importando colaboradores...'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-highlight transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center hover:border-primary transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="size-20 rounded-2xl bg-slate-100 dark:bg-surface-highlight flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-slate-400">cloud_upload</span>
                                </div>
                                <h4 className="font-black text-lg mb-2">Arraste um arquivo CSV ou clique para selecionar</h4>
                                <p className="text-sm text-slate-500 mb-6">Tamanho máximo: 5MB | Máximo: 500 colaboradores</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                >
                                    Selecionar Arquivo
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                                    <div className="flex-1">
                                        <h5 className="font-black text-sm text-blue-900 dark:text-blue-100 mb-2">Formato do arquivo CSV</h5>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">O arquivo deve conter as seguintes colunas (mínimo):</p>
                                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 mb-4">
                                            <li>• <strong>Nome</strong> (obrigatório)</li>
                                            <li>• <strong>Cargo</strong> (obrigatório)</li>
                                            <li>• Cluster, Loja, Gestor, Email, Telefone, Data Admissão, Salário (opcionais)</li>
                                        </ul>
                                        <button
                                            onClick={downloadCSVTemplate}
                                            className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">download</span>
                                            Baixar modelo de exemplo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Column Mapping */}
                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-surface-highlight rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    <span className="font-black text-sm">Arquivo: {file?.name}</span>
                                    <span className="text-xs text-slate-500">({csvRows.length} linhas)</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-black text-sm mb-4 uppercase tracking-wider text-slate-500">Mapeamento de Colunas</h4>
                                <div className="space-y-3">
                                    {SYSTEM_FIELDS.map(field => (
                                        <div key={field.key} className="flex items-center gap-4">
                                            <div className="w-48">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {field.label}
                                                </label>
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    value={columnMapping[field.key] || ''}
                                                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-highlight text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">-- Selecione uma coluna --</option>
                                                    {csvHeaders.map(header => (
                                                        <option key={header} value={header}>{header}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-xs">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="font-bold">Certifique-se de mapear pelo menos os campos obrigatórios (Nome e Cargo)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{validEmployees.length}</p>
                                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Válidos</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-red-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-xl">error</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-red-700 dark:text-red-300">{validationErrors.length}</p>
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400">Erros</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-xl">group</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{csvRows.length}</p>
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {validationErrors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-6 max-h-64 overflow-y-auto">
                                    <h5 className="font-black text-sm text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">error</span>
                                        Erros Encontrados
                                    </h5>
                                    <div className="space-y-2">
                                        {validationErrors.map((error, idx) => (
                                            <div key={idx} className="text-xs bg-white dark:bg-red-950/40 rounded-lg p-3 border border-red-200 dark:border-red-900">
                                                <span className="font-black text-red-700 dark:text-red-300">Linha {error.row}</span>
                                                <span className="text-red-600 dark:text-red-400"> - {error.field}: </span>
                                                <span className="text-red-500 dark:text-red-500">{error.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {validEmployees.length > 0 && (
                                <div>
                                    <h5 className="font-black text-sm mb-3 uppercase tracking-wider text-slate-500">Preview dos Dados Válidos (primeiros 5)</h5>
                                    <div className="bg-slate-50 dark:bg-surface-highlight rounded-2xl p-4 overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                                    <th className="text-left py-2 px-3 font-black text-slate-600 dark:text-slate-400">Nome</th>
                                                    <th className="text-left py-2 px-3 font-black text-slate-600 dark:text-slate-400">Cargo</th>
                                                    <th className="text-left py-2 px-3 font-black text-slate-600 dark:text-slate-400">Cluster</th>
                                                    <th className="text-left py-2 px-3 font-black text-slate-600 dark:text-slate-400">Gestor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {validEmployees.slice(0, 5).map((emp, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                                        <td className="py-2 px-3 font-medium">{emp.nome}</td>
                                                        <td className="py-2 px-3">{emp.cargo}</td>
                                                        <td className="py-2 px-3 text-slate-500">{emp.cluster || '-'}</td>
                                                        <td className="py-2 px-3 text-slate-500">{emp.gestor || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {validEmployees.length > 5 && (
                                            <p className="text-center text-slate-400 text-xs mt-3 font-medium">
                                                ... e mais {validEmployees.length - 5} colaboradores
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-surface-highlight/50">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 font-black text-sm hover:bg-slate-50 dark:hover:bg-surface-highlight transition-all"
                    >
                        Cancelar
                    </button>

                    <div className="flex gap-3">
                        {step === 'mapping' && (
                            <>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-surface-highlight font-black text-sm hover:bg-slate-300 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleValidateAndPreview}
                                    disabled={!columnMapping.nome || !columnMapping.cargo}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">preview</span>
                                    Validar e Visualizar
                                </button>
                            </>
                        )}

                        {step === 'preview' && (
                            <>
                                <button
                                    onClick={() => setStep('mapping')}
                                    className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-surface-highlight font-black text-sm hover:bg-slate-300 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={validEmployees.length === 0 || importing}
                                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {importing ? (
                                        <>
                                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            Importar {validEmployees.length} Colaboradores
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
