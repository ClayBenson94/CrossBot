# FROM node:18.15.0-alpine
# FROM mcr.microsoft.com/playwright:v1.32.1-focal as build
FROM mcr.microsoft.com/playwright:v1.32.1-focal

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY src/ ./src/
COPY node_modules/ ./

# FROM gcr.io/distroless/nodejs

# ENV NODE_OPTIONS --no-warnings
# COPY --from=build /app /
# COPY --from=build /ms-playwright/ /root/.cache/ms-playwright
EXPOSE 8080
CMD ["node", "--no-warnings", "src/index.js"]
# CMD ["src/index.js"]