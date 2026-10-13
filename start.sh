#!/bin/bash
echo "=== Criando .env ==="
echo 'VITE_SUPABASE_URL=https://klwxuuholcskuyelxafd.supabase.co' > .env
echo 'VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsd3h1dWhvbGNza3V5ZWx4YWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDQ5MTQsImV4cCI6MjEwNjc4MDkxNH0.BDzZ0G1DFfs8PWv3PjV_G2p6tSROLaYmkZiVTBWz8LI' >> .env
echo "=== .env criado ==="
cat .env
echo ""
echo "=== Instalando dependências ==="
bun install
echo ""
echo "=== Iniciando servidor ==="
echo ">>> Quando aparecer 'ready', abra outro terminal (+) e rode:"
echo ">>> gh codespace ports visibility 8080:public -c $CODESPACE_NAME"
echo ""
echo ">>> Sua URL será:"
echo ">>> https://${CODESPACE_NAME}-8080.app.github.dev/"
echo ""
bun run dev --host
