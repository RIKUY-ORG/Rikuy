// src/middleware/formatResponse.ts
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      formatResponse: (data: any, options?: {
        title?: string;
        template?: 'health' | 'status' | 'metrics' | 'default';
      }) => void;
    }
  }
}

export const formatResponseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.formatResponse = function(data: any, options = {}) {
    const wantsHtml = req.accepts('html') === 'html' && 
                     !req.path.startsWith('/api/') && 
                     req.query.format !== 'json';

    if (wantsHtml) {
      const title = options.title || 'Rikuy Backend';
      const template = options.template || 'default';
      
      let content = '';
      if (template === 'health') {
        content = renderHealthHtml(data);
      } else if (template === 'status') {
        content = renderStatusHtml(data);
      } else if (template === 'metrics') {
        content = renderMetricsHtml(data);
      } else {
        content = renderDefaultHtml(data, title);
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} ${getEmoji()}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              color: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 2rem;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
            }
            .badge {
              display: inline-block;
              padding: 0.5rem 1rem;
              background: ${getEnvColor()};
              border-radius: 9999px;
              font-size: 0.875rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
            }
            .data-grid {
              background: rgba(0,0,0,0.2);
              border-radius: 10px;
              padding: 1.5rem;
              margin: 1.5rem 0;
            }
            .data-item {
              display: flex;
              justify-content: space-between;
              padding: 0.75rem 0;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .data-item:last-child {
              border-bottom: none;
            }
            .data-label {
              font-weight: 600;
              opacity: 0.9;
            }
            .data-value {
              font-family: monospace;
              background: rgba(0,0,0,0.3);
              padding: 0.25rem 0.75rem;
              border-radius: 5px;
            }
            .json-view {
              background: rgba(0,0,0,0.3);
              padding: 1rem;
              border-radius: 10px;
              font-family: monospace;
              font-size: 0.875rem;
              overflow-x: auto;
              margin: 1rem 0;
            }
            .links {
              margin-top: 2rem;
              display: flex;
              gap: 1rem;
              flex-wrap: wrap;
              justify-content: center;
            }
            .link {
              color: white;
              text-decoration: none;
              padding: 0.5rem 1rem;
              border: 1px solid rgba(255,255,255,0.3);
              border-radius: 5px;
              transition: all 0.3s;
            }
            .link:hover {
              background: rgba(255,255,255,0.2);
              border-color: white;
            }
            .raw-link {
              margin-top: 1rem;
              text-align: center;
            }
            .raw-link a {
              color: rgba(255,255,255,0.6);
              font-size: 0.875rem;
            }
            .footer {
              margin-top: 2rem;
              text-align: center;
              opacity: 0.8;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="badge">${getEnvMessage()}</div>
            <h1>🦅 ${title}</h1>
            
            ${content}

            <div class="links">
              <a href="/" class="link">← Volver al inicio</a>
              <a href="${req.path}?format=json" class="link">Ver JSON</a>
            </div>

            <div class="raw-link">
              <a href="${req.path}" target="_blank">${req.path}</a>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Rikuy - Justicia con privacidad</p>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      res.json(data);
    }
  };

  next();
};

// Funciones auxiliares para obtener info del entorno
function getEmoji(): string {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return '🚀';
  if (env === 'staging') return '🧪';
  return '🔧';
}

function getEnvColor(): string {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return '#10b981';
  if (env === 'staging') return '#f59e0b';
  return '#3b82f6';
}

function getEnvMessage(): string {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return '🚀 Modo Producción';
  if (env === 'staging') return '🧪 Modo Staging/Pruebas';
  return '🔧 Modo Desarrollo Local';
}

// Templates HTML para cada tipo de endpoint
function renderHealthHtml(data: any): string {
  return `
    <div class="data-grid">
      <div class="data-item">
        <span class="data-label">Estado:</span>
        <span class="data-value">✅ ${data.status}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Servicio:</span>
        <span class="data-value">${data.service}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Versión:</span>
        <span class="data-value">${data.version}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Tiempo activo:</span>
        <span class="data-value">${formatUptime(data.uptime)}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Entorno:</span>
        <span class="data-value">${data.environment}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Red:</span>
        <span class="data-value">${data.features.network} (Chain ID: ${data.features.chainId})</span>
      </div>
    </div>

    <h3>🔧 Features</h3>
    <div class="data-grid">
      ${Object.entries(data.features || {}).map(([key, value]) => `
        <div class="data-item">
          <span class="data-label">${key}:</span>
          <span class="data-value">${value ? '✅' : '❌'}</span>
        </div>
      `).join('')}
    </div>

    <div class="json-view">
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

function renderStatusHtml(data: any): string {
  return `
    <div class="data-grid">
      <div class="data-item">
        <span class="data-label">Wallet:</span>
        <span class="data-value">${data.data?.walletAddress || data.wallet || 'N/A'}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Verificado:</span>
        <span class="data-value">${data.data?.isVerified ? '✅ Sí' : '❌ No'}</span>
      </div>
      ${data.data?.verifiedAt ? `
      <div class="data-item">
        <span class="data-label">Verificado el:</span>
        <span class="data-value">${new Date(data.data.verifiedAt).toLocaleString()}</span>
      </div>
      ` : ''}
      ${data.data?.commitment ? `
      <div class="data-item">
        <span class="data-label">Commitment:</span>
        <span class="data-value">${data.data.commitment.substring(0, 20)}...</span>
      </div>
      ` : ''}
      <div class="data-item">
        <span class="data-label">Puede reportar:</span>
        <span class="data-value">${data.data?.canCreateReports ? '✅ Sí' : '❌ No'}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Red:</span>
        <span class="data-value">${data.network} (Chain ID: ${data.chainId})</span>
      </div>
    </div>

    <div class="json-view">
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

function renderMetricsHtml(data: any): string {
  return `
    <div class="data-grid">
      <div class="data-item">
        <span class="data-label">Total Requests:</span>
        <span class="data-value">${data.totalRequests}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Tiempo promedio:</span>
        <span class="data-value">${data.avgResponseTime}ms</span>
      </div>
      <div class="data-item">
        <span class="data-label">Tiempo activo:</span>
        <span class="data-value">${data.uptimeHuman}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Errores:</span>
        <span class="data-value">${data.errors}</span>
      </div>
    </div>

    <h3>📊 Requests por método</h3>
    <div class="data-grid">
      ${Object.entries(data.requestsByMethod || {}).map(([method, count]) => `
        <div class="data-item">
          <span class="data-label">${method}:</span>
          <span class="data-value">${count}</span>
        </div>
      `).join('')}
    </div>

    <h3>⏱️ Estadísticas de tiempo</h3>
    <div class="data-grid">
      <div class="data-item">
        <span class="data-label">Mínimo:</span>
        <span class="data-value">${data.responseTimeStats?.min}ms</span>
      </div>
      <div class="data-item">
        <span class="data-label">Máximo:</span>
        <span class="data-value">${data.responseTimeStats?.max}ms</span>
      </div>
      <div class="data-item">
        <span class="data-label">Promedio:</span>
        <span class="data-value">${data.responseTimeStats?.avg}ms</span>
      </div>
    </div>

    <div class="json-view">
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

function renderDefaultHtml(data: any, title: string): string {
  return `
    <div class="json-view">
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}