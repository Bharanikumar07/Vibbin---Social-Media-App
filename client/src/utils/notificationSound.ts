// Notification sound utility
class NotificationSound {
    private enabled: boolean = true;

    constructor() {
        this.loadPreference();
    }

    private loadPreference() {
        const saved = localStorage.getItem('notificationSoundEnabled');
        this.enabled = saved !== 'false'; // Default to true
    }

    public play() {
        if (!this.enabled) return;

        try {
            // Create a new audio context each time for the beep
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.error('Failed to play notification sound:', error);
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        localStorage.setItem('notificationSoundEnabled', String(enabled));
    }

    public isEnabled(): boolean {
        return this.enabled;
    }
}

export const notificationSound = new NotificationSound();
