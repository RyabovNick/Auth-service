FROM node:10-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# RUN mkdir -p /home/node/auth-service && chown -R node:node /home/node/auth-service

WORKDIR /home/node/auth-service

# USER node

ADD . /home/node/auth-service

RUN mkdir /home/node/auth-service/logs
RUN chmod 755 /home/node/auth-service/logs
RUN npm install pm2 -g
RUN pm2 startup

EXPOSE 3000

CMD [ "pm2-runtime", "index.js" ]