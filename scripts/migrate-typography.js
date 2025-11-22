#!/usr/bin/env node

/**
 * Script de migración de tipografía
 *
 * Reemplaza patrones de Tailwind CSS por clases de typography system
 *
 * Uso: node scripts/migrate-typography.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Patrones de reemplazo
// Formato: [regex, replacement, description]
const PATTERNS = [
  // TÍTULOS DE PANTALLA (h1, h2)
  {
    pattern: /className="([^"]*?)text-3xl\s+font-bold([^"]*?)"/g,
    replacement: 'className="$1typography-h1$2"',
    description: 'h1: text-3xl font-bold → typography-h1'
  },
  {
    pattern: /className="([^"]*?)text-2xl\s+font-bold([^"]*?)"/g,
    replacement: 'className="$1typography-h2$2"',
    description: 'h2: text-2xl font-bold → typography-h2'
  },
  {
    pattern: /className="([^"]*?)text-2xl\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-h2$2"',
    description: 'h2: text-2xl font-semibold → typography-h2'
  },

  // DRAWER TITLES
  {
    pattern: /className="([^"]*?)text-lg\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-h3$2"',
    description: 'h3/drawer: text-lg font-semibold → typography-h3'
  },
  {
    pattern: /className="([^"]*?)text-xl\s+font-bold([^"]*?)"/g,
    replacement: 'className="$1typography-h3$2"',
    description: 'h3: text-xl font-bold → typography-h3 (normalize)'
  },

  // SECTION TITLES (dentro de drawers)
  {
    pattern: /className="([^"]*?)text-sm\s+font-semibold\s+uppercase\s+tracking-wide([^"]*?)"/g,
    replacement: 'className="$1typography-h4$2"',
    description: 'h4: text-sm font-semibold uppercase tracking-wide → typography-h4'
  },
  {
    pattern: /className="([^"]*?)font-semibold\s+text-sm\s+uppercase\s+tracking-wide([^"]*?)"/g,
    replacement: 'className="$1typography-h4$2"',
    description: 'h4: font-semibold text-sm uppercase tracking-wide → typography-h4'
  },

  // LABELS
  {
    pattern: /className="([^"]*?)text-sm\s+font-medium\s+text-muted-foreground([^"]*?)"/g,
    replacement: 'className="$1typography-label text-muted-foreground$2"',
    description: 'label: text-sm font-medium text-muted-foreground → typography-label'
  },
  {
    pattern: /className="([^"]*?)text-sm\s+font-medium([^"]*?)"/g,
    replacement: 'className="$1typography-label$2"',
    description: 'label: text-sm font-medium → typography-label'
  },
  {
    pattern: /className="([^"]*?)text-base\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-label-lg$2"',
    description: 'label-lg: text-base font-semibold → typography-label-lg'
  },

  // VALORES NUMÉRICOS
  {
    pattern: /className="([^"]*?)text-3xl\s+font-bold([^"]*?)"/g,
    replacement: 'className="$1typography-number-lg$2"',
    description: 'number-lg: text-3xl font-bold → typography-number-lg'
  },
  {
    pattern: /className="([^"]*?)text-xl\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-number-md$2"',
    description: 'number-md: text-xl font-semibold → typography-number-md'
  },
  {
    pattern: /className="([^"]*?)text-2xl\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-number-input$2"',
    description: 'number-input: text-2xl font-semibold → typography-number-input'
  },
  {
    pattern: /className="([^"]*?)text-lg\s+font-bold([^"]*?)"/g,
    replacement: 'className="$1typography-number-md$2"',
    description: 'number-md: text-lg font-bold → typography-number-md (normalize)'
  },

  // METADATA Y PEQUEÑOS
  {
    pattern: /className="([^"]*?)text-xs\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-caption$2"',
    description: 'caption: text-xs font-semibold → typography-caption'
  },
  {
    pattern: /className="([^"]*?)text-xs\s+font-medium([^"]*?)"/g,
    replacement: 'className="$1typography-caption$2"',
    description: 'caption: text-xs font-medium → typography-caption'
  },
  {
    pattern: /className="([^"]*?)text-xs\s+text-muted-foreground([^"]*?)"/g,
    replacement: 'className="$1typography-metadata$2"',
    description: 'metadata: text-xs text-muted-foreground → typography-metadata'
  },
  {
    pattern: /className="([^"]*?)text-\[10px\]\s+font-medium([^"]*?)"/g,
    replacement: 'className="$1typography-tiny$2"',
    description: 'tiny: text-[10px] font-medium → typography-tiny'
  },
  {
    pattern: /className="([^"]*?)text-\[10px\]\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-tiny$2"',
    description: 'tiny: text-[10px] font-semibold → typography-tiny'
  },

  // TEXTO BODY
  {
    pattern: /className="([^"]*?)text-lg([^"]*?)"/g,
    replacement: 'className="$1typography-body-lg$2"',
    description: 'body-lg: text-lg → typography-body-lg'
  },
  {
    pattern: /className="([^"]*?)text-sm([^"]*?)"/g,
    replacement: 'className="$1typography-body-sm$2"',
    description: 'body-sm: text-sm → typography-body-sm'
  },
  {
    pattern: /className="([^"]*?)text-base([^"]*?)"/g,
    replacement: 'className="$1typography-body$2"',
    description: 'body: text-base → typography-body'
  },

  // BOTONES
  {
    pattern: /className="([^"]*?)text-base\s+font-medium([^"]*?)"/g,
    replacement: 'className="$1typography-button$2"',
    description: 'button: text-base font-medium → typography-button'
  },
  {
    pattern: /className="([^"]*?)text-sm\s+font-semibold([^"]*?)"/g,
    replacement: 'className="$1typography-button-sm$2"',
    description: 'button-sm: text-sm font-semibold → typography-button-sm'
  },
];

// Archivos a procesar
const DIRECTORIES = [
  'src/presentation/components',
  'src/app',
];

// Archivos a excluir
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /\.spec\./,
  /\.test\./,
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

/**
 * Recorre directorios recursivamente
 */
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath, callback);
    } else if (stat.isFile() && /\.(tsx|jsx)$/.test(file)) {
      // Solo archivos .tsx y .jsx
      if (!EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))) {
        callback(filePath);
      }
    }
  });
}

/**
 * Procesa un archivo
 */
function processFile(filePath) {
  totalFiles++;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;

  PATTERNS.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      content = content.replace(pattern, replacement);
      modified = true;
      fileReplacements += count;
      totalReplacements += count;

      if (!DRY_RUN) {
        console.log(`  ✓ ${description} (${count} reemplazos)`);
      }
    }
  });

  if (modified) {
    modifiedFiles++;
    console.log(`\n📝 ${filePath}`);
    console.log(`   ${fileReplacements} reemplazos totales`);

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

/**
 * Main
 */
console.log('🎨 MIGRACIÓN DE TIPOGRAFÍA\n');
console.log(`Modo: ${DRY_RUN ? '🔍 DRY RUN (solo preview)' : '✏️  WRITE (modificará archivos)'}\n`);

DIRECTORIES.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📂 Procesando: ${dir}`);
    walkDirectory(fullPath, processFile);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN:');
console.log('='.repeat(60));
console.log(`Archivos procesados: ${totalFiles}`);
console.log(`Archivos modificados: ${modifiedFiles}`);
console.log(`Reemplazos totales: ${totalReplacements}`);

if (DRY_RUN) {
  console.log('\n⚠️  Esto fue un DRY RUN. Ningún archivo fue modificado.');
  console.log('💡 Para aplicar cambios, ejecuta: node scripts/migrate-typography.js');
} else {
  console.log('\n✅ Migración completada!');
  console.log('💡 Verifica los cambios con: git diff');
}
