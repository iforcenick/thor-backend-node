FROM node:carbon

WORKDIR /usr/src/app
COPY . ./
RUN npm install
RUN npm run build
RUN npm run swagger

EXPOSE 8081