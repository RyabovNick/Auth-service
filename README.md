# Auth-service

## routes/auth/ /api/login

Ожидает на вход данные в таком виде:

```json
{
  "username": "your_username",
  "password": "tour_password"
}
```

Проверяет, что данные заполнены и отправляет всё это на аутентификацию config/passport.js

## config/passport.js

Где описана локальная стратегия авторизации: от пользователя поступает логин/пароль, подлинность которых проверяется в универском ldap. Если всё ок возвращаются данные в виде:

```json
{
  "user": {
    "username": "ivanov.i.i",
    "fio": "Иванов Иван Иванович",
    "role": "Students",
    "caf": "Системный анализ и управления",
    "oneCcode": "100088236",
    "token": "your_token_here"
  }
}
```

Примечание: данные написаны для примера.

Если ошибка, то возвращается следующий json:

```json
{
  "msg": "error_message"
}
```

Если авторизация прошла успешна, то клиенту также возвращается его токен, который на клиенте должен быть записан в authorization header в таком виде:

`Bearer yourftokenmustbehere`

Дальше каждый запрос должен идти через этот сервис, где будет проверяться подлинность токена.

## tokenValidation /routes/tokenValidation

К api: `/api/tokenValidation`

В headers должна быть такая запись: `Bearer yourftokenmustbehere`

Его валидация проверяется на сервере:

Если токен валиден, то возвращаются данные в таком виде:

```json
{
  "username": "RyaNV.th",
  "fio": "Рябов Никита Владимирович",
  "role": "Teachers",
  "caf": "Кафедра системного анализа и управления",
  "oneCcode": "100086562",
  "exp": 1561281394,
  "iat": 1556097394
}
```

Где по атрибуту 'role' можно понять, к какой группе принадлежит и соответственно от этого плясать в вашем сервисе.

Если токен истёк:

```json
{
  "errors": {
    "message": "jwt expired",
    "error": {}
  }
}
```

Если токен подписан неверно:

```json
{
  "errors": {
    "message": "invalid signature",
    "error": {}
  }
}
```

Если у него неправильная структура:

```json
{
  "errors": {
    "message": "Unexpected token \b in JSON at position 123",
    "error": {}
  }
}
```

Т.е. если в ответном сообщени от сервера есть 'errors' - доступ не давать.
В остальном случае, проверять роль.

## ldapjs

Стоит последить. Вроде всё ок, но. https://github.com/joyent/node-ldapjs/issues/483

## drone.io

```yml
kind: pipeline
name: default

# клонирует репозиторий и каждый шаг имеет к нему доступ (клонируется 1  раз)

steps:
  # каждый шаг в контейнере
  - name: test
    image: node:10-alpine # docker-hub образ, обязателен на каждом этапе
    commands:
      - npm install
      # - npm run test
    when:
    branch:
      - master
    event:
      - push
      - pull-request

  # deploy на том же сервере
  - name: deploy
    image: docker
    # для доступа к docker на сервере
    volumes:
      - name: docker # это название глобального volumes (в самом низу файла)
        path: /var/run/docker.sock
    # env из хранилища drone (можно добавить через граф. интерфейс на сайте)
    # где крутится drone
    environment:
      NODE_ENV:
        from_secret: NODE_ENV
      SECRET:
        from_secret: SECRET
      SECRET_JWT:
        from_secret: SECRET_JWT
      PORT: 3000
    settings:
      # для того, чтобы можно было использовать в commands $NODE_ENV
      build_args_from_env:
      - NODE_ENV
      - SECRET
      - SECRET_JWT
      - PORT
    # остановка старого контейнера, его удаление (если нет, то true вернуть)
    # создание нового build (из Dockerfile)
    # запуск контейнера с volume (для логов), env параметрами
    # На порту 7445 и с названием auth_service (7445 порт даём nginx и само приложение с ssl на 8445)
    commands:
      - docker container stop auth_service || true && docker rm auth_service || true
      - docker build -t nick/auth_service .
      - docker run -v /home/auth_service_logs:/home/node/logs -e NODE_ENV=$NODE_ENV -e SECRET=$SECRET -e SECRET_JWT=$SECRET_JWT -e PORT=$PORT -p 7445:3000 -d --name=auth_service nick/auth_service

  # уведомления об успешном / неуспешно билде в телеге
  - name: telegram
    image: appleboy/drone-telegram:latest
    settings:
      token:
        from_secret: telegram_token
      to:
        from_secret: telegram_user_id
      message: >
      format: html
      message: >
        {{#success build.status}}
          <code>{{repo.owner}}/{{repo.name}}</code> <a href="{{build.link}}">SUCCESS</a>
          <code>{{commit.branch}}</code>@<a href="{{commit.link}}">{{truncate commit.sha 7}}</a>
        {{else}}
          <code>{{repo.owner}}/{{repo.name}}</code> <a href="{{build.link}}">FAILURE</a>
          <code>{{commit.branch}}</code>@<a href="{{commit.link}}">{{truncate commit.sha 7}}</a>
        {{/success}}
    when:
      status: [success, failure]
# глобальные volumes (global_volume:container_folder)
# /var/run/docker.sock:/var/run/docker.sock
volumes:
  - name: docker
    host:
      path: /var/run/docker.sock
```

```Dockerfile
FROM node:10-alpine
# для доступа не руту к global
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
# Тут надо пофиксить, чтобы запускать приложение не от рута (FIXME)
# RUN mkdir -p /home/node/auth-service && chown -R node:node /home/node/auth-service

WORKDIR /home/node/auth-service

# USER node
# https://github.com/nodejs/docker-node/issues/740

# копируем всё из директории, где Dockerfile в auth-service
ADD . /home/node/auth-service

RUN mkdir /home/node/auth-service/logs
RUN chmod 755 /home/node/auth-service/logs
# Запускаем приложение через pm2
RUN npm install pm2 -g

# Всё это на 3000 порту в контейнере
EXPOSE 3000
# Запускаем pm2
CMD [ "pm2-runtime", "index.js" ]
```
