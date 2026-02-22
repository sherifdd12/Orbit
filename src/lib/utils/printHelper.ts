/**
 * Orbit ERP - Bulletproof Print Helper
 * 
 * Opens a NEW clean browser window containing ONLY the document content,
 * then triggers native browser print. This completely bypasses all
 * Radix UI Dialog/Portal/Transform issues that corrupt print output.
 */
export function printDocument() {
  // Find the printable element: try .print-document first, then .print-area
  const printEl = (document.querySelector('.print-document') || document.querySelector('.print-area')) as HTMLElement | null
  if (!printEl) {
    // Fallback: if no print container exists, just print the whole page
    window.print()
    return
  }

  // Clone the element's full HTML content
  const content = printEl.outerHTML

  // Collect ALL stylesheets from the current page (fonts, tailwind, etc.)
  const styleSheets: string[] = []
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
    styleSheets.push(el.outerHTML)
  })

  // Detect the dir attribute for RTL support
  const dir = document.documentElement.dir || 'ltr'
  const lang = document.documentElement.lang || 'en'

  // Build the full standalone HTML page
  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>Print Document</title>
  ${styleSheets.join('\n')}
  <style>
    /* ===== CLEAN RESET FOR PRINT POPUP ===== */
    *, *::before, *::after {
      box-sizing: border-box;
      visibility: visible !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    body {
      display: flex;
      justify-content: center;
      padding: 0;
    }
    /* The document itself */
    .print-document, .print-area {
      margin: 0 auto;
      box-shadow: none !important;
      overflow: visible !important;
      border: none !important;
    }

    /* Print rules for the POPUP window (clean and simple) */
    @media print {
      @page {
        size: auto;
        margin: 5mm;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: white;
      }
      body * {
        visibility: visible !important;
      }
      .print-document, .print-area {
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: visible !important;
        position: static !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      /* Hide any buttons that might've been cloned */
      button, .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${content}
  <script>
    // Wait for fonts/images to load, then auto-trigger print
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`

  // Open a new blank window and write the document into it
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    alert('Popup blocked! Please allow popups for this site to enable printing.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
