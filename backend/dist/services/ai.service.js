"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const types_1 = require("../types");
/**
 * Servicio de IA para análisis automático de imágenes
 * Usa Google Gemini (gratuito)
 */
class AIService {
    genAI;
    model;
    constructor() {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.ai.geminiApiKey);
        // Usar Gemini Pro Vision (compatible y disponible)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        console.log('[AI] Gemini service initialized');
    }
    /**
     * Generar descripción automática de foto usando Gemini Vision
     */
    async analyzeImage(imageUrl, category) {
        try {
            const categoryNames = {
                [types_1.ReportCategory.INFRAESTRUCTURA]: 'problemas de infraestructura (baches, calles rotas, etc)',
                [types_1.ReportCategory.INSEGURIDAD]: 'problemas de inseguridad (drogas, vandalismo, etc)',
                [types_1.ReportCategory.BASURA]: 'problemas de basura y limpieza',
                [types_1.ReportCategory.CORRUPCION]: 'problemas de corrupción (sobornos, malversación, etc)',
                [types_1.ReportCategory.OTRO]: 'otros problemas de la comunidad',
            };
            const prompt = `Analiza esta imagen de un reporte ciudadano sobre ${categoryNames[category]}.

Genera:
1. Una descripción objetiva y concisa (máximo 2 oraciones)
2. Tags relevantes (3-5 palabras clave en español)
3. Nivel de severidad del 1 al 10 (1=menor, 10=crítico)

Responde SOLO en formato JSON válido, sin texto adicional:
{
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "severity": número
}`;
            // Descargar imagen y convertir a base64
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            // Enviar a Gemini
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64,
                    },
                },
            ]);
            const text = result.response.text();
            // Limpiar la respuesta (a veces Gemini agrega ```json o comentarios)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`[AI] Image analyzed: ${analysis.description.substring(0, 50)}...`);
            return {
                description: analysis.description,
                tags: analysis.tags || [],
                severity: analysis.severity || 5,
            };
        }
        catch (error) {
            console.error('[AI] Image analysis failed:', error);
            // Fallback: descripción genérica
            return {
                description: 'Reporte ciudadano pendiente de revisión.',
                tags: ['pendiente'],
                severity: 5,
            };
        }
    }
    /**
     * Verificar si imagen es apropiada (content moderation con Gemini)
     */
    async moderateImage(imageUrl) {
        try {
            // Descargar imagen
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const prompt = `Analiza esta imagen y determina si es apropiada para un reporte ciudadano.

La imagen NO debe contener:
- Contenido explícitamente sexual o NSFW
- Violencia gráfica extrema
- Contenido que incite al odio

La imagen SÍ puede contener:
- Problemas de infraestructura (baches, calles dañadas)
- Basura o suciedad
- Grafitis o vandalismo menor
- Situaciones de inseguridad sin violencia extrema

Responde SOLO con un JSON:
{
  "appropriate": true/false,
  "reason": "explicación breve si no es apropiada"
}`;
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64,
                    },
                },
            ]);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('[AI] Could not parse moderation response, allowing image');
                return true;
            }
            const moderation = JSON.parse(jsonMatch[0]);
            if (!moderation.appropriate) {
                console.warn(`[AI] Image flagged: ${moderation.reason}`);
            }
            return moderation.appropriate;
        }
        catch (error) {
            console.error('[AI] Moderation failed:', error);
            return true; // En caso de error, permitir imagen
        }
    }
}
exports.aiService = new AIService();
