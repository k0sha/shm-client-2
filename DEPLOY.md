# Инструкция по развёртыванию

## Требования

- Сервер с уже установленным SHM (по официальной инструкции)
- Docker + Docker Compose v2
- Git
- Домен с SSL (Certbot уже настроен вместе с SHM)

После установки SHM на сервере должно быть:
```
/opt/shm/           — SHM, работает
/etc/nginx/sites-available/bill.yourdomain.com  — nginx конфиг
```

---

## 1. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/k0sha/shm-client-2.git shm_support
cd /opt/shm_support
```

---

## 2. Создание .env файла

```bash
cp .env.example .env
nano .env
```

Заполнить все значения:

```env
# Внутренний URL SHM — через какой адрес наш бек будет обращаться к SHM API
# Используем внешний домен (он же резолвится локально через nginx)
SHM_INTERNAL_URL=https://bill.yourdomain.com

# PostgreSQL — придумать надёжные пароли
POSTGRES_USER=support
POSTGRES_PASSWORD=ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ
POSTGRES_DB=support

# MinIO — придумать надёжные пароли (минимум 8 символов для секрета)
MINIO_ACCESS_KEY=support_minio
MINIO_SECRET_KEY=ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ_MINIO

# CORS — ваш домен биллинга
CORS_ORIGIN=https://bill.yourdomain.com
```

> **Важно:** `.env` нельзя коммитить в git. Он уже добавлен в `.gitignore`.

---

## 3. Настройка nginx

Открыть существующий конфиг nginx для вашего биллинг-домена:

```bash
nano /etc/nginx/sites-available/bill.yourdomain.com
```

Найти блок `server` с `server_name bill.yourdomain.com` и добавить внутри него новый `location` **рядом с существующим** `/shm` location:

```nginx
location /shm_support/ {
    proxy_pass         http://127.0.0.1:3002/;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   session_id $http_session_id;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
    client_max_body_size 25M;
}
```

Проверить и применить:

```bash
nginx -t && systemctl reload nginx
```

---

## 4. Первый запуск

### 4.1 Собрать и запустить сервисы

```bash
cd /opt/shm_support
docker compose up -d --build
```

Это запустит:
- `support-api` — наш бек на порту 3002
- `postgres` — база данных
- `minio` — хранилище файлов

Проверить что всё поднялось:

```bash
docker compose ps
```

Все сервисы должны быть `healthy` или `running`.

### 4.2 Создать таблицы в базе данных

```bash
docker compose exec support-api npx prisma migrate deploy
```

Если выходит ошибка что миграций нет — выполнить вместо этого:

```bash
docker compose exec support-api npx prisma db push
```

### 4.3 Проверить что API отвечает

```bash
curl https://bill.yourdomain.com/shm_support/health
```

Ожидаемый ответ: `{"ok":true}`

---

## 5. Настройка MinIO

MinIO консоль доступна по адресу `http://IP_СЕРВЕРА:9001`

> Порт 9001 открыт только для прямого доступа. Закрыть его файрволом после первоначальной настройки если не нужен постоянный доступ.

Войти с `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` из `.env`.

Бакет `support` создаётся автоматически при старте сервиса. Убедиться что он появился в разделе **Buckets**.

---

## 6. Обновление

При выходе новых версий:

```bash
cd /opt/shm_support
git pull
docker compose up -d --build support-api
```

Если изменилась схема БД (новые миграции):

```bash
docker compose exec support-api npx prisma migrate deploy
```

---

## 7. Полезные команды

```bash
# Посмотреть логи бека
docker compose logs -f support-api

# Посмотреть логи всех сервисов
docker compose logs -f

# Перезапустить только бек
docker compose restart support-api

# Остановить всё
docker compose down

# Остановить и удалить данные (ОСТОРОЖНО — удалит БД и файлы)
docker compose down -v

# Подключиться к базе данных
docker compose exec postgres psql -U support -d support

# Открыть shell в контейнере бека
docker compose exec support-api sh
```

---

## 8. Структура API

Базовый путь: `https://bill.yourdomain.com/shm_support/v1/`

Авторизация: через заголовок `session_id` (тот же что и для SHM, фронт отправляет автоматически).

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/v1/tickets` | Все | Список тикетов (пользователь — свои, специалист — все) |
| POST | `/v1/tickets` | Все | Создать тикет |
| GET | `/v1/tickets/:id` | Все | Тикет с сообщениями |
| PATCH | `/v1/tickets/:id` | Все | Изменить статус / взять в работу |
| POST | `/v1/tickets/:id/messages` | Все | Отправить сообщение (multipart, поддерживает файлы) |
| GET | `/v1/attachments/:id` | Все | Получить presigned URL для скачивания файла |
| DELETE | `/v1/tickets/:id` | Специалист | Удалить тикет |
| GET | `/health` | — | Проверка доступности |

---

## 9. Возможные проблемы

**`support-api` не стартует — ошибка подключения к postgres**

Postgres ещё не готов. Подождать 10–15 секунд и повторить:
```bash
docker compose restart support-api
```

**Ошибка верификации сессии (401 на всех запросах)**

Проверить что `SHM_INTERNAL_URL` в `.env` доступен с сервера:
```bash
curl https://bill.yourdomain.com/shm/v1/user
```
Должен вернуть `401` (не ошибку соединения). Если ошибка соединения — неверный URL.

**MinIO недоступен из контейнера бека**

Проверить что сервис `minio` запущен:
```bash
docker compose ps minio
docker compose logs minio
```

**`nginx -t` возвращает ошибку**

Скорее всего синтаксическая ошибка при добавлении location. Проверить что location добавлен **внутри** блока `server { }`, а не снаружи.
