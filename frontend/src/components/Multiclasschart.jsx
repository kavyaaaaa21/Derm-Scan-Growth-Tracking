const MALIGNANT = new Set(['MEL','BCC','AK','SCC'])
 
export default function MultiClassChart({ data }) {
  if (!data || !data.length) return null
 
  const top = data.slice(0, 9)
  const maxProb = Math.max(...top.map(d => d.probability), 0.01)
 
  return (
    <div className="ds-card p-5 space-y-4">
      <div>
        <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-0.5">
          9-Class Probabilities
        </p>
        <p className="font-display font-semibold text-ds-text">ISIC 2019 Class Breakdown</p>
      </div>
 
      <div className="space-y-2.5">
        {top.map(({ code, name, probability, malignant }) => {
          const pct      = Math.round(probability * 100)
          const barW     = (probability / maxProb) * 100
          const barColor = malignant
            ? 'bg-gradient-to-r from-ds-red to-ds-red/70'
            : 'bg-gradient-to-r from-ds-green to-ds-teal/70'
 
          return (
            <div key={code} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-5 rounded text-[10px] font-mono font-bold
                                   flex items-center justify-center border
                    ${malignant
                      ? 'text-ds-red border-ds-red/30 bg-ds-red/10'
                      : 'text-ds-green border-ds-green/30 bg-ds-green/10'}`}>
                    {code}
                  </span>
                  <span className="text-xs text-ds-muted group-hover:text-ds-text
                                   transition-colors truncate max-w-[120px]">
                    {name}
                  </span>
                </div>
                <span className="font-mono text-xs font-medium text-ds-text ml-2">
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-ds-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${barW}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
 
      <div className="flex gap-4 pt-1 border-t border-ds-border">
        {[['Malignant','ds-red'],['Benign / Unknown','ds-green']].map(([l,c]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full bg-${c}`} />
            <span className="text-xs text-ds-muted">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
