import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
 
const RISK_COLOR = {
  LOW:    { text: 'text-ds-green', bg: 'bg-ds-green/15', border: 'border-ds-green/30' },
  MEDIUM: { text: 'text-ds-amber', bg: 'bg-ds-amber/15', border: 'border-ds-amber/30' },
  HIGH:   { text: 'text-ds-red',   bg: 'bg-ds-red/15',   border: 'border-ds-red/30'   },
}
 
const DELTA_LABELS = {
  area_delta:        { label: 'Area Change',        weight: 'High' },
  compactness_delta: { label: 'Compactness Δ',      weight: 'High' },
  color_var_delta:   { label: 'Color Variance Δ',   weight: 'Med'  },
  asymmetry_delta:   { label: 'Asymmetry Δ',        weight: 'Med'  },
  ssim_change:       { label: 'Structural Change',  weight: 'Med'  },
}
 
function DeltaRow({ name, value }) {
  const meta    = DELTA_LABELS[name] || { label: name, weight: '' }
  const isPos   = value > 0.001
  const isNeg   = value < -0.001
  const concern = isPos // positive deltas are generally concerning
  const fmt     = (v) => (v >= 0 ? '+' : '') + v.toFixed(4)
 
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-ds-border last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
        ${concern && isPos ? 'bg-ds-red/10' : isNeg ? 'bg-ds-green/10' : 'bg-ds-surface'}`}>
        {isPos  ? <TrendingUp   size={14} className={concern ? 'text-ds-red' : 'text-ds-teal'} /> :
         isNeg  ? <TrendingDown size={14} className="text-ds-green" /> :
                  <Minus        size={14} className="text-ds-muted" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ds-text">{meta.label}</p>
        {meta.weight && <p className="text-xs text-ds-muted">Weight: {meta.weight}</p>}
      </div>
      <span className={`font-mono text-sm font-medium
        ${isPos && concern ? 'text-ds-red' : isNeg ? 'text-ds-green' : 'text-ds-muted'}`}>
        {fmt(value)}
      </span>
    </div>
  )
}
 
export default function ChangeReport({ report }) {
  if (!report) return null
 
  const rc     = RISK_COLOR[report.risk_level] || RISK_COLOR.LOW
  const riskPct = Math.min(Math.round(report.risk_score * 100 / 0.6), 100)
 
  return (
    <div className="ds-card p-6 space-y-6">
 
      {/* Risk header */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border ${rc.bg} ${rc.border}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${rc.border} ${rc.bg}`}>
          {report.risk_level === 'LOW'
            ? <CheckCircle  size={22} className={rc.text} />
            : <AlertTriangle size={22} className={rc.text} />}
        </div>
        <div>
          <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-0.5">
            Risk Assessment
          </p>
          <p className={`font-display font-bold text-xl ${rc.text}`}>
            {report.risk_level} RISK
          </p>
          <p className="text-xs text-ds-muted mt-0.5">
            {report.date_before} → {report.date_after}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className={`font-mono font-bold text-3xl ${rc.text}`}>
            {report.risk_score.toFixed(3)}
          </p>
          <p className="text-xs text-ds-muted">risk score</p>
        </div>
      </div>
 
      {/* Risk bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-ds-muted">
          <span>Low</span>
          <span>Alert threshold (0.15)</span>
          <span>High (0.30)</span>
        </div>
        <div className="relative h-3 bg-ds-border rounded-full overflow-hidden">
          {/* threshold markers */}
          <div className="absolute top-0 bottom-0 w-px bg-ds-amber/60"
            style={{ left: `${(0.15 / 0.6) * 100}%` }} />
          <div className="absolute top-0 bottom-0 w-px bg-ds-red/60"
            style={{ left: `${(0.30 / 0.6) * 100}%` }} />
          <div
            className={`h-full rounded-full transition-all duration-700 ${rc.bg.replace('/15', '')} ${rc.text.replace('text-', 'bg-')}`}
            style={{ width: `${riskPct}%`,
              background: report.risk_level === 'HIGH' ? '#FF4C6A'
                        : report.risk_level === 'MEDIUM' ? '#FFB347'
                        : '#3DDC84' }}
          />
        </div>
      </div>
 
      {/* Alert banner */}
      {report.alert && (
        <div className="flex gap-2 p-3 rounded-xl bg-ds-red/8 border border-ds-red/25">
          <AlertTriangle size={14} className="text-ds-red flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ds-red/90 leading-relaxed">
            Notable change detected. We recommend consulting a dermatologist for professional evaluation.
          </p>
        </div>
      )}
 
      {/* Feature deltas */}
      <div>
        <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-3">
          Feature Deltas
        </p>
        {Object.entries(report.deltas)
          .filter(([k]) => k !== 'ssim')
          .map(([k, v]) => (
            <DeltaRow key={k} name={k} value={v} />
          ))}
      </div>
 
      {/* SSIM */}
      <div className="flex justify-between items-center p-3 rounded-xl bg-ds-surface border border-ds-border">
        <div>
          <p className="text-sm text-ds-text">Structural Similarity (SSIM)</p>
          <p className="text-xs text-ds-muted">Higher = more similar images</p>
        </div>
        <span className="font-mono font-semibold text-ds-teal">
          {report.deltas.ssim?.toFixed(4) ?? 'N/A'}
        </span>
      </div>
    </div>
  )
}