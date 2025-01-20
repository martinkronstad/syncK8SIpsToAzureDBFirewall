FROM node:20-alpine AS buildstage
WORKDIR /usr/src/app
COPY ./ ./
RUN ["npm", "install"]
RUN ["npm", "run", "build"]

FROM node:20-alpine
WORKDIR /usr/src/app
COPY ./package*.json ./
COPY --from=buildstage /usr/src/app/dist/ /usr/src/app/
RUN ["npm", "install", "--omit dev"]
CMD ["node","run.js"]