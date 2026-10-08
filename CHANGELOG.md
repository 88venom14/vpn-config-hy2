# Changelog

Все заметные изменения проекта документируются здесь.

## [Unreleased]

### Fixed
- `install.sh` and `validate.sh` no longer wrapped in Markdown fences — both are valid shell scripts again
- Placeholders changed from `ВАШЕ_НАЗВАНИЕ_ПРОКСИ` / `НАЗВАНИЕ_ИЛИ_IP_СЕРВЕРА` / `ИМЯ:ПАРОЛЬ` to `YOUR_PROXY_NAME` / `YOUR_SERVER` / `YOUR_PASSWORD` / `YOUR_SNI`; the previous values contained spaces and produced invalid YAML
- Removed the previously hardcoded SNI domain from `sniffer.skip-domain` and `proxies[].sni`
- `validate.sh` now fails on leftover placeholders
- `validate.sh` now verifies that every rule target is a known proxy group and that every `RULE-SET` reference has a matching `rule-providers` entry
- `validate.sh` documents exit codes and supports a configurable config path

### Added
- `.github/workflows/validate.yml` — CI running Mihomo, `bash -n` and `shellcheck`
- `validate.sh` install instructions in README
- Placeholder reference table in README

## [1.0.0] - 2026-10-08

### Added
- Initial Mihomo configuration
- Hysteria2 support
- TUN configuration
- DNS configuration
- Rule providers
- Routing rules