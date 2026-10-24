/** Procedural Web Audio synthesizer — no audio asset files required. */
class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfx: GainNode | null = null
  private muted = false
  private masterVol = 0.8
  private sfxVol = 0.9
  private haptics = true

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.sfx = this.ctx.createGain()
      this.sfx.connect(this.master)
      this.master.connect(this.ctx.destination)
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private applyVolumes() {
    if (!this.ctx || !this.master || !this.sfx) return
    this.master.gain.setValueAtTime(this.muted ? 0 : this.masterVol, this.ctx.currentTime)
    this.sfx.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime)
  }

  setMuted(m: boolean) { this.muted = m; this.applyVolumes() }
  isMuted() { return this.muted }
  setMasterVolume(pct: number) { this.masterVol = Math.max(0, Math.min(1, pct / 100)); this.applyVolumes() }
  setSfxVolume(pct: number) { this.sfxVol = Math.max(0, Math.min(1, pct / 100)); this.applyVolumes() }
  setHaptics(on: boolean) { this.haptics = on }

  vibrate(pattern: number | number[] = 15) {
    if (this.haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern) } catch { /* unsupported */ }
    }
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, endFreq?: number) {
    const ctx = this.getCtx()
    if (!ctx || !this.sfx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(vol, start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g)
    g.connect(this.sfx)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private noise(start: number, dur: number, vol: number, filterType: BiquadFilterType, freq: number, endFreq?: number) {
    const ctx = this.getCtx()
    if (!ctx || !this.sfx) return
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.setValueAtTime(freq, start)
    if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, start + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.sfx)
    src.start(start)
  }

  private now() { return this.getCtx()?.currentTime ?? 0 }

  playClockTick(high = false) {
    if (this.muted) return
    this.tone(high ? 880 : 700, this.now(), 0.04, 'sine', 0.2, 120)
  }

  playTollSiren() {
    if (this.muted) return
    const t = this.now()
    this.tone(620, t, 0.18, 'sawtooth', 0.15, 940)
    this.tone(620, t + 0.22, 0.18, 'sawtooth', 0.15, 940)
    this.vibrate([80, 40, 80])
  }

  playSuccessChime() {
    if (this.muted) return
    const t = this.now()
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.08, 0.35, 'triangle', 0.25))
    this.vibrate(25)
  }

  playStreakBeep() {
    if (this.muted) return
    this.tone(1174.66, this.now(), 0.08, 'sine', 0.2)
  }

  playWrong() {
    if (this.muted) return
    const t = this.now()
    this.tone(220, t, 0.25, 'sawtooth', 0.18, 110)
    this.vibrate([60, 30, 60])
  }

  playDiceRattle() {
    if (this.muted) return
    const t = this.now()
    for (let i = 0; i < 9; i++) {
      this.noise(t + i * 0.055, 0.04, 0.35, 'bandpass', 1800 + Math.random() * 2200)
    }
    this.vibrate([20, 20, 20, 20, 20])
  }

  playTireScreech() {
    if (this.muted) return
    this.noise(this.now(), 0.7, 0.3, 'bandpass', 2600, 1400)
    this.vibrate([120, 50, 200])
  }

  playPadstalBell() {
    if (this.muted) return
    const t = this.now()
    this.tone(1800, t, 0.9, 'sine', 0.22)
    this.tone(2700, t, 0.6, 'sine', 0.1)
    this.tone(3600, t, 0.4, 'sine', 0.05)
  }

  playCardFlip() {
    if (this.muted) return
    this.noise(this.now(), 0.12, 0.2, 'highpass', 3000)
  }

  playCoin() {
    if (this.muted) return
    const t = this.now()
    this.tone(988, t, 0.08, 'square', 0.08)
    this.tone(1319, t + 0.07, 0.25, 'square', 0.08)
  }

  playFanfare() {
    if (this.muted) return
    const t = this.now()
    ;[523.25, 659.25, 783.99, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, t + i * 0.14, 0.3, 'triangle', 0.25),
    )
  }

  playMove() {
    if (this.muted) return
    this.tone(260, this.now(), 0.07, 'triangle', 0.12, 330)
  }
}

export const soundManager = new SoundManager()
