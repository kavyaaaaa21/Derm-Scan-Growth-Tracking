const CRITERIA = [
  { key: 'asymmetry', letter: 'A', label: 'Asymmetry',   tip: 'Shape uniformity across axes' },
  { key: 'border',    letter: 'B', label: 'Border',      tip: 'Edge regularity / smoothness'  },
  { key: 'color',     letter: 'C', label: 'Color',       tip: 'Number of distinct color zones' },
  { key: 'diameter',  letter: 'D', label: 'Diameter',    tip: 'Relative size vs image frame'   },
  { key: 'evolution', letter: 'E', label: 'Evolution',   tip: 'Change vs prior visit'           },
]
 
const SCORE_BG = ['bg-ds-green/15 border-ds-green/30 text-ds-green',
                   'bg-ds-amber/15 border-ds-amber/30 text-ds-amber',
                   'bg-ds-red/15   border-ds-red/30   text-ds-red']
 
const TIER_COLOR = { LOW:'text-ds-green', MEDIUM:'text-ds-amber', HIGH:'text-ds-red' }
 
function ScoreDots({ score, max = 2 }) {
  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-all
          ${i < score ? 'bg-current' : 'bg-ds-border'}`} />
      ))}
    </div>
  )
}
 
export default function ABCDECard({ abcde }) {
  if (!abcde) return null
 
  const tierClr = TIER_COLOR[abcde.tier] || 'text-ds-muted'
 
  return (
    <div className="ds-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-0.5">
            ABCDE Assessment
          </p>
          <p className={`font-display font-bold text-xl ${tierClr}`}>
            {abcde.total}/{abcde.max} — {abcde.tier}
          </p>
        </div>
        {/* Score ring */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke={abcde.tier==='HIGH' ? '#FF4C6A' : abcde.tier==='MEDIUM' ? '#FFB347' : '#3DDC84'}
              strokeWidth="3"
              strokeDasharray={`${(abcde.total / abcde.max) * 100} 100`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono font-bold text-sm ${tierClr}`}>{abcde.total}</span>
          </div>
        </div>
      </div>
 
      {/* Criteria grid */}
      <div className="grid grid-cols-5 gap-2">
        {CRITERIA.map(({ key, letter, label }) => {
          const c  = abcde[key] || {}
          const sc = c.score ?? 0
          return (
            <div key={key}
              title={c.description || label}
              className={`border rounded-xl p-2.5 flex flex-col items-center gap-1 cursor-help
                         ${SCORE_BG[sc]}`}>
              <span className="font-display font-extrabold text-xl leading-none">{letter}</span>
              <span className="text-xs font-medium">{label}</span>
              <div className={`${SCORE_BG[sc]}`}>
                <ScoreDots score={sc} />
              </div>
              <span className="font-mono text-[10px]">{sc}/2</span>
            </div>
          )
        })}
      </div>
 
      {/* Detail list */}
      <div className="space-y-1.5">
        {CRITERIA.map(({ key, letter, label }) => {
          const c  = abcde[key] || {}
          const sc = c.score ?? 0
          return (
            <div key={key} className="flex items-center gap-3 text-xs py-1 border-b border-ds-border last:border-0">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center
                               font-bold flex-shrink-0 border ${SCORE_BG[sc]}`}>
                {letter}
              </span>
              <span className="text-ds-muted flex-1">{c.description || label}</span>
              <span className={`font-mono font-semibold ${SCORE_BG[sc].split(' ')[2]}`}>
                {sc}/2
              </span>
            </div>
          )
        })}
      </div>
 
      {abcde.tier !== 'LOW' && (
        <div className={`text-xs p-3 rounded-xl border
          ${abcde.tier === 'HIGH'
            ? 'bg-ds-red/8 border-ds-red/25 text-ds-red/90'
            : 'bg-ds-amber/8 border-ds-amber/25 text-ds-amber/90'}`}>
          {abcde.tier === 'HIGH'
            ? '⚠ High ABCDE score — professional dermatological evaluation is recommended.'
            : 'ℹ Moderate ABCDE score — consider monitoring or follow-up consultation.'}
        </div>
      )}
    </div>
  )
}
 