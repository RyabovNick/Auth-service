FROM node:10-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /app

USER node

ADD index.js /app/
ADD node_modules /app/node_modules

RUN npm install pm2 -g

EXPOSE 3000

CMD [ "node", "index.js" ]