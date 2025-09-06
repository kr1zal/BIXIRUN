
export async function playBeep() {
    try {
        // Временно отключаем звук до замены файла
        console.log('Звук отключен - требуется корректный звуковой файл');
        return;

    } catch (e) {
        console.error('Ошибка проигрывания звука:', e);
        // Не показываем Alert, только логируем
    }
} 