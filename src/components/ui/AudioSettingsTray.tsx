import { useState } from 'react'
import type { AppSettings } from '../../types/game'
import { soundManager } from '../../utils/soundEffects'

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
  onClose: () => void
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-amber-500' : 'bg-stone-700'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-stone-950 transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export function AudioSettingsTray({ settings, onChange, onClose }: Props) {
  const [s, setS] = useState(settings)

  const update = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    const n = { ...s, [k]: v }
    setS(n)
    onChange(n)
    if (k === 'muted') soundManager.setMuted(v as boolean)
    if (k === 'master') soundManager.setMasterVolume(v as number)
    if (k === 'sfx') soundManager.setSfxVolume(v as number)
    if (k === 'haptics') { soundManager.setHaptics(v as boolean); if (v) soundManager.vibrate([30, 50, 30]) }
    if (k === 'ambience') {
      if (v) soundManager.startKarooAmbience()
      else soundManager.stopKarooAmbience()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm max-h-[90vh] flex flex-col bg-stone-900 border-2 border-stone-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div><h2 className="text-sm font-semibold">Settings</h2><span className="text-[10px] font-mono text-stone-400">Roadside sound system &amp; AI</span></div>
          <button onClick={onClose} aria-label="Close settings" className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="flex items-center gap-3"><span className="text-xl">{s.muted ? '🔇' : '🔊'}</span><div><span className="text-xs font-semibold block">{s.muted ? 'Sound muted' : 'Audio active'}</span><span className="text-[10px] text-stone-400">Horns, sirens &amp; chimes</span></div></div>
            <Toggle on={!s.muted} label="Sound" onClick={() => update('muted', !s.muted)} />
          </div>
          <label className="block space-y-1.5"><div className="flex justify-between text-xs"><span>📻 Master volume</span><span className="font-mono text-stone-400">{s.master}%</span></div>
            <input type="range" min={0} max={100} value={s.master} disabled={s.muted} onChange={(e) => update('master', +e.target.value)} className="w-full accent-amber-500 disabled:opacity-40" /></label>
          <label className="block space-y-1.5"><div className="flex justify-between text-xs"><span>⚡ Sound effects</span><span className="font-mono text-stone-400">{s.sfx}%</span></div>
            <input type="range" min={0} max={100} value={s.sfx} disabled={s.muted} onChange={(e) => update('sfx', +e.target.value)} className="w-full accent-emerald-500 disabled:opacity-40" /></label>
          <div className="flex items-center justify-between">
            <div><span className="text-xs font-semibold block">🦗 Karoo Road Ambience</span><span className="text-[10px] text-stone-400">Breeze &amp; night crickets</span></div>
            <Toggle on={s.ambience} label="Karoo Ambience" onClick={() => update('ambience', !s.ambience)} />
          </div>
          <div className="flex items-center justify-between"><div><span className="text-xs font-semibold block">📳 Haptic vibration</span><span className="text-[10px] text-stone-400">Pothole bumps &amp; timer pulses</span></div><Toggle on={s.haptics} label="Haptics" onClick={() => update('haptics', !s.haptics)} /></div>

          {/* Mzansi Atmosphere Soundboard */}
          <div className="border-t border-stone-800 pt-3 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">🇿🇦 Mzansi Soundboard</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => soundManager.playTaxiHooter()}
                disabled={s.muted}
                className="py-2 px-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-[11px] font-semibold border border-stone-700/60 disabled:opacity-40 flex items-center gap-1.5 justify-center"
              >
                <span>🚕</span> Taxi Horn
              </button>
              <button
                type="button"
                onClick={() => soundManager.playVuvuzela(false)}
                disabled={s.muted}
                className="py-2 px-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-[11px] font-semibold border border-stone-700/60 disabled:opacity-40 flex items-center gap-1.5 justify-center"
              >
                <span>🎺</span> Vuvuzela
              </button>
              <button
                type="button"
                onClick={() => soundManager.playKettleWhistle()}
                disabled={s.muted}
                className="py-2 px-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-[11px] font-semibold border border-stone-700/60 disabled:opacity-40 flex items-center gap-1.5 justify-center"
              >
                <span>☕</span> Padstal Kettle
              </button>
              <button
                type="button"
                onClick={() => soundManager.playBraaiCrackle(2.0)}
                disabled={s.muted}
                className="py-2 px-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-[11px] font-semibold border border-stone-700/60 disabled:opacity-40 flex items-center gap-1.5 justify-center"
              >
                <span>🥩</span> Braai Crackle
              </button>
            </div>
            <button
              type="button"
              onClick={() => soundManager.playVuvuzela(true)}
              disabled={s.muted}
              className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-[11px] font-bold text-amber-300 border border-amber-500/40 disabled:opacity-40 flex items-center gap-2 justify-center"
            >
              <span>🏆🎺</span> Stadium Fanfare Blast
            </button>
          </div>

          <div className="border-t border-stone-800 pt-3 space-y-3">
            <div className="flex items-center justify-between"><div><span className="text-xs font-semibold block">✨ AI trivia &amp; banter (Gemini)</span><span className="text-[10px] text-stone-400">Fresh questions + commentary</span></div><Toggle on={s.aiTrivia} label="AI trivia" onClick={() => update('aiTrivia', !s.aiTrivia)} /></div>
            <div className="flex items-center justify-between"><div><span className="text-xs font-semibold block">🖼️ AI postcards (Fal.ai)</span><span className="text-[10px] text-stone-400">Generated art on event cards</span></div><Toggle on={s.aiVisuals} label="AI postcards" onClick={() => update('aiVisuals', !s.aiVisuals)} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioSettingsTray
