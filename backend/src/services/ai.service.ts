import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { ReportCategory } from '../types';

/**
 * Servicio de IA para análisis automático de imágenes
 * Usa Google Gemini (gratuito)
 */
class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    // Usar Gemini 1.5 Flash (rápido y gratuito)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('[AI] Gemini service initialized');
  }

  /**
   * Generar descripción automática de foto usando Gemini Vision
   */
  async analyzeImage(
    imageUrl: string,
    category: ReportCategory
  ): Promise<{
    description: string;
    tags: string[];
    severity: number; // 1-10
  }> {
    try {
      const categoryNames = {
        [ReportCategory.INFRAESTRUCTURA]: 'problemas de infraestructura (baches, calles rotas, etc)',
        [ReportCategory.INSEGURIDAD]: 'problemas de inseguridad (drogas, vandalismo, etc)',
        [ReportCategory.BASURA]: 'problemas de basura y limpieza',
        [ReportCategory.CORRUPCION]: 'problemas de corrupción (sobornos, malversación, etc)',
        [ReportCategory.OTRO]: 'otros problemas de la comunidad',
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

    } catch (error) {
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
  async moderateImage(imageUrl: string): Promise<boolean> {
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

    } catch (error) {
      console.error('[AI] Moderation failed:', error);
      return true; // En caso de error, permitir imagen
    }
  }
}

export const aiService = new AIService();
