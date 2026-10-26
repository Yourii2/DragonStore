import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-libs';
            }
          },
          plugins: [
            {
              name: 'obfuscator-license-shield',
              renderChunk(code, chunk) {
                // Obfuscate core chunks containing activation logic
                if (chunk.fileName.includes('index')) {
                  // Temporarily mute console.log / console.info to suppress promo notice
                  const originalLog = console.log;
                  const originalInfo = console.info;
                  console.log = (...args: any[]) => {
                    if (typeof args[0] === 'string' && args[0].includes('javascript-obfuscator')) return;
                    originalLog.apply(console, args);
                  };
                  console.info = (...args: any[]) => {
                    if (typeof args[0] === 'string' && args[0].includes('javascript-obfuscator')) return;
                    originalInfo.apply(console, args);
                  };

                  let obfuscationResult;
                  try {
                    obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
                      compact: true,
                      controlFlowFlattening: true,
                      controlFlowFlatteningThreshold: 0.75,
                      deadCodeInjection: true,
                      deadCodeInjectionThreshold: 0.4,
                      debugProtection: false,
                      identifierNamesGenerator: 'hexadecimal',
                      rotateStringArray: true,
                      stringArray: true,
                      stringArrayEncoding: ['base64'],
                      stringArrayThreshold: 0.8,
                      transformObjectKeys: true,
                      splitStrings: true,
                      splitStringsChunkLength: 10
                    });
                  } finally {
                    console.log = originalLog;
                    console.info = originalInfo;
                  }

                  return { code: obfuscationResult.getObfuscatedCode(), map: null };
                }
                return null;
              }
            }
          ]
        }
      }
    },
    server: {
      allowedHosts: [
        'sales.dragon-systems.online',
        '.dragon-systems.online',
      ],
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/db_config.json',
          '**/*.json',
          '**/dist/**'
        ]
      },
    },
    preview: {
      port: 3000,
      allowedHosts: [
        'sales.dragon-systems.online',
        '.dragon-systems.online',
      ],
    },
  };
});
