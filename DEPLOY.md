# Инструкция по развёртыванию

## Требования

- Сервер с уже установленным SHM (по официальной инструкции)
- Docker + Docker Compose v2
- Домен с SSL (Certbot уже настроен вместе с SHM)

После установки SHM на сервере должно быть:
```
/opt/shm/           — SHM, работает
/etc/nginx/sites-available/bill.yourdomain.com  — nginx конфиг
```

---

## 1. Подготовка директории на сервере

```bash
mkdir -p /opt/shm_support
cd /opt/shm_support
```

---

## 2. Скачать docker-compose.yml

```bash
curl -o docker-compose.yml \
  https://raw.githubusercontent.com/k0sha/shm-client-2/main/docker-compose.yml
```

---

## 3. Создать .env файл

```bash
curl -o .env.example \
  https://raw.githubusercontent.com/k0sha/shm-client-2/main/.env.example

cp .env.example .env
nano .env
```

Заполнить все значения:

```env
# Внутренний URL SHM — через какой адрес наш бек будет обращаться к SHM API
SHM_INTERNAL_URL=https://bill.yourdomain.com

# PostgreSQL — придумать надёжные пароли
POSTGRES_USER=support
POSTGRES_PASSWORD=ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ
POSTGRES_DB=support

# MinIO — минимум 8 символов для секрета
MINIO_ACCESS_KEY=support_minio
MINIO_SECRET_KEY=ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ_MINIO

# CORS — ваш домен биллинга
CORS_ORIGIN=https://bill.yourdomain.com
```

> **Важно:** `.env` не хранится в git и не перезаписывается при обновлении.

---

## 4. Настройка nginx

Открыть существующий конфиг nginx для вашего биллинг-домена:

```bash
nano /etc/nginx/sites-available/bill.yourdomain.com
```

Добавить внутри блока `server { ... }` новый location **рядом с существующим** `/shm` location:

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

## 5. Первый запуск

### 5.1 Скачать образы и запустить сервисы

```bash
cd /opt/shm_support
docker compose pull
docker compose up -d
```

Это запустит:
- `support-api` — наш бек на порту 3002
- `postgres` — база данных
- `minio` — хранилище файлов

Проверить что всё поднялось:

```bash
docker compose ps
```

Все сервисы должны быть в статусе `running` или `healthy`.

### 5.2 Создать таблицы в базе данных

Выполняется **один раз** при первом развёртывании:

```bash
docker compose exec support-api npx prisma db push
```

### 5.3 Проверить что API отвечает

```bash
curl https://bill.yourdomain.com/shm_support/health
```

Ожидаемый ответ: `{"ok":true}`

---

## 6. Обновление

При выходе новой версии образ автоматически собирается GitHub Actions.
На сервере достаточно:

```bash
cd /opt/shm_support
docker compose pull support-api
docker compose up -d support-api
```

Если в обновлении есть изменения схемы БД (будет указано в changelog):

```bash
docker compose exec support-api npx prisma migrate deploy
```

---

## 7. Настройка MinIO (опционально)

Консоль MinIO доступна по адресу `http://IP_СЕРВЕРА:9001`

Войти с `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` из `.env`.

Бакет `support` создаётся автоматически при первом старте.

> Рекомендуется закрыть порт 9001 файрволом после настройки:
> ```bash
> ufw deny 9001
> ```

---

## 8. Полезные команды

```bash
# Логи бека
docker compose logs -f support-api

# Логи всех сервисов
docker compose logs -f

# Перезапустить бек
docker compose restart support-api

# Остановить всё
docker compose down

# Остановить и удалить данные (ОСТОРОЖНО — удалит БД и файлы)
docker compose down -v

# Подключиться к базе данных
docker compose exec postgres psql -U support -d support

# Shell внутри контейнера бека
docker compose exec support-api sh
```

---

## 9. Структура API

Базовый путь: `https://bill.yourdomain.com/shm_support/v1/`

Авторизация: заголовок `session_id` (тот же что для SHM, фронт отправляет автоматически).

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/v1/tickets` | Все | Список тикетов |
| POST | `/v1/tickets` | Все | Создать тикет |
| GET | `/v1/tickets/:id` | Все | Тикет с сообщениями и вложениями |
| PATCH | `/v1/tickets/:id` | Все | Изменить статус / взять в работу |
| POST | `/v1/tickets/:id/messages` | Все | Отправить сообщение (поддерживает файлы) |
| GET | `/v1/attachments/:id` | Все | Presigned URL для скачивания файла |
| DELETE | `/v1/tickets/:id` | Специалист | Удалить тикет |
| GET | `/health` | — | Проверка доступности |

---

## 10. Возможные проблемы

**`support-api` не стартует — ошибка подключения к postgres**

Postgres ещё инициализируется. Подождать 15 секунд:
```bash
docker compose restart support-api
```

**401 на всех запросах к API**

Проверить что `SHM_INTERNAL_URL` доступен:
```bash
curl https://bill.yourdomain.com/shm/v1/user
# Должен вернуть 401, но не ошибку соединения
```

**MinIO недоступен**

```bash
docker compose ps minio
docker compose logs minio
```

**nginx: `[emerg] unknown directive`**

Location добавлен вне блока `server { }`. Проверить структуру конфига.
