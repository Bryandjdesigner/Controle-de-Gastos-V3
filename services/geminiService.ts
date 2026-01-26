import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

export const getFinancialInsights = async (expenses: Expense[]) => {
  try {
    // Initializing the GoogleGenAI client with the API key from environment variables as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const summary = expenses.map(e => ({
      desc: e.description,
      cat: e.category,
      val: e.expectedValue,
      paid: e.paidValue,
      status: e.status
    }));

    // Generating content using the gemini-3-flash-preview model with a system instruction.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes dados de despesas: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: "Você é um analista financeiro sênior. Forneça 3 insights curtos e acionáveis em português do Brasil sobre estas despesas. Foque em: 1. Pontos de economia imediata. 2. Alerta sobre o balanço de despesas fixas vs variáveis. 3. Uma recomendação para o próximo mês. Responda apenas com os 3 pontos em formato de lista Markdown.",
      }
    });
    
    // Accessing the .text property of the response directly.
    return response.text;
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Não foi possível gerar insights agora. Verifique a configuração da sua chave de API.";
  }
};