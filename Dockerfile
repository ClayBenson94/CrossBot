FROM node:18.15.0-alpine as build

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY src/ ./src/
RUN npm ci

FROM gcr.io/distroless/nodejs

COPY --from=build /app /
EXPOSE 8080
CMD ["src/index.js"]