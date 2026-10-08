# Hysteria2 / Mihomo Config

Готовый шаблон конфигурации **Mihomo / Clash** для подключения через **Hysteria2**.

## Содержимое

Репозиторий содержит:

```text
config-hy2.yaml
```

Конфигурация поддерживает:

* Hysteria2
* TUN
* DNS over HTTPS
* отдельные группы маршрутизации
* Spotify → `DIRECT / VPN`
* Telegram → `VPN / DIRECT`
* TikTok → `VPN / DIRECT`
* Apple → `DIRECT / VPN`
* Россия → `DIRECT / VPN`
* Torrents → `DIRECT / VPN`
* общий переключатель `GLOBAL`
* автоматическое обновление rule-providers

---

## Настройка

Откройте `config-hy2.yaml` и измените параметры Hysteria2:

```yaml
proxies:
  - name: "ВАШЕ_НАЗВАНИЕ_ПРОКСИ"
    type: hysteria2
    server: НАЗВАНИЕ_ИЛИ_IP_СЕРВЕРА
    port: 4433
    password: "ИМЯ:ПАРОЛЬ"
    sni: НАЗВАНИЕ_ИЛИ_IP_СЕРВЕРА
    skip-cert-verify: false
```

Необходимо указать:

```text
ВАШЕ_НАЗВАНИЕ_ПРОКСИ
НАЗВАНИЕ_ИЛИ_IP_СЕРВЕРА
ИМЯ:ПАРОЛЬ
```

Если имя прокси изменено, это же имя необходимо заменить в группе `VPN`:

```yaml
proxy-groups:

  - name: "🌍 VPN"
    type: select
    proxies:
      - "ВАШЕ_НАЗВАНИЕ_ПРОКСИ"
    default-selected: "ВАШЕ_НАЗВАНИЕ_ПРОКСИ"
```

---

## Установка конфига на сервер

После настройки файла его можно скачать напрямую из GitHub.

```bash
curl -fsSL https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml \
  -o /путь/к/вашему/config.yaml
```

Замените:

```text
/путь/к/вашему/config.yaml
```

на путь, где должен находиться клиентский конфиг.

Например:

```bash
curl -fsSL https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml \
  -o /path/to/config.yaml
```

---

## Обновление

После изменения `config-hy2.yaml` в GitHub можно получить последнюю версию той же командой:

```bash
curl -fsSL https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml \
  -o /path/to/config.yaml
```

Таким образом не требуется вручную копировать YAML с GitHub.

---

## Использование в Clash Mi

После размещения конфигурации на сервере её можно публиковать через HTTPS и добавлять в Clash Mi как **Remote Profile**.

Пример:

```text
https://example.com/path/config-hy2.yaml
```

После добавления профиля Clash Mi получает весь YAML целиком, включая:

```text
DNS
TUN
Proxies
Proxy Groups
Rule Providers
Rules
```

При изменении удалённого YAML достаточно обновить профиль в Clash Mi.

---

## Proxy Groups

В конфигурации предусмотрена отдельная группа VPN:

```text
🌍 VPN
└── Hysteria2
```

А также отдельные переключатели:

```text
Spotify
Telegram
TikTok
Apple
🇷🇺 Россия
⬇️ Torrents
```

Каждая группа позволяет выбрать:

```text
DIRECT
```

или:

```text
🌍 VPN
```

Это позволяет менять маршрут конкретного сервиса без изменения `rules`.

---

## Общий режим

Группа:

```text
🌐 GLOBAL
```

управляет трафиком, который не попал под отдельные правила.

Доступны:

```text
🌍 VPN
DIRECT
```

Это позволяет одним переключателем изменить маршрут остального трафика.

---

## Rule Providers

Конфигурация использует удалённые rule-providers.

Они автоматически обновляются через заданный `interval`.

При обновлении профиля Mihomo может получить актуальные версии наборов правил без изменения самого YAML.

---

## Проверка конфигурации

Перед использованием рекомендуется проверить YAML штатными средствами Mihomo.

Также можно проверить, что файл корректно скачивается:

```bash
curl -fsSL https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml \
  | head -20
```

---

## Безопасность

Не размещайте рабочие пароли Hysteria2 в публичном GitHub-репозитории.

В шаблоне используются placeholders:

```yaml
server: НАЗВАНИЕ_ИЛИ_IP_СЕРВЕРА
password: "ИМЯ:ПАРОЛЬ"
```

Рабочие данные необходимо указывать отдельно.

Важно помнить, что любой пользователь, получивший URL удалённого YAML, сможет загрузить содержимое конфигурации.

---

## GitHub

Repository:

https://github.com/88venom14/vpn-config-hy2

Raw config:

https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml
