import OpenAI from 'openai';
import { config } from '../config';
import { ReportCategory } from '../types';

/**
 * Servicio de IA para análisis automático de imágenes
 */
class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Generar descripción automática de foto usando GPT-4 Vision
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

Responde en formato JSON:
{
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "severity": número
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3, // Más determinístico
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parsear respuesta JSON
      const analysis = JSON.parse(content);

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
   * Verificar si imagen es apropiada (content moderation)
   */
  async moderateImage(imageUrl: string): Promise<boolean> {
    try {
      const response = await this.openai.moderations.create({
        input: imageUrl,
      });

      const flagged = response.results[0]?.flagged || false;

      if (flagged) {
        console.warn(`[AI] Image flagged by moderation: ${imageUrl}`);
      }

      return !flagged;

    } catch (error) {
      console.error('[AI] Moderation failed:', error);
      return true; // En caso de error, permitir imagen
    }
  }
}

export const aiService = new AIService();
