import { ShieldCheck, AlertTriangle, Info } from 'lucide-react'
 
export default function ResultCard({ result }) {
  if (!result) return null
 
  const isMalignant = result.label === 1
  const pct         = Math.round(result.confidence * 100)
  const probPct     = Math.round(result.probability * 100)
 
  return (
    <div className="ds-card p-6 space-y-5">
 
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isMalignant ? 'bg-ds-red/15 border border-ds-red/30' : 'bg-ds-green/15 border border-ds-green/30'}`}>
          {isMalignant
            ? <AlertTriangle size={22} className="text-ds-red" />
            : <ShieldCheck   size={22} className="text-ds-green" />}
        </div>
        <div>
          <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">
            AI Assessment
          </p>
          <h3 className={`font-display font-bold text-xl leading-tight
            ${isMalignant ? 'text-ds-red' : 'text-ds-green'}`}>
            {result.prediction}
          </h3>
        </div>
      </div>
 
      {/* Confidence bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-ds-muted">
          <span>Model Confidence</span>
          <span className="font-mono text-ds-text">{pct}%</span>
        </div>
        <div className="conf-bar-track">
          <div
            className="conf-bar-fill"
            style={{
              width: `${pct}%`,
              background: isMalignant
                ? 'linear-gradient(90deg, #FF4C6A, #cc3355)'
                : 'linear-gradient(90deg, #3DDC84, #2ab866)',
            }}
          />
        </div>
      </div>
 
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Malignancy Prob." value={`${probPct}%`} />
        <Stat label="Confidence"        value={`${pct}%`} />
      </div>
 
      {/* Disclaimer */}
      <div className="flex gap-2 p-3 rounded-xl bg-ds-amber/8 border border-ds-amber/20">
        <Info size={14} className="text-ds-amber flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ds-amber/80 leading-relaxed">
          This is an AI screening tool, not a medical diagnosis.
          Always consult a licensed dermatologist.
        </p>
      </div>
    </div>
  )
}
 
function Stat({ label, value }) {
  return (
    <div className="bg-ds-surface rounded-xl p-3 border border-ds-border">
      <p className="text-xs text-ds-muted mb-1">{label}</p>
      <p className="font-mono font-semibold text-ds-text">{value}</p>
    </div>
  )
}
