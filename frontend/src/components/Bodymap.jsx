import { useState } from 'react'
 
const LOCATIONS = [
  { id:'scalp',          label:'Scalp',             cx:100, cy:28 },
  { id:'face',           label:'Face',              cx:100, cy:55 },
  { id:'neck',           label:'Neck',              cx:100, cy:82 },
  { id:'chest',          label:'Chest',             cx:100, cy:120 },
  { id:'abdomen',        label:'Abdomen',           cx:100, cy:160 },
  { id:'left_shoulder',  label:'Left Shoulder',     cx:60,  cy:105 },
  { id:'right_shoulder', label:'Right Shoulder',    cx:140, cy:105 },
  { id:'left_upperarm',  label:'Left Upper Arm',    cx:48,  cy:130 },
  { id:'right_upperarm', label:'Right Upper Arm',   cx:152, cy:130 },
  { id:'left_forearm',   label:'Left Forearm',      cx:38,  cy:162 },
  { id:'right_forearm',  label:'Right Forearm',     cx:162, cy:162 },
  { id:'left_hand',      label:'Left Hand',         cx:28,  cy:192 },
  { id:'right_hand',     label:'Right Hand',        cx:172, cy:192 },
  { id:'left_thigh',     label:'Left Thigh',        cx:82,  cy:218 },
  { id:'right_thigh',    label:'Right Thigh',       cx:118, cy:218 },
  { id:'left_knee',      label:'Left Knee',         cx:80,  cy:258 },
  { id:'right_knee',     label:'Right Knee',        cx:120, cy:258 },
  { id:'left_shin',      label:'Left Shin',         cx:80,  cy:293 },
  { id:'right_shin',     label:'Right Shin',        cx:120, cy:293 },
  { id:'left_foot',      label:'Left Foot',         cx:78,  cy:328 },
  { id:'right_foot',     label:'Right Foot',        cx:122, cy:328 },
  { id:'upper_back',     label:'Upper Back',        cx:100, cy:120 },
  { id:'lower_back',     label:'Lower Back',        cx:100, cy:165 },
]
 
export default function BodyMap({ selected, onSelect, visits = [] }) {
  const [hovered, setHovered] = useState(null)
 
  // Build a set of all locations that already have visits
  const visitedLocs = new Set(visits.map(v => v.body_location).filter(Boolean))
 
  return (
    <div className="ds-card p-5">
      <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">
        Anatomical Location
      </p>
      <p className="font-display font-semibold text-ds-text text-sm mb-4">
        {selected
          ? `Selected: ${LOCATIONS.find(l=>l.id===selected)?.label || selected}`
          : 'Click a region to tag the lesion location'}
      </p>
 
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 360"
          className="w-48 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Body silhouette ── */}
          {/* Head */}
          <ellipse cx="100" cy="28" rx="22" ry="26" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Neck */}
          <rect x="91" y="50" width="18" height="18" rx="4" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Torso */}
          <rect x="68" y="66" width="64" height="110" rx="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Left arm */}
          <rect x="40" y="72" width="28" height="110" rx="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Right arm */}
          <rect x="132" y="72" width="28" height="110" rx="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Left hand */}
          <ellipse cx="54" cy="193" rx="13" ry="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Right hand */}
          <ellipse cx="146" cy="193" rx="13" ry="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Left leg */}
          <rect x="70" y="176" width="28" height="130" rx="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Right leg */}
          <rect x="102" y="176" width="28" height="130" rx="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Left foot */}
          <ellipse cx="84" cy="316" rx="16" ry="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
          {/* Right foot */}
          <ellipse cx="116" cy="316" rx="16" ry="10" fill="#1A2E4A" stroke="#2A4060" strokeWidth="1.2"/>
 
          {/* ── Hit targets ── */}
          {LOCATIONS.map(loc => {
            const isSelected = selected === loc.id
            const isVisited  = visitedLocs.has(loc.id)
            const isHovered  = hovered === loc.id
            return (
              <g key={loc.id}
                 onClick={() => onSelect && onSelect(loc.id)}
                 onMouseEnter={() => setHovered(loc.id)}
                 onMouseLeave={() => setHovered(null)}
                 style={{ cursor: onSelect ? 'pointer' : 'default' }}>
                <circle
                  cx={loc.cx} cy={loc.cy} r="10"
                  fill={isSelected ? 'rgba(0,217,192,0.35)'
                      : isHovered   ? 'rgba(0,217,192,0.15)'
                      : isVisited   ? 'rgba(255,76,106,0.15)'
                      :               'transparent'}
                  stroke={isSelected ? '#00D9C0'
                        : isHovered   ? '#00D9C080'
                        : isVisited   ? '#FF4C6A80'
                        :               'transparent'}
                  strokeWidth="1.5"
                />
                {isSelected && (
                  <circle cx={loc.cx} cy={loc.cy} r="5"
                    fill="#00D9C0" />
                )}
                {isVisited && !isSelected && (
                  <circle cx={loc.cx} cy={loc.cy} r="4"
                    fill="#FF4C6A80" />
                )}
              </g>
            )
          })}
 
          {/* Tooltip */}
          {hovered && (() => {
            const loc = LOCATIONS.find(l => l.id === hovered)
            if (!loc) return null
            const tx = loc.cx > 130 ? loc.cx - 55 : loc.cx + 12
            const ty = loc.cy - 10
            return (
              <g>
                <rect x={tx-2} y={ty-12} width={60} height={16}
                  rx="4" fill="#0D1625" stroke="#1A2E4A" strokeWidth="0.8"/>
                <text x={tx+28} y={ty} textAnchor="middle"
                  fill="#D8E8FF" fontSize="8" fontFamily="monospace">
                  {loc.label}
                </text>
              </g>
            )
          })()}
        </svg>
      </div>
 
      {/* Legend */}
      <div className="flex gap-4 justify-center mt-3">
        {[['Selected','ds-teal'],['Has Visit','ds-red'],['Untagged','ds-border']].map(([l,c])=>(
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full bg-${c}`} />
            <span className="text-xs text-ds-muted">{l}</span>
          </div>
        ))}
      </div>
 
      {selected && onSelect && (
        <button
          onClick={() => onSelect(null)}
          className="mt-3 w-full text-xs text-ds-muted hover:text-ds-red transition-colors py-1"
        >
          Clear selection
        </button>
      )}
    </div>
  )
}