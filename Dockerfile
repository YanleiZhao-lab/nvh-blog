FROM node:22-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
RUN git init -b main && git config user.email "build@nvh.test" && git config user.name "build" && git config --global --add safe.directory /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN git add -A && git commit -m "build" --allow-empty
RUN npm run docs:build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/docs/.vitepress/dist /usr/share/nginx/html
EXPOSE 80
