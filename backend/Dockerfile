FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 4000

# migrate deploy aplica migrations pendentes, depois sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
