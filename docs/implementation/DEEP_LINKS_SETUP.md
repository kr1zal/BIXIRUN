# Настройка Deep Links (Universal Links & App Links) для BIXIRUN

Это руководство поможет вам настроить ваш домен `bixirun.com` для корректной работы ссылок, открывающих приложение BIXIRUN.

## 1. Настройка для iOS (Universal Links)

Вам нужно создать файл **без расширения** с именем `apple-app-site-association` и разместить его на вашем сервере, чтобы он был доступен по URL:

`https://bixirun.com/.well-known/apple-app-site-association`

**Важно:**
- Файл должен отдаваться с `Content-Type: application/json`.
- Сервер не должен делать редиректы для этого URL.

### Содержимое файла `apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.anonymous.BIXIRUN",
        "paths": ["/product/*"]
      }
    ]
  }
}
```

**Что нужно изменить:**
- **`YOUR_TEAM_ID`**: Замените на ваш Team ID из Apple Developer Console. Найти его можно в разделе "Membership".

## 2. Настройка для Android (App Links)

Вам нужно создать файл `assetlinks.json` и разместить его на вашем сервере, чтобы он был доступен по URL:

`https://bixirun.com/.well-known/assetlinks.json`

### Содержимое файла `assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.anonymous.BIXIRUN",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_1",
        "YOUR_SHA256_FINGERPRINT_2_IF_ANY"
      ]
    }
  }
]
```

**Что нужно изменить:**
- **`YOUR_SHA256_FINGERPRINT_...`**: Замените на SHA-256 отпечаток вашего ключа подписи приложения.
  - **Для ключа загрузки (Upload Key) из Google Play:** Его можно найти в Google Play Console в разделе `Setup > App integrity > App signing`.
  - **Для локального debug-ключа:** Выполните в папке `android` вашего проекта команду `./gradlew signingReport` и возьмите отпечаток для `debug` варианта.

---

После того как вы разместите эти файлы на вашем сервере и опубликуете новую версию приложения, ссылки вида `https://bixirun.com/product/some-slug` будут корректно открываться в приложении, если оно установлено. 