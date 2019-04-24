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
