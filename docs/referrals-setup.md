# Рефералы — настройка

Раздел «Рефералы» в Профиле показывает список пользователей, пришедших по партнёрской ссылке текущего пользователя. Имя выводится по приоритету `full_name → login → login2 → #user_id`. Сумма заработанного не показывается, только количество и список.

Данные тянутся через **публичный SHM-шаблон** — обычное API `GET /user/referrals` отдаёт только число (см. handler `api_referrals` в `Core/User.pm`), список — нет. Шаблонная система SHM позволяет это обойти.

---

## 1. Шаблон в SHM

### 1.1. Создать шаблон

В админке SHM (`/admin/template`) создать шаблон.

**Имя:** `user_referrals_list` (можно своё — тогда поправить env, см. п. 3).

**Тело шаблона** (Template Toolkit, синтаксис SHM с `{{ }}`):

```tt
{{ list = [] }}
{{ FOREACH r IN user.referrals }}
{{ list.push({
    user_id = r.user_id,
    full_name = r.full_name,
    login = r.login,
    login2 = r.login2,
    created = r.created
}) }}
{{ END }}
{{ toJson(
    count = list.size,
    items = list
) }}
```

**Settings шаблона** (важно):
```yaml
allow_public: true
```

Без `allow_public: true` запрос вернёт `403 Permission denied: template is not public`.

### 1.2. Проверка вручную

Залогиньтесь под обычным пользователем (с непустой `partner_id` цепочкой), затем в браузере / curl:

```bash
curl -s 'https://api.yourdomain.com/v1/public/user_referrals_list?format=json' \
  -H 'Cookie: session=...' | jq
```

Должно вернуть:
```json
{
  "data": [
    {
      "count": 3,
      "items": [
        { "user_id": 1234, "full_name": "Иван Петров", "login": "ivan", "created": "2026-04-01T..." },
        ...
      ]
    }
  ]
}
```

---

## 2. Frontend: env-переменная

Имя шаблона — настраиваемое через env. По умолчанию `user_referrals_list`. Если в админке создан с другим именем — переопределить.

### 2.1. Через `docker-compose.yml`

В сервисе `shm-client` добавить:

```yaml
shm-client:
  image: danuk/shm-client-2:latest
  ports:
    - "3001:80"
  environment:
    SHM_URL: "https://api.yourdomain.com"
    APP_NAME: "..."
    REFERRALS_TEMPLATE_NAME: "user_referrals_list"   # ← новое
  restart: unless-stopped
```

Env подхватывается на старте контейнера через `entry.sh`, которое генерирует `/app/config.js` с этим значением.

### 2.2. Через `.env` (если используешь `.env`-файл)

Добавить:
```
REFERRALS_TEMPLATE_NAME=user_referrals_list
```

И в compose сослаться: `REFERRALS_TEMPLATE_NAME: "${REFERRALS_TEMPLATE_NAME}"`.

### 2.3. Без env (дефолт)

Если ничего не задавать — фронт ждёт шаблон с именем `user_referrals_list`. Достаточно создать в SHM именно с таким именем.

---

## 3. Поведение фронта

- Карточка «Рефералы» в Профиле → клик → модалка.
- Модалка делает `GET /public/<TEMPLATE_NAME>?format=json`.
- При пустом ответе показывает «Вы пока никого не пригласили».
- При ошибке (например, шаблон не создан, нет прав, 404) — показывает то же пустое состояние, без падения. Тихий fallback.

---

## 4. Чек-лист при выкатке

- [ ] В SHM создан шаблон с именем `user_referrals_list`
- [ ] В settings шаблона выставлено `allow_public: true`
- [ ] Тело шаблона возвращает JSON с полями `count` и `items[]`
- [ ] (если имя нестандартное) В docker-compose.yml shm-client прописана `REFERRALS_TEMPLATE_NAME`
- [ ] Контейнер shm-client пересобран/перезапущен (env подхватывается на старте)
- [ ] Проверка вручную: `curl /v1/public/<имя>?format=json` возвращает ожидаемый JSON
