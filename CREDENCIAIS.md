# 🔐 Credenciais de Acesso - Revvo Gestor de Risco

## Login da Aplicação (Modo Demo/Mock)

O sistema agora funciona em **modo demonstração** com autenticação mock.

### Qualquer credencial funciona! ✅

Para acessar o sistema, você pode usar **QUALQUER** usuário e senha.

### Credenciais Sugeridas (super simples):

**Usuário:** `admin`
**Senha:** `admin`

ou

**Usuário:** `demo`
**Senha:** `123`

ou

**Usuário:** `teste`
**Senha:** `teste`

### Também funciona com email:

**Usuário:** `admin@ideen.tech`
**Senha:** `admin`

---

## 📝 Observações Importantes:

### ✅ Sistema em Modo Mock
- **Não** requer conexão com banco de dados
- **Não** valida credenciais reais
- Aceita qualquer email válido e qualquer senha
- Perfeito para **demonstração** e **testes**

### 🎯 Validações Mínimas:
- Usuário: qualquer texto não vazio (pode ser "admin", "demo", ou um email)
- Senha: qualquer texto não vazio

### 🚀 Após o Login:
Você terá acesso completo a todas as funcionalidades:
- ✅ Dashboard
- ✅ Minhas Solicitações (30 exemplos)
- ✅ Nova Solicitação de Limite
- ✅ Análise do Cliente
- ✅ Motor de Regras (15 regras configuráveis)
- ✅ Histórico de Limites (30 transações)
- ✅ Alertas Externos
- ✅ Score Comportamental
- ✅ Configurações

### 🔄 Dados Mock Incluídos:
- 30 solicitações de limite (pendentes, aprovadas, em análise, rejeitadas)
- 30 transações no histórico de limites
- 15 regras de aprovação/recusa configuráveis
- Múltiplos clientes e cenários

### 🌐 Deploy:
Este sistema está pronto para deploy no **Netlify** ou qualquer plataforma de hospedagem estática.

---

## 🛠️ Para Desenvolvedores:

### Modo Produção (com backend real):
Se você quiser conectar ao backend real posteriormente, será necessário:

1. Configurar variáveis de ambiente no Netlify:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

2. Modificar o arquivo `Login.jsx` para usar o serviço real:
   ```javascript
   // Substituir o código mock pelo código original
   const data = await login({
     email: formData.email,
     password: formData.password,
   });
   ```

### Modo Atual:
- ✅ 100% funcional sem backend
- ✅ Perfeito para demonstrações
- ✅ Dados realistas e completos
- ✅ Sem necessidade de configuração

---

## 📞 Suporte:

Para dúvidas ou problemas:
- Verifique o console do navegador (F12)
- Consulte o README-NETLIFY.md para deploy
- Verifique os logs do Netlify se houver erros de build

---

**Desenvolvido com Claude Code** 🤖
