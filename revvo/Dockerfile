# Use Node.js como base
FROM node:18-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento)
RUN npm ci

# Copia o código fonte
COPY . .

# Verifica a estrutura do projeto
# Essas linhas podem ser removidas no Dockerfile final para otimização
RUN ls -la src/
RUN mkdir -p src/config

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Constrói a aplicação
RUN npm run build

# Estágio de produção com nginx
FROM nginx:alpine

# Criar usuário não-root para nginx (verificar se já existe)
RUN addgroup -g 1001 -S nginx 2>/dev/null || true && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Criar diretórios de cache e log do nginx com permissões corretas
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    mkdir -p /var/log/nginx && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/run && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx && \
    chmod -R 755 /var/run

# Copia os arquivos buildados para o nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ajustar permissões dos arquivos estáticos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar permissões da configuração do nginx
RUN chown nginx:nginx /etc/nginx/conf.d/default.conf && \
    chmod 644 /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o nginx como usuário não-root
CMD ["nginx", "-g", "daemon off;"]