# Рефералы — настройка

Раздел «Рефералы» в Профиле показывает список пользователей, пришедших по партнёрской ссылке текущего пользователя. Имя выводится по приоритету `full_name → login → login2 → #user_id`. Сумма заработанного не показывается, только количество и список.

Данные тянутся через **SHM-шаблон** — обычное API `GET /user/referrals` отдаёт только число (handler `api_referrals` в `Core/User.pm`), список — нет. Шаблонная система SHM позволяет это обойти.

> ⚠ **Важно про роуты**
> - `/public/<name>` — выполняется в контексте `user_id=1` (admin). Для нашего кейса не подходит — `user.referrals` вернёт рефералы админа, а не текущего юзера.
> - `/template/<name>` — выполняется в контексте **текущего залогиненного юзера**. Это то, что нам нужно.

Фронт зовёт `GET /template/<REFERRALS_TEMPLATE_NAME>?format=json`.

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

**Settings шаблона:**
- `deny_for_http_user`: **должно отсутствовать или быть `false`** — если `true`, обычный юзер не сможет вызвать шаблон через HTTP.
- `allow_public` — **не нужно** (это только для роута `/public/*`, который мы не используем).

### 1.2. Проверка вручную

Залогинься под обычным пользователем (с непустой `partner_id` цепочкой), открой DevTools → Application → Cookies → скопируй значение `session=...`. Затем:

```bash
curl -s 'https://api.yourdomain.com/shm/v1/template/user_referrals_list?format=json' \
  -H 'Cookie: session=ВАША_СЕССИЯ' | jq
```

Должно вернуть (стандартный SHM-конверт):
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

### 1.3. Диагностика, если приходит пусто

Добавь в шаблон debug-поля:

```tt
{{ list = [] }}
{{ FOREACH r IN user.referrals }}
{{ list.push({user_id = r.user_id, full_name = r.full_name, login = r.login, login2 = r.login2, created = r.created}) }}
{{ END }}
{{ toJson(
    count = list.size,
    items = list,
    debug_current_user_id = user.id,
    debug_current_user_login = user.login,
    debug_count_from_method = user.referrals_count
) }}
```

Открой Профиль → Рефералы → DevTools → Console. Что искать:
- `debug_current_user_id` — должно быть **именно ID текущего залогиненного юзера**. Если `1` (admin) — значит вызов идёт через `/public/*`, а должен через `/template/*` (проверь `userApi.getReferrals` URL).
- `debug_count_from_method` — что говорит `user.referrals_count`. Если 0 — у юзера действительно нет рефералов в БД. Если > 0, а `count = 0` — `FOREACH` отвалился, синтаксис.

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

### 2.2. Через `.env`

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
- Модалка делает `GET /template/<TEMPLATE_NAME>?format=json`.
- При пустом ответе показывает «Вы пока никого не пригласили».
- При HTTP-ошибке (404/403/500) — показывает то же пустое состояние + ниже красным `HTTP <code>` для диагностики.

---

## 4. Чек-лист при выкатке

- [ ] В SHM создан шаблон с именем `user_referrals_list`
- [ ] Шаблон **не** имеет `deny_for_http_user: true`
- [ ] Тело шаблона возвращает JSON с полями `count` и `items[]`
- [ ] (если имя нестандартное) В docker-compose.yml shm-client прописана `REFERRALS_TEMPLATE_NAME`
- [ ] Контейнер shm-client пересобран/перезапущен (env подхватывается на старте)
- [ ] Проверка вручную: `curl /shm/v1/template/<имя>?format=json` с cookie возвращает ожидаемый JSON
