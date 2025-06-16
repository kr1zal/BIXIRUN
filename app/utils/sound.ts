import { Audio } from 'expo-av';

export async function playBeep() {
    try {
        const beep = require('../../assets/sounds/beep.mp3');
        if (!beep) return;
        const { sound } = await Audio.Sound.createAsync(beep);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
    } catch (e) {
        console.warn('Ошибка проигрывания бипа:', e);
    }
} 