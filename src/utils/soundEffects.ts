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

  /** Two-tone Minibus Taxi Hooter ("Ga-te-way! / Bree!") */
  playTaxiHooter() {
    if (this.muted) return
    const t = this.now()
    // First short punchy beep
    this.tone(698.46, t, 0.08, 'sawtooth', 0.24) // F5
    this.tone(880, t, 0.08, 'sawtooth', 0.22) // A5
    // Second energetic beep
    this.tone(698.46, t + 0.12, 0.16, 'sawtooth', 0.26)
    this.tone(880, t + 0.12, 0.16, 'sawtooth', 0.24)
    this.vibrate([30, 40, 80])
  }

  /** Playful Doppler overtake horn when speeding past another driver */
  playOvertake() {
    if (this.muted) return
    const t = this.now()
    this.tone(850, t, 0.07, 'sawtooth', 0.2, 790)
    this.tone(940, t + 0.09, 0.11, 'sawtooth', 0.22, 870)
    this.vibrate([25, 30, 50])
  }

  /** Enamel padstal whistling kettle boiling water on gas */
  playKettleWhistle() {
    if (this.muted) return
    const ctx = this.getCtx()
    const sfx = this.sfx
    if (!ctx || !sfx) return
    const t = this.now()
    const dur = 1.2

    // Main rising whistle
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(2180, t)
    osc1.frequency.exponentialRampToValueAtTime(2680, t + dur)

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(4360, t)
    osc2.frequency.exponentialRampToValueAtTime(5360, t + dur)

    // Gentle 6.5 Hz thermal flutter vibrato
    lfo.frequency.setValueAtTime(6.5, t)
    lfoGain.gain.setValueAtTime(14, t)
    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(sfx)

    lfo.start(t)
    osc1.start(t)
    osc2.start(t)
    lfo.stop(t + dur + 0.02)
    osc1.stop(t + dur + 0.02)
    osc2.stop(t + dur + 0.02)

    // Soft escaping steam hiss
    this.noise(t + 0.1, dur - 0.1, 0.08, 'bandpass', 3000)
    this.vibrate([20, 20, 20])
  }

  /** Glowing Karoo camelthorn coals & braai chop fat sizzling */
  playBraaiCrackle(duration = 1.8) {
    if (this.muted) return
    const t = this.now()
    // Bed of coals sub-rumble
    this.tone(90, t, duration, 'sine', 0.18, 70)
    // Rich sizzling white/pink noise
    this.noise(t, duration, 0.28, 'bandpass', 2900, 2100)
    // 12 randomized sharp ember pops and sparks
    for (let i = 0; i < 12; i++) {
      const popTime = t + Math.random() * (duration - 0.1)
      const popFreq = 3400 + Math.random() * 2600
      this.noise(popTime, 0.02, 0.22, 'highpass', popFreq)
    }
    this.vibrate([20, 30, 15, 25, 30])
  }

  /** Backwards compatibility alias for playBraaiCrackle */
  playBraaiSizzle() {
    this.playBraaiCrackle(1.6)
  }

  /** Power grid blackout with transformer pop and pitch drop */
  playBlackout() {
    if (this.muted) return
    const t = this.now()
    this.tone(880, t, 0.08, 'sawtooth', 0.3)
    this.tone(220, t + 0.08, 0.6, 'sine', 0.28, 45)
    this.noise(t, 0.2, 0.4, 'lowpass', 400)
    this.vibrate([150, 40, 100])
  }

  /** Generator pull-cord & diesel engine rumble */
  playGenerator(success = true) {
    if (this.muted) return
    const t = this.now()
    this.noise(t, 0.25, 0.35, 'bandpass', 1200, 300)
    if (success) {
      this.tone(90, t + 0.25, 0.8, 'sawtooth', 0.25, 130)
      this.tone(60, t + 0.4, 0.6, 'sine', 0.2)
      this.vibrate([60, 40, 120])
    } else {
      this.tone(110, t + 0.22, 0.3, 'sine', 0.2, 50)
      this.vibrate([80, 50])
    }
  }

  /**
   * South African Vuvuzela Stadium Blast
   * Synthesized with rich Bb3 (233.08 Hz) harmonics, plastic horn resonance flare,
   * breath flutter vibrato, and optional multi-horn stadium crowd roar.
   */
  playVuvuzela(stadiumBlast = false) {
    if (this.muted) return
    const ctx = this.getCtx()
    const sfx = this.sfx
    if (!ctx || !sfx) return
    const t = this.now()

    const blastOne = (start: number, dur: number, rootFreq: number, vol: number) => {
      const osc1 = ctx.createOscillator() // Fundamental Bb3
      const osc2 = ctx.createOscillator() // 2nd harmonic
      const osc3 = ctx.createOscillator() // 3rd harmonic
      const lfo = ctx.createOscillator() // Lip buzz flutter
      const lfoGain = ctx.createGain()
      const filter = ctx.createBiquadFilter() // Plastic cone resonance
      const gain = ctx.createGain()

      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(rootFreq, start)
      osc1.frequency.exponentialRampToValueAtTime(rootFreq * 1.025, start + dur)

      osc2.type = 'sawtooth'
      osc2.frequency.setValueAtTime(rootFreq * 2, start)

      osc3.type = 'sawtooth'
      osc3.frequency.setValueAtTime(rootFreq * 3, start)

      // 5.5 Hz breath pressure flutter
      lfo.frequency.setValueAtTime(5.5, start)
      lfoGain.gain.setValueAtTime(7.5, start)
      lfo.connect(lfoGain)
      lfoGain.connect(osc1.frequency)
      lfoGain.connect(osc2.frequency)

      // Plastic bell resonance filter (around 1050 Hz)
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1050, start)
      filter.Q.setValueAtTime(2.2, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(vol * 0.9, start + dur * 0.8)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)

      osc1.connect(filter)
      osc2.connect(filter)
      osc3.connect(filter)
      filter.connect(gain)
      gain.connect(sfx)

      lfo.start(start)
      osc1.start(start)
      osc2.start(start)
      osc3.start(start)
      lfo.stop(start + dur + 0.02)
      osc1.stop(start + dur + 0.02)
      osc2.stop(start + dur + 0.02)
      osc3.stop(start + dur + 0.02)
    }

    if (!stadiumBlast) {
      // Single crisp celebratory blast
      blastOne(t, 0.9, 233.08, 0.34)
      this.vibrate([80, 40, 180])
    } else {
      // 2010 Stadium Fanfare: Punchy intro blast + long multi-horn chorus blast
      blastOne(t, 0.26, 233.08, 0.32)
      blastOne(t + 0.35, 1.8, 233.08, 0.36)
      // Slightly detuned secondary horn in the stadium stands
      blastOne(t + 0.38, 1.7, 236.4, 0.22)
      // Distant crowd roar swell
      this.noise(t + 0.4, 1.8, 0.18, 'lowpass', 1100)
      this.vibrate([100, 50, 250, 60, 400])
    }
  }

  // ---------- Ambient Soundscape Engine (Karoo Road & Crickets) ----------
  private ambienceRunning = false
  private ambienceGain: GainNode | null = null
  private ambienceTimer: ReturnType<typeof setTimeout> | null = null

  isAmbienceActive() {
    return this.ambienceRunning
  }

  startKarooAmbience() {
    if (this.ambienceRunning) return
    const ctx = this.getCtx()
    if (!ctx || !this.master) return

    this.ambienceRunning = true
    const ambienceGain = ctx.createGain()
    this.ambienceGain = ambienceGain
    ambienceGain.gain.setValueAtTime(0.001, ctx.currentTime)
    ambienceGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5)
    ambienceGain.connect(this.master)

    // Gentle warm Karoo open-road breeze
    const len = ctx.sampleRate * 4
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.4
    const breezeSrc = ctx.createBufferSource()
    breezeSrc.buffer = buf
    breezeSrc.loop = true
    const breezeFilter = ctx.createBiquadFilter()
    breezeFilter.type = 'lowpass'
    breezeFilter.frequency.setValueAtTime(320, ctx.currentTime)
    breezeSrc.connect(breezeFilter)
    breezeFilter.connect(ambienceGain)
    breezeSrc.start()

    // Periodic Karoo cricket chirps
    const chirp = () => {
      const ag = this.ambienceGain
      if (!this.ambienceRunning || !ag || !this.ctx) return
      const now = this.ctx.currentTime
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(4600 + Math.random() * 400, now)
      g.gain.setValueAtTime(0.001, now)
      g.gain.exponentialRampToValueAtTime(0.04, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      o.connect(g)
      g.connect(ag)
      o.start(now)
      o.stop(now + 0.09)

      const nextDelay = 1800 + Math.random() * 3200
      this.ambienceTimer = setTimeout(chirp, nextDelay)
    }

    chirp()
  }

  stopKarooAmbience() {
    if (!this.ambienceRunning) return
    this.ambienceRunning = false
    if (this.ambienceTimer) {
      clearTimeout(this.ambienceTimer)
      this.ambienceTimer = null
    }
    if (this.ambienceGain && this.ctx) {
      try {
        this.ambienceGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8)
        setTimeout(() => {
          this.ambienceGain?.disconnect()
          this.ambienceGain = null
        }, 900)
      } catch {
        this.ambienceGain = null
      }
    }
  }
}

export const soundManager = new SoundManager()
