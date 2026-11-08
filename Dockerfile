# stage 1 frontend build folder
FROM node:20-alpine AS frontend_builder

WORKDIR /app

COPY ./frontend/package*.json /app

RUN npm install 

COPY ./frontend /app


RUN npm run build

# stage 2 fullstack container
FROM node:20-alpine 

WORKDIR /app

COPY ./backend/package*.json /app

RUN npm install 

COPY ./backend /app


COPY --from=frontend_builder /app/dist /app/public/dist

CMD [ "npm","start" ]