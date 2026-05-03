import { useState } from 'react'
import axios from 'axios'
import { GitCompare, CalendarDays, RotateCcw } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ChangeReport  from '../components/ChangeReport'

const API = 'http://localhost:8000/api'

export default function Compare() {
  const [beforeFile,   setBeforeFile]   = useState(null)
  const [afterFile,    setAfterFile]    = useState(null)
  const [beforePrev,   setBeforePrev]   = useState(null)
  const [afterPrev,    setAfterPrev]    = useState(null)
  const [dateBefore,   setDateBefore]   = useState('')
  const [dateAfter,    setDateAfter]    = useState('')
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  const handleBefore = (f) => {
    setBeforeFile(f)
    setBeforePrev(f ? URL.createObjectURL(f) : null)
    setResult(null)
  }
  const handleAfter = (f) => {
    setAfterFile(f)
    setAfterPrev(f ? URL.createObjectURL(f) : null)
    setResult(null)
  }

  const compare = async () => {
    if (!beforeFile || !afterFile) return
    setLoading(true); setError(null)
    const fd = new FormData()
    fd.append('before', beforeFile)
    fd.append('after',  afterFile)
    fd.append('date_before', dateBefore || 'Visit 1')
    fd.append('date_after',  dateAfter  || 'Visit 2')
    try {
      const { data } = await axios.post(`${API}/compare`, fd)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Comparison failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setBeforeFile(null); setAfterFile(null)
    setBeforePrev(null); setAfterPrev(null)
    setResult(null); setError(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-ds-amber text-xs font-mono uppercase tracking-widest mb-3">
          <GitCompare size={12} /> Growth Tracking
        </div>
        <h1 className="section-title">Lesion Change Analysis</h1>
        <p className="section-sub">
          Upload two images of the same lesion from different dates to
          quantify area, compactness, color, and asymmetry changes.
        </p>
      </div>

      {/* Upload row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-ds-muted uppercase tracking-widest">
            <span className="w-5 h-5 rounded bg-ds-surface border border-ds-border
                             flex items-center justify-center text-ds-teal font-bold">1</span>
            Before / Baseline
          </div>
          <ImageUploader
            onFile={handleBefore}
            label="Upload baseline image"
            preview={beforePrev}
          />
          <div className="flex items-center gap-2 bg-ds-surface border border-ds-border rounded-xl px-3 py-2.5">
            <CalendarDays size={14} className="text-ds-muted flex-shrink-0" />
            <input
              type="date"
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
              className="bg-transparent text-sm text-ds-text outline-none flex-1
                         placeholder:text-ds-muted"
              placeholder="Visit date"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-ds-muted uppercase tracking-widest">
            <span className="w-5 h-5 rounded bg-ds-surface border border-ds-border
                             flex items-center justify-center text-ds-amber font-bold">2</span>
            After / Follow-up
          </div>
          <ImageUploader
            onFile={handleAfter}
            label="Upload follow-up image"
            preview={afterPrev}
          />
          <div className="flex items-center gap-2 bg-ds-surface border border-ds-border rounded-xl px-3 py-2.5">
            <CalendarDays size={14} className="text-ds-muted flex-shrink-0" />
            <input
              type="date"
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
              className="bg-transparent text-sm text-ds-text outline-none flex-1"
              placeholder="Visit date"
            />
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={compare}
          disabled={!beforeFile || !afterFile || loading}
          className="btn-primary flex items-center gap-2 px-8
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-ds-bg/30 border-t-ds-bg rounded-full animate-spin" /> Analyzing…</>
            : <><GitCompare size={16} /> Compare</>}
        </button>

        {(beforeFile || afterFile || result) && (
          <button onClick={reset} className="btn-outline flex items-center gap-2">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-ds-red/10 border border-ds-red/25 text-ds-red text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Image strip */}
          <div className="lg:col-span-3 space-y-4">
            <p className="text-xs font-mono text-ds-muted uppercase tracking-widest">
              Image Comparison
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                [result.before_b64,      dateBefore || 'Before', 'teal'],
                [result.after_b64,       dateAfter  || 'After',  'amber'],
                [result.diff_b64,        'Difference',            'red'],
              ].map(([b64, label, color]) => (
                <div key={label} className="ds-card overflow-hidden">
                  <div className="aspect-square bg-ds-surface">
                    <img
                      src={`data:image/png;base64,${b64}`}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`p-2 text-center text-xs font-mono text-ds-${color}`}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                [result.mask_before_b64, 'Mask Before'],
                [result.mask_after_b64,  'Mask After'],
              ].map(([b64, label]) => (
                <div key={label} className="ds-card overflow-hidden">
                  <div className="aspect-square bg-black">
                    <img
                      src={`data:image/png;base64,${b64}`}
                      alt={label}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-2 text-center text-xs font-mono text-ds-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Report */}
          <div className="lg:col-span-2">
            <ChangeReport report={result} />
          </div>
        </div>
      )}

      {/* Info */}
      {!result && (
        <div className="ds-card p-8 text-center text-ds-muted">
          <GitCompare size={36} className="text-ds-teal/30 mx-auto mb-3" />
          <p className="font-medium text-ds-text mb-1">Upload both images to begin</p>
          <p className="text-sm">
            The analyzer measures area, compactness, color variance, asymmetry,
            and structural similarity between the two visits.
          </p>
        </div>
      )}

    </div>
  )
}