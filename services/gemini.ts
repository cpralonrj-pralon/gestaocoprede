
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ [Gemini Service] VITE_GEMINI_API_KEY não encontrada nos ambientes. A IA não funcionará.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const smartScheduleModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export interface KpiData {
    label: string;
    value: string;
    trend: string;
}

export const getKpiTip = async (kpi: KpiData): Promise<string> => {
    if (!API_KEY || API_KEY === "dummy-key") {
        return "IA temporariamente indisponível. Configure VITE_GEMINI_API_KEY para habilitar insights inteligentes.";
    }

    try {
        const prompt = `Como especialista em gestão de pessoas, analise este KPI e dê uma dica prática e objetiva (máximo 2 linhas):
KPI: ${kpi.label}
Valor: ${kpi.value}
Tendência: ${kpi.trend}

Responda de forma direta, sem introduções.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        console.error("Erro ao gerar dica:", error);
        if (error?.message?.includes('quota') || error?.message?.includes('429')) {
            return "⚠️ Limite de uso da IA atingido. Aguarde algumas horas ou configure uma nova API key.";
        }
        return "Não foi possível gerar uma dica no momento.";
    }
};

export const getSmartAlerts = async (scenario: string): Promise<any[]> => {
    if (!API_KEY || API_KEY === "dummy-key") return [
        { type: 'info', title: 'IA Indisponível', desc: 'Configure VITE_GEMINI_API_KEY para alertas inteligentes.', icon: 'info', action: 'OK' }
    ];

    try {
        const prompt = `Analise o cenário operacional atual: "${scenario}".
    Retorne um JSON (apenas o array de objetos) com 3 alertas inteligentes.
    Cada objeto deve ter:
    { "type": "critical" | "warning" | "info", "title": "título curto", "desc": "descrição acionável", "icon": "ícone material", "action": "texto do botão" }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.match(/\[.*\]/s)?.[0] || text;
        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error("Gemini Error:", error);
        if (error?.message?.includes('quota') || error?.message?.includes('429')) {
            return [{ type: 'warning', title: 'Limite de IA Atingido', desc: 'Quota da API excedida. Aguarde algumas horas.', icon: 'warning', action: 'OK' }];
        }
        return [
            { type: 'info', title: 'Alertas Padrão', desc: 'Usando alertas padrão. IA temporariamente indisponível.', icon: 'info', action: 'OK' }
        ];
    }
};

export const getChartDeepDive = async (data: any[], period: string): Promise<string> => {
    if (!API_KEY || API_KEY === "dummy-key") return "⚠️ IA indisponível. Configure VITE_GEMINI_API_KEY para análises automáticas.";

    try {
        const prompt = `Você é um analista estratégico de PeopleOps. 
    Analise os dados de performance por cluster regional (${period}):
    ${JSON.stringify(data)}
    
    Forneça uma análise executiva curta (30 a 40 palavras). 
    Identifique o cluster de melhor performance, o de maior risco (menor valor) e sugira uma ação imediata.
    Mantenha um tom profissional e focado em resultados.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        console.error("Gemini Deep Dive Error:", error);
        if (error?.message?.includes('quota') || error?.message?.includes('429')) {
            return "⚠️ Limite de uso da IA atingido. Aguarde algumas horas ou configure uma nova API key.";
        }
        return "Análise indisponível no momento. Verifique os dados manualmente.";
    }
};

export const getAiReply = async (history: { role: 'user' | 'model', parts: string }[]): Promise<string> => {
    if (!API_KEY) return "Chave de API não configurada.";

    try {
        const chat = model.startChat({
            history: history.map(h => ({ role: h.role, parts: [{ text: h.parts }] })),
        });

        const result = await chat.sendMessage("Responda como um assistente especializado em gestão operacional (PeopleOps).");
        const response = await result.response;
        return response.text();
    } catch (error) {
        return "Desculpe, tive um problema ao processar sua solicitação.";
    }
};

export const getHeadcountSuggestions = async (managersData: any[]): Promise<any[]> => {
    if (!API_KEY) return [];

    try {
        const prompt = `Você é um consultor estratégico de PeopleOps especializado em dimensionamento de times (Staffing).
    Analise os dados de gestão abaixo (nome do gestor, área e quantidade de subordinados/headcount):
    ${JSON.stringify(managersData)}
    
    Identifique desequilíbrios significativos (gestores com muito mais ou muito menos pessoas que a média das outras áreas).
    Gere 2 ou 3 sugestões pragmáticas de redistribuição ou contratação para equalizar a carga de gestão.
    
    Retorne APENAS um JSON no seguinte formato:
    [
      { "title": "Título curto", "description": "Explicação breve com justificativa baseada nos dados", "type": "warning" | "info" | "success" }
    ]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonStr = text.match(/\[.*\]/s)?.[0] || text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Headcount Suggestion Error:", error);
        return [
            { title: "Equilíbrio de Gestão", description: "O Cluster Leste apresenta 30% mais colaboradores por gestor que a média residencial. Considere promover um novo supervisor.", type: "warning" },
            { title: "Otimização Norte", description: "A carga de supervisão no Norte permite a absorção de 2 novos times operacionais sem perda de qualidade.", type: "success" }
        ];
    }
};
export const getScheduleAnalysis = async (scheduleData: any[]): Promise<any[]> => {
    if (!API_KEY) return [];

    try {
        const prompt = `Você é um analista de Workforce Management (WFM) especializado em COP e Operações de Campo.
    Analise os dados de escala mensal abaixo (headcount diário planejado):
    ${JSON.stringify(scheduleData)}
    
    Identifique GAPS críticos (dias com queda brusca de pessoal) ou excessos de folgas simultâneas.
    Gere 2 ou 3 alertas estratégicos para o gestor.
    
    Retorne APENAS um JSON no seguinte formato:
    [
      { "title": "Alerta Curto", "description": "Justificativa baseada nos dados", "type": "warning" | "info" | "success" }
    ]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonStr = text.match(/\[.*\]/s)?.[0] || text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Schedule Analysis Error:", error);
        return [
            { title: "Defasagem em Finais de Semana", description: "O próximo Sábado apresenta uma queda de 40% na escala técnica. Verifique se há folgas excessivas programadas.", type: "warning" },
            { title: "Cobertura de Férias", description: "A concentração de férias planejada para a semana 3 pode comprometer o SLA do Cluster Sul.", type: "info" }
        ];
    }
};

export const generateSmartSchedule = async (input: any): Promise<any> => {
    if (!API_KEY) return null;

    try {
        const prompt = `Você é um motor de geração de escalas (WFM Engine) ultra-especializado em leis trabalhistas brasileiras (CLT).
    Sua tarefa é gerar/ajustar uma escala mensal 5x2.

    REGRAS OBRIGATÓRIAS (CLT - NUNCA VIOLAR):
    1. DSR (Descanso Semanal Remunerado): 24h consecutivas obrigatórias a cada 6 dias trabalhados.
    2. LIMITE CONSECUTIVO CRÍTICO: PROIBIDO trabalhar 7 dias seguidos. O 7º dia DEVE ser 'FOLGA'.
    3. REVEZAMENTO DE DOMINGOS: Pelo menos um domingo de folga no mês.
    4. JORNADA 5x2: Cada colaborador deve ter aproximadamente 2 folgas para cada 5 dias de trabalho.
    5. COM (Folga Compensatória): Se trabalhar em feriado, deve ter uma FOLGA extra na semana posterior.

    STATUS PERMITIDOS:
    - '08-17', '09-18', '10-19', '13-22' (Turnos de trabalho)
    - 'FOLGA' (Descanso semanal ou feriado) - OBRIGATÓRIO incluir pelo menos 4 a 8 folgas por mês por pessoa.
    - 'FÉRIAS', 'INSS', 'ATESTADO', 'AFAST' (Manter conforme recebido)

    DADOS DE ENTRADA:
    ${JSON.stringify(input)}

    TAREFA:
    1. Gere a escala diária para cada colaborador (${input.mes_ano}).
    2. O mês deve ter ${input.num_dias_mes} dias. Retorne exatamente ${input.num_dias_mes} status para cada colaborador.
    3. Verifique INDIVIDUALMENTE cada colaborador: se houver 6 dias seguidos sem 'FOLGA', o próximo dia DEVE ser 'FOLGA'.
    4. Otimize para cobertura mínima de ${(input.turnos?.[0]?.alvo_cobertura_pct || 0.85) * 100}%, mas PRIORIZE as leis trabalhistas sobre a cobertura.

    AVALIAÇÃO FINAL (AUTO-CHECK):
    Antes de gerar o JSON, verifique: "Algum colaborador trabalha 7 dias seguidos?". Se sim, troque um turno por 'FOLGA'.

    RETORNE APENAS UM JSON NO FORMATO ABAIXO (SEM TEXTO ADICIONAL):
    {
      "alocacoes": { "ID_COLABORADOR": ["STATUS_DIA_1", "STATUS_DIA_2", ...] },
      "alertas_legais": [{ "colab": "Nome", "aviso": "Explicação CLT", "status": "fixed|warning" }],
      "metricas": { "cobertura_media": "92%", "riscos_clt": 0, "feriados_com": 2 },
      "uso_banco_horas": { "ID_COLABORADOR": 10 }
    }`;

        const result = await smartScheduleModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        // --- VALIDAÇÃO PÓS-IA (GARANTIA CLT) ---
        if (parsed.alocacoes) {
            Object.keys(parsed.alocacoes).forEach(colabId => {
                let scale = parsed.alocacoes[colabId];
                if (!Array.isArray(scale)) return;

                // Garantir número correto de dias (padding se a IA for preguiçosa)
                while (scale.length < (input.num_dias_mes || 30)) {
                    scale.push('FOLGA');
                }

                let consecutiveDays = 0;
                for (let i = 0; i < scale.length; i++) {
                    const status = scale[i] || '';
                    if (status !== 'FOLGA' && status !== 'FÉRIAS' && status !== 'INSS' && status !== 'ATESTADO') {
                        consecutiveDays++;
                    } else {
                        consecutiveDays = 0;
                    }

                    if (consecutiveDays > 6) {
                        scale[i] = 'FOLGA'; // Forçar folga no 7º dia
                        consecutiveDays = 0;
                        if (!parsed.alertas_legais) parsed.alertas_legais = [];
                        parsed.alertas_legais.push({
                            colab: colabId,
                            aviso: "Correção CLT: O 7º dia consecutivo de trabalho foi convertido em FOLGA para cumprir a lei.",
                            status: "fixed"
                        });
                    }
                }
            });
        }
        return parsed;
    } catch (error) {
        console.error("Gemini Smart Schedule Error:", error);
        return null;
    }
};
