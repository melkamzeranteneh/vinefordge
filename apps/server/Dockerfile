FROM node:20-alpine

WORKDIR /app

COPY . .

WORKDIR /app/apps/server

RUN npm install

EXPOSE 4000

CMD ["npm", "run", "dev"]
