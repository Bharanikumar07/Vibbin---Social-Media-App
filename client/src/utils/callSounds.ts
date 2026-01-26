export class CallSoundManager {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private intervalId: number | null = null;

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public playRingback() {
        this.stop(); // Stop any existing sound
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a standard ringback tone (e.g., US/UK style: 2s on, 4s off, 400Hz + 450Hz)
        // Check if we can just do a simple beep for now to avoid complexity or loop
        this.playTone(440, 480, 2000, 4000); // 440Hz + 480Hz dial tone frequencies approximately
    }

    public playIncomingRing() {
        this.stop(); // Stop any existing sound
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a standard digital phone ring (trill)
        // e.g. 2 short pulses every 3 seconds
        this.playTrill();
    }

    private playTone(freq1: number, freq2: number, duration: number, interval: number) {
        if (!this.audioContext) return;

        const play = () => {
            if (!this.audioContext) return;
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc1.frequency.value = freq1;
            osc2.frequency.value = freq2;

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.audioContext.destination);

            gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

            osc1.start();
            osc2.start();

            setTimeout(() => {
                gain.gain.setValueAtTime(0, this.audioContext!.currentTime); // fade out slightly
                // ramping to 0 over 10ms to avoid click
                gain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.05);

                setTimeout(() => {
                    osc1.stop();
                    osc2.stop();
                    osc1.disconnect();
                    osc2.disconnect();
                    gain.disconnect();
                }, 50); // slight buffer
            }, duration);
        };

        play(); // initial play
        this.intervalId = window.setInterval(play, interval + duration);
    }

    private playTrill() {
        if (!this.audioContext) return;

        const play = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);
            osc.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.2);

            gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.6);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.6);
        };

        play();
        this.intervalId = window.setInterval(play, 2000); // Repeat every 2s
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {
                // ignore
            }
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        // Don't close context as we might reuse it, but maybe suspend?
        // Actually, keeping it open is fine for a SPA.
    }
}

export const callSoundManager = new CallSoundManager();
