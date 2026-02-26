FROM node:20-alpine

WORKDIR /app

# Copy full repo so shared packages are available
COPY . .

WORKDIR /app/apps/web

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
