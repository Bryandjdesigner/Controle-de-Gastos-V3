
import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

export const getFinancialInsights = async (expenses: Expense[]) => {
  try {
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) {
      return "⚠️ API Key não configurada. Adicione sua chave Gemini nas variáveis de ambiente.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const summary = expenses.map(e => ({
      desc: e.description,
      cat: e.category,
      val: e.expectedValue,
      paid: e.paidValue,
      status: e.status
    }));

    const prompt = `
      Como um analista financeiro sênior, analise estas despesas mensais e forneça 3 insights curtos e acionáveis em português do Brasil.
      Foque em:
      1. Pontos de economia imediata.
      2. Alerta sobre o balanço de despesas fixas vs variáveis.
      3. Uma recomendação para o próximo mês.
      
      Responda apenas com os 3 pontos em formato de lista Markdown.
      
      Dados: ${JSON.stringify(summary)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Não foi possível gerar insights agora. Verifique a configuração da sua chave de API.";
  }
};
