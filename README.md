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

steps:
  - name: test
    image: node:10-alpine
    commands:
      - npm install
      # - npm run test
    when:
    branch:
      - master
    event:
      - push
      - pull-request

  - name: deploy
    image: docker
    volumes:
      - name: docker
        path: /var/run/docker.sock
    environment:
      NODE_ENV:
        from_secret: NODE_ENV
      SECRET:
        from_secret: SECRET
      SECRET_JWT:
        from_secret: SECRET_JWT
      PORT: 3000
    settings:
      build_args_from_env:
      - NODE_ENV
      - SECRET
      - SECRET_JWT
      - PORT
    commands:
      - docker container stop auth_service || true && docker rm auth_service || true
      - docker build -t nick/auth_service .
      - docker run -v /home/auth_service_logs:/home/node/logs -e NODE_ENV=$NODE_ENV -e SECRET=$SECRET -e SECRET_JWT=$SECRET_JWT -e PORT=$PORT -p 8445:3000 -d --name=auth_service nick/auth_service

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

volumes:
  - name: docker
    host:
      path: /var/run/docker.sock
```
