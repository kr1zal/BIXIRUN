#!/bin/bash

echo "🚀 Настройка iOS проекта BIXIRUN на Mac"
echo "======================================="

# Проверка наличия Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode не установлен! Пожалуйста, установите Xcode из App Store"
    exit 1
fi

# Проверка Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
    echo "📦 Установка Xcode Command Line Tools..."
    xcode-select --install
fi

# Проверка Ruby
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby не найден. Установка через Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install ruby
fi

# Проверка CocoaPods
if ! command -v pod &> /dev/null; then
    echo "📦 Установка CocoaPods..."
    sudo gem install cocoapods
fi

# Установка npm зависимостей
echo "📦 Установка npm зависимостей..."
npm install

# Переход в iOS директорию
cd ios

# Очистка старых зависимостей
echo "🧹 Очистка старых зависимостей..."
rm -rf Pods
rm -f Podfile.lock

# Установка CocoaPods зависимостей
echo "📦 Установка CocoaPods зависимостей..."
pod install

echo ""
echo "✅ Проект готов к сборке!"
echo ""
echo "Следующие шаги:"
echo "1. Откройте ios/BIXIRUN.xcworkspace в Xcode"
echo "2. Выберите ваш iPhone в качестве устройства"
echo "3. Настройте подписи (Signing & Capabilities):"
echo "   - Включите 'Automatically manage signing'"
echo "   - Выберите ваш Apple ID в поле Team"
echo "   - Измените Bundle Identifier на уникальный"
echo "4. Нажмите Cmd+R для сборки и запуска"
echo ""
echo "⚠️  ВАЖНО: Открывайте .xcworkspace, НЕ .xcodeproj!"