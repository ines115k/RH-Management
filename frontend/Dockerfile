FROM node:20-alpine AS build

WORKDIR /app

# Récupérer la variable d'environnement au moment du build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Copier les dépendances
COPY package*.json ./
RUN npm install

# Copier le code et construire
COPY . .
RUN npm run build

# Servir avec nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
