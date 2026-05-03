import { useState } from 'react'
import { Eye, Flame, Layers } from 'lucide-react'
 
const TABS = [
  { key: 'original', label: 'Original',  icon: Eye },
  { key: 'heatmap',  label: 'Heatmap',   icon: Flame },
  { key: 'overlay',  label: 'Overlay',   icon: Layers },
]
 
export default function GradCAMViewer({ original_b64, heatmap_b64, overlay_b64 }) {
  const [active, setActive] = useState('overlay')
 
  const src = {
    original: original_b64 ? `data:image/png;base64,${original_b64}` : null,
    heatmap:  heatmap_b64  ? `data:image/png;base64,${heatmap_b64}`  : null,
    overlay:  overlay_b64  ? `data:image/png;base64,${overlay_b64}`  : null,
  }
 
  const current = src[active] || src.original
 
  return (
    <div className="ds-card overflow-hidden">
 
      {/* Tab bar */}
      <div className="flex border-b border-ds-border">
        {TABS.map(({ key, label, icon: Icon }) => {
          const available = !!src[key]
          return (
            <button
              key={key}
              disabled={!available}
              onClick={() => setActive(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                         transition-all duration-200
                         ${!available ? 'opacity-30 cursor-not-allowed text-ds-muted' :
                           active === key
                             ? 'text-ds-teal border-b-2 border-ds-teal bg-ds-teal/5'
                             : 'text-ds-muted hover:text-ds-text'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>
 
      {/* Image */}
      <div className="relative aspect-square bg-ds-surface scanline">
        {current
          ? <img src={current} alt={active} className="w-full h-full object-contain" />
          : <div className="flex items-center justify-center h-full text-ds-muted text-sm">
              No image available
            </div>
        }
      </div>
 
      {/* Legend for heatmap */}
      {active === 'heatmap' && heatmap_b64 && (
        <div className="p-3 border-t border-ds-border">
          <div className="flex items-center justify-between text-xs text-ds-muted mb-1.5">
            <span>Low attention</span>
            <span>High attention</span>
          </div>
          <div className="h-2 rounded-full"
            style={{ background: 'linear-gradient(90deg, #00008b, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }} />
        </div>
      )}
 
      {active === 'overlay' && overlay_b64 && (
        <div className="p-3 border-t border-ds-border">
          <p className="text-xs text-ds-muted text-center">
            Warmer regions indicate areas that most influenced the model's decision
          </p>
        </div>
      )}
    </div>
  )
}
