FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install three three-mesh-halfedge && npm ci || npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]