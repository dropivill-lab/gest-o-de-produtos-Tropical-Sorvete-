/**
 * Utilitário profissional de impressão compatível com navegadores, 
 * dispositivos móveis e ambientes isolados (iframes / WebViews).
 */

export interface PrintOptions {
  title: string;
  elementId?: string;
  htmlContent?: string;
  filename?: string;
}

/**
 * Monta um documento HTML completo e estilizado para impressão nítida
 */
export function buildPrintableHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .print-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
    }
    .print-actions button {
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .print-actions button:hover { background: #334155; }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; }
    @media print {
      .print-actions { display: none !important; }
      body { padding: 0 !important; }
      @page { margin: 8mm; size: auto; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <span style="font-weight: 600; font-size: 13px;">Documento pronto para impressão • ${title}</span>
    <div>
      <button onclick="window.print()">🖨️ Imprimir Agora</button>
    </div>
  </div>
  <div class="print-container">
    ${bodyContent}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (err) { console.warn('Auto print failed:', err); }
      }, 400);
    });
  </script>
</body>
</html>`;
}

/**
 * Dispara a impressão com múltiplas camadas de garantia:
 * 1. Tenta abrir em nova guia via Blob (onde a impressão NUNCA é bloqueada por iframe).
 * 2. Tenta iframe oculto temporário.
 * 3. Tenta window.print() direto no documento atual.
 */
export function triggerPrint(options: PrintOptions): { success: boolean; blobUrl?: string } {
  let contentHtml = options.htmlContent || '';

  if (!contentHtml && options.elementId) {
    const el = document.getElementById(options.elementId);
    if (el) {
      contentHtml = el.innerHTML;
    }
  }

  if (!contentHtml) {
    // Fallback: tenta imprimir a janela atual se nada específico for passado
    try {
      window.print();
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  const fullDoc = buildPrintableHtml(options.title, contentHtml);
  const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  // 1. Tenta abrir a nova guia para impressão direta
  try {
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      return { success: true, blobUrl };
    }
  } catch (err) {
    console.warn('Popup blocked, attempting iframe fallback:', err);
  }

  // 2. Se o popup/nova guia foi bloqueado, tentar iframe invisível
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print failed:', iframeErr);
          // Fallback para window.print padrão
          try {
            window.print();
          } catch {}
        }
      }, 500);
    };

    return { success: true, blobUrl };
  } catch {
    // 3. Fallback final: window.print direto
    try {
      window.print();
      return { success: true, blobUrl };
    } catch {
      return { success: false, blobUrl };
    }
  }
}

/**
 * Faz o download direto de um arquivo HTML para o usuário abrir e imprimir quando desejar
 */
export function downloadPrintableFile(options: PrintOptions) {
  let contentHtml = options.htmlContent || '';
  if (!contentHtml && options.elementId) {
    const el = document.getElementById(options.elementId);
    if (el) contentHtml = el.innerHTML;
  }

  const fullDoc = buildPrintableHtml(options.title, contentHtml);
  const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename || `${options.title.toLowerCase().replace(/\s+/g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
