FROM node:carbon

WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm run swagger
EXPOSE 8081
