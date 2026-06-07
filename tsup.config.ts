import { defineConfig } from 'tsup';

export default defineConfig({
  // App de servidor: o bundle so carrega o codigo-fonte; as dependencias ficam
  // externas (a imagem/host ja trazem node_modules). Sem isso, o tsup embute
  // pacotes CommonJS como o `dotenv`, cujo `require(...)` interno quebra no
  // bundle ESM com "Dynamic require of \"fs\" is not supported".
  skipNodeModulesBundle: true,
});
