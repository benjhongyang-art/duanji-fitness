let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

export function primeAudio(): void {
  const ctx = context();
  if (!ctx) return;
  void ctx.resume();
}

export function chime(): void {
  const ctx = context();
  if (!ctx) return;
  void ctx.resume();
  const now = ctx.currentTime;
  [0, 0.16].forEach((offset, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = index === 0 ? 740 : 988;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = now + offset;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}
