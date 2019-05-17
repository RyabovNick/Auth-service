FROM node:10-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /home/node

USER node

ADD . /home/node/

RUN mkdir /home/node/logs
RUN chown node /home/node/logs
RUN npm install pm2 -g

EXPOSE 3000

CMD [ "pm2-runtime", "index.js" ]