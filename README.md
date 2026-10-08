# Hysteria2 / Mihomo Config

[![CI](https://github.com/88venom14/vpn-config-hy2/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/88venom14/vpn-config-hy2/actions/workflows/validate.yml)
[![Mihomo](https://img.shields.io/badge/Mihomo-1.19%2B-blue?logo=clash&logoColor=white)](https://wiki.metacubex.one/)
[![Groups](https://img.shields.io/badge/proxy%20groups-8-success?style=flat-square&label=mihomo)](config-hy2.yaml)
[![Rule-providers](https://img.shields.io/badge/rule--providers-18-success?style=flat-square&label=mihomo)](config-hy2.yaml)
[![Rules](https://img.shields.io/badge/rules-29-success?style=flat-square&label=mihomo)](config-hy2.yaml)

Готовый шаблон конфигурации **Mihomo / Clash** для подключения через **Hysteria2**.

## Содержимое

Репозиторий содержит:

```text
config-hy2.yaml              конфигурация Mihomo / Clash
install.sh                   установка конфига с резервной копией
validate.sh                  проверка конфига
.github/workflows/           CI: Mihomo + shellcheck
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

В `config-hy2.yaml` есть четыре плейсхолдера, которые нужно заменить:

| Плейсхолдер | Где | Пример |
|---|---|---|
| `YOUR_PROXY_NAME` | `proxies[].name` и группа `🌍 VPN` | `Мой VPN` |
| `YOUR_SERVER` | `proxies[].server` | `vpn.example.com` |
| `YOUR_PASSWORD` | `proxies[].password` | `user:password` |
| `YOUR_SNI` | `proxies[].sni` | `vpn.example.com` |

```yaml
proxies:
  - name: "YOUR_PROXY_NAME"
    type: hysteria2
    server: YOUR_SERVER
    port: 4433
    password: "YOUR_PASSWORD"
    sni: YOUR_SNI
    skip-cert-verify: false
```

Значения подставляются без пробелов и кавычек, поэтому конфиг остаётся валидным
YAML даже до замены. Если переименуете прокси, то же имя нужно указать в группе `🌍 VPN`:

```yaml
proxy-groups:

  - name: "🌍 VPN"
    type: select
    proxies:
      - "YOUR_PROXY_NAME"
    default-selected: "YOUR_PROXY_NAME"
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

### Скрипт install.sh

`install.sh` делает то же самое, но дополнительно создаёт каталог, проверяет,
что файл не пустой, и сохраняет резервную копию текущего конфига с меткой времени.

```bash
chmod +x install.sh validate.sh
sudo ./install.sh /path/to/config.yaml
```

Текущий конфиг перед перезаписью копируется в:

```text
/path/to/config.yaml.bak.YYYYMMDD-HHMMSS
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

`validate.sh` проверяет конфиг в три этапа:

1. Ищет незаменённые плейсхолдеры `YOUR_SERVER`, `YOUR_PASSWORD`,
   `YOUR_PROXY_NAME`, `YOUR_SNI`.
2. Если установлен Mihomo — запускает штатную проверку `mihomo -t`.
3. Если Mihomo нет, но доступен Python с PyYAML — проверяет YAML, наличие
   обязательных секций, существование всех proxy-групп, на которые ссылаются
   правила, и наличие всех rule-providers.

```bash
./validate.sh                      # ./config-hy2.yaml по умолчанию
./validate.sh /path/to/config.yaml
```

Код возврата:

| Код | Значение |
|---|---|
| `0` | конфиг валиден |
| `1` | ошибка в конфиге или незаменённые плейсхолдеры |
| `2` | нет доступного валидатора |

Установить зависимости для fallback-проверки:

```bash
sudo apt install python3-yaml      # Debian/Ubuntu
```

Также можно проверить, что файл корректно скачивается:

```bash
curl -fsSL https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml \
  | head -20
```

---

## Проверка в CI

При каждом пуше в `main` и каждом pull request запускается
`.github/workflows/validate.yml`, который:

* скачивает свежий релиз Mihomo и проверяет конфиг через `mihomo -t`;
* прогоняет `bash -n` и `shellcheck` по `install.sh` и `validate.sh`;
* подставляет тестовые значения вместо плейсхолдеров и валидирует результат;
* запускает `validate.sh` по полученному файлу.

Пайплайн не требует секретов: проверяется только шаблон с тестовыми данными.

---

## Безопасность

Не размещайте рабочие пароли Hysteria2 в публичном GitHub-репозитории.

В шаблоне используются плейсхолдеры:

```yaml
server: YOUR_SERVER
password: "YOUR_PASSWORD"
sni: YOUR_SNI
```

Рабочие данные необходимо указывать отдельно.

Важно помнить, что любой пользователь, получивший URL удалённого YAML, сможет загрузить содержимое конфигурации.

---