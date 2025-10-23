# Deploy no Netlify - Revvo Gestor de Risco

## Configuração Automática

O projeto está configurado para deploy automático no Netlify através do arquivo `netlify.toml` na raiz do projeto.

## Passos para Deploy

### 1. Conectar o Repositório no Netlify

1. Acesse [Netlify](https://app.netlify.com/)
2. Clique em "Add new site" → "Import an existing project"
3. Escolha "GitHub" e selecione o repositório `revvo-gestorderisco`
4. O Netlify detectará automaticamente as configurações do `netlify.toml`

### 2. Configurações de Build (já configuradas automaticamente)

As seguintes configurações já estão no `netlify.toml`:

```toml
[build]
  base = "revvo"
  command = "npm install && npm run build"
  publish = "dist"
```

### 3. Variáveis de Ambiente (OPCIONAL)

Como o app agora funciona com dados mock, as variáveis de ambiente são opcionais.

Se quiser conectar ao Supabase futuramente, adicione no Netlify:

**Site Settings → Environment Variables:**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy

Após conectar o repositório, o Netlify fará o deploy automaticamente a cada push na branch `master`.

## Estrutura do Projeto

```
revvo-gestorderisco/
├── netlify.toml          # Configuração do Netlify
├── revvo/                # Frontend (React + Vite)
│   ├── public/
│   │   └── _redirects    # Redirecionamentos SPA
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── sap-connector/        # Backend (Python) - não deployado no Netlify
```

## Troubleshooting

### Build falha

Se o build falhar, verifique:

1. **Node Version**: O projeto requer Node 18+
2. **Dependências**: Certifique-se que todas as dependências estão no `package.json`
3. **Logs**: Verifique os logs de build no Netlify Dashboard

### Página em branco

Se a página carregar em branco:

1. Verifique se o arquivo `public/_redirects` existe
2. Verifique os logs do navegador (F12 → Console)
3. Certifique-se que o build foi feito com sucesso

### Rotas não funcionam

O arquivo `public/_redirects` garante que todas as rotas sejam redirecionadas para `index.html`:

```
/* /index.html 200
```

## URLs Importantes

- **Deploy URL**: Será fornecida pelo Netlify após o primeiro deploy
- **Preview Deploys**: Criados automaticamente para cada Pull Request
- **Dashboard**: https://app.netlify.com/

## Dados Mock

O app agora funciona completamente com dados mock para demonstração:

- ✅ Minhas Solicitações (30 registros)
- ✅ Histórico de Limites (30 registros)
- ✅ Motor de Regras (15 regras)
- ✅ Dashboard
- ✅ Análise do Cliente

Não é necessário configurar banco de dados para visualizar a aplicação funcionando.

## Comandos Úteis

```bash
# Build local para testar
cd revvo
npm install
npm run build

# Preview local do build
npm run preview

# Development
npm run dev
```

## Suporte

Para problemas específicos do Netlify, consulte:
- [Netlify Docs](https://docs.netlify.com/)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
