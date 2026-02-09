
class AudioContextService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public scanSuccess() {
    this.playTone(880, 'sine', 0.2, 0.1); // High ping
  }

  public alert() {
    this.playTone(220, 'square', 0.5, 0.1); // Low buzz
    setTimeout(() => this.playTone(220, 'square', 0.5, 0.1), 200);
  }

  public notify() {
    this.playTone(440, 'triangle', 0.3, 0.1); // Neutral blip
  }
}

export const earcons = new AudioContextService();
