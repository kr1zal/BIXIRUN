#!/bin/bash

echo "🚀 Установка зависимостей для оптимизации каталога..."

# Проверяем наличие npm или yarn
if command -v yarn &> /dev/null; then
    echo "📦 Используем yarn для установки..."
    yarn add @shopify/flash-list react-native-pager-view
else
    echo "📦 Используем npm для установки..."
    npm install @shopify/flash-list react-native-pager-view
fi

echo "✅ Зависимости установлены!"
echo ""
echo "📱 Для iOS необходимо выполнить:"
echo "cd ios && pod install"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Включите флаги в app/products.tsx:"
echo "   - useFlashList: true"
echo "   - usePagerView: true"
echo "2. Перезапустите Metro bundler"
echo "3. Пересоберите приложение"