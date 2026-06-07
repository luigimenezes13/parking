#!/bin/sh
set -e

# Aplica migracoes pendentes antes de subir o servidor. `migrate deploy` e
# idempotente: nos boots seguintes nao ha nada a aplicar. Roda dentro da rede
# do Railway, entao usa a DATABASE_URL interna (sem SSL).
echo "[entrypoint] applying database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] starting parking server..."
exec node dist/index.js
