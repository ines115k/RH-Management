FROM node:20-alpine AS build

WORKDIR /app

# Copier les dépendances
COPY package*.json ./
RUN npm install

# Copier le code et construire
COPY . .
RUN npm run build

# Servir avec nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
