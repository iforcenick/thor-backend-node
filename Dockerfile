FROM node:carbon

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm install typescript -g
RUN npm install typescript-rest-swagger -g
RUN npm run build
RUN npm run swagger
EXPOSE 8081
