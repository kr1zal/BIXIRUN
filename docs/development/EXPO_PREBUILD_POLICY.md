## Политика: почему мы не используем `expo prebuild`

Коротко: проект в bare-режиме с кастомной нативкой (iOS Swift модуль
`TimerVideoRecorder`, планируется Android). `expo prebuild` перегенерирует
`ios/` и `android/` по `app.json` и config-плагинам и может удалить наши ручные
файлы и правки.

### Когда prebuild уместен

- Managed-флоу (нативные папки не коммитятся) — prebuild выполняется на билде.
- Когда все нативные изменения делаются через config-плагины.

### Почему не уместен здесь

- У нас собственные файлы: `ios/BIXIRUN/TimerVideoRecorder.swift` и
  `ios/BIXIRUN/TimerVideoRecorder.m`.
- Правки Xcode проекта (`ios/BIXIRUN.xcodeproj/project.pbxproj`) коммитятся и
  поддерживаются вручную.
- Prebuild может выкинуть модуль из таргета → `NativeModules.TimerVideoRecorder`
  не находится.

### Что делать вместо этого

- Остаёмся в bare-флоу; не запускаем `expo prebuild`.
- Собираем iOS через Xcode/EAS bare, Android — Gradle/EAS bare.

### Если prebuild запустился случайно

1. Отменить изменения в `ios/` (и при необходимости `android/`):
   - `git restore ios/` или откат коммита, затронувшего эти папки.
2. Убедиться, что файлы модуля на месте:
   - `ios/BIXIRUN/TimerVideoRecorder.swift`
   - `ios/BIXIRUN/TimerVideoRecorder.m`
3. Проверить, что оба файла подключены в таргет
   (`Build Phases → Compile Sources`).
4. Clean Build (⌘⇧K) и собрать заново.

### Долговременные защиты

- Скрипт-блокировка prebuild в `package.json` (скрипт `prebuild` завершает
  процесс с ошибкой).
- Git-хук/CI чек наличия нативных файлов и их присутствия в `project.pbxproj`.
- CODEOWNERS на критичные файлы iOS.

### План B (если однажды нужен prebuild)

- Оформить модуль как пакет с Expo config-плагином, который при prebuild
  копирует файлы и дописывает их в Xcode проект. Тогда prebuild можно вернуть
  безопасно.
