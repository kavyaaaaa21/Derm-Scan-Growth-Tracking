import { useState } from 'react'
import axios from 'axios'
import { Users, Plus, CalendarDays, ChevronDown, ChevronUp,
         TrendingUp, Search, RotateCcw, FileDown, MapPin } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ChangeReport  from '../components/ChangeReport'
import ABCDECard     from '../components/ABCDECard'
import BodyMap       from '../components/BodyMap'

const API = 'http://localhost:8000/api'

const RISK_COLOR = { LOW:'text-ds-green', MEDIUM:'text-ds-amber', HIGH:'text-ds-red' }

function VisitCard({ visit, index, patientId }) {
  const [open,       setOpen]       = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const change = visit.change

  const downloadPDF = async (e) => {
    e.stopPropagation()
    if (!visit.image_b64) return
    setPdfLoading(true)
    try {
      // Convert base64 → Blob → File
      const byteArr = Uint8Array.from(atob(visit.image_b64), c => c.charCodeAt(0))
      const blob    = new Blob([byteArr], { type: 'image/png' })
      const fd      = new FormData()
      fd.append('file',       new File([blob], 'visit.png', { type: 'image/png' }))
      fd.append('patient_id', patientId)
      fd.append('visit_date', visit.date)
      fd.append('include_gradcam', 'false')

      const res = await axios.post(`${API}/report`, fd, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `dermscan_${patientId}_${visit.date}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="ds-card overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-ds-teal/3 transition-colors"
           onClick={() => setOpen(!open)}>

        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 img-ring">
          <img src={`data:image/png;base64,${visit.image_b64}`}
               alt={`Visit ${index + 1}`} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-ds-muted">Visit {index + 1}</span>
            <span className="text-ds-muted text-xs">·</span>
            <span className="text-ds-text text-sm font-medium">{visit.date}</span>
            {visit.body_location && (
              <span className="flex items-center gap-1 text-xs text-ds-muted">
                <MapPin size={10} />
                {visit.body_location.replace(/_/g,' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium
              ${visit.prediction === 'Benign' ? 'text-ds-green' : 'text-ds-red'}`}>
              {visit.prediction}
            </span>
            <span className="text-ds-muted text-xs">({Math.round(visit.confidence * 100)}%)</span>
          </div>
          {/* ABCDE tier */}
          {visit.abcde && (
            <span className={`text-xs font-mono mt-0.5
              ${visit.abcde.tier==='HIGH' ? 'text-ds-red' : visit.abcde.tier==='MEDIUM' ? 'text-ds-amber' : 'text-ds-green'}`}>
              ABCDE {visit.abcde.total}/10 · {visit.abcde.tier}
            </span>
          )}
          {change && (
            <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${RISK_COLOR[change.risk_level]}`}>
              <TrendingUp size={11} />
              Change: {change.risk_level} ({change.risk_score.toFixed(3)})
              {change.alert && <span className="text-ds-red ml-1">⚠ Alert</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={downloadPDF} disabled={pdfLoading}
            title="Download PDF report"
            className="p-2 rounded-lg text-ds-muted hover:text-ds-teal hover:bg-ds-teal/10
                       transition-colors disabled:opacity-40">
            {pdfLoading
              ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>
              : <FileDown size={14} />}
          </button>
          <button className="p-1 text-ds-muted hover:text-ds-teal transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-ds-border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {visit.abcde && <ABCDECard abcde={visit.abcde} />}
          {change       && <ChangeReport report={change} />}
          {!change && !visit.abcde && (
            <p className="text-ds-muted text-sm col-span-2 py-4 text-center">
              No additional data for this visit.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Tracker() {
  // Add-visit form state
  const [pid,      setPid]      = useState('')
  const [date,     setDate]     = useState('')
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [location, setLocation] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  // Timeline lookup state
  const [lookupId, setLookupId] = useState('')
  const [timeline, setTimeline] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchErr, setFetchErr] = useState(null)

  const handleFile = (f) => { setFile(f); setPreview(f ? URL.createObjectURL(f) : null) }

  const addVisit = async () => {
    if (!pid.trim() || !file) return
    setLoading(true); setError(null); setSuccess(null)
    const fd = new FormData()
    fd.append('patient_id', pid.trim())
    fd.append('date', date || new Date().toISOString().slice(0, 10))
    fd.append('file', file)
    if (location) fd.append('body_location', location)
    try {
      const { data } = await axios.post(`${API}/patient/visit`, fd)
      setSuccess(
        `✓ Visit added for ${data.patient_id} on ${data.visit_date}.\n` +
        `Prediction: ${data.prediction} · ${Math.round(data.confidence * 100)}% conf. ` +
        `· ABCDE: ${data.abcde?.total ?? '—'}/10 · ${data.total_visits} total visits.`
      )
      setFile(null); setPreview(null); setDate(''); setLocation(null)
      // Refresh timeline if currently viewing this patient
      if (lookupId.trim() === pid.trim() && timeline) loadTimeline(pid.trim())
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to add visit. Are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (id) => {
    const target = (id || lookupId).trim()
    if (!target) return
    setFetching(true); setFetchErr(null); setTimeline(null)
    try {
      const { data } = await axios.get(`${API}/patient/${target}`)
      setTimeline(data)
    } catch (e) {
      setFetchErr(e.response?.status === 404
        ? `No records for "${target}".`
        : 'Failed to load. Are you logged in?')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      <div className="mb-10">
        <div className="flex items-center gap-2 text-ds-teal text-xs font-mono uppercase tracking-widest mb-3">
          <Users size={12} /> Patient Tracker
        </div>
        <h1 className="section-title">Patient Timeline</h1>
        <p className="section-sub">
          Persistent multi-visit records per patient with automatic change detection,
          ABCDE scoring, and anatomical location tagging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Add Visit (2 cols) ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="font-display font-bold text-lg text-ds-text flex items-center gap-2">
            <Plus size={18} className="text-ds-teal" /> Add Visit
          </h2>

          {/* Patient ID */}
          <div>
            <label className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-2 block">
              Patient ID
            </label>
            <input value={pid} onChange={e => setPid(e.target.value)}
              placeholder="e.g. PAT-001"
              className="w-full bg-ds-surface border border-ds-border rounded-xl px-4 py-3
                         text-ds-text text-sm outline-none placeholder:text-ds-muted
                         focus:border-ds-teal/50 transition-colors" />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-2 block">
              Visit Date
            </label>
            <div className="flex items-center gap-2 bg-ds-surface border border-ds-border rounded-xl px-4 py-3">
              <CalendarDays size={14} className="text-ds-muted flex-shrink-0" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-transparent text-ds-text text-sm outline-none flex-1" />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-2 block">
              Lesion Image
            </label>
            <ImageUploader onFile={handleFile} label="Upload lesion image" preview={preview} compact />
          </div>

          {/* Body map */}
          <BodyMap
            selected={location}
            onSelect={setLocation}
            visits={timeline?.visits || []}
          />

          <button onClick={addVisit} disabled={!pid.trim() || !file || loading}
            className="btn-primary w-full flex items-center justify-center gap-2
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none">
            {loading
              ? <><div className="w-4 h-4 border-2 border-ds-bg/30 border-t-ds-bg rounded-full animate-spin"/> Saving…</>
              : <><Plus size={15} /> Add Visit</>}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-ds-red/10 border border-ds-red/25 text-ds-red text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-ds-green/10 border border-ds-green/25 text-ds-green text-sm whitespace-pre-wrap">{success}</div>
          )}
        </div>

        {/* ── View Timeline (3 cols) ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <h2 className="font-display font-bold text-lg text-ds-text flex items-center gap-2">
            <Search size={18} className="text-ds-teal" /> View Timeline
          </h2>

          <div className="flex gap-2">
            <input value={lookupId} onChange={e => setLookupId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTimeline()}
              placeholder="Enter Patient ID"
              className="flex-1 bg-ds-surface border border-ds-border rounded-xl px-4 py-3
                         text-ds-text text-sm outline-none placeholder:text-ds-muted
                         focus:border-ds-teal/50 transition-colors" />
            <button onClick={() => loadTimeline()} disabled={!lookupId.trim() || fetching}
              className="btn-primary px-5 flex items-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none">
              {fetching
                ? <div className="w-4 h-4 border-2 border-ds-bg/30 border-t-ds-bg rounded-full animate-spin"/>
                : <Search size={15} />}
            </button>
          </div>

          {fetchErr && (
            <div className="p-3 rounded-xl bg-ds-red/10 border border-ds-red/25 text-ds-red text-sm">{fetchErr}</div>
          )}

          {timeline && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-ds-text">
                  {timeline.patient_id}
                  <span className="ml-2 text-xs text-ds-muted font-normal font-mono">
                    {timeline.visits.length} visit{timeline.visits.length !== 1 ? 's' : ''}
                  </span>
                </p>
                <button onClick={() => setTimeline(null)} className="btn-ghost text-xs flex items-center gap-1">
                  <RotateCcw size={11} /> Clear
                </button>
              </div>
              {timeline.visits.length === 0
                ? <div className="ds-card p-8 text-center text-ds-muted text-sm">No visits recorded yet.</div>
                : timeline.visits.map((v, i) => (
                    <VisitCard key={v.id || i} visit={v} index={i} patientId={timeline.patient_id} />
                  ))
              }
            </div>
          )}

          {!timeline && !fetchErr && (
            <div className="ds-card p-10 text-center text-ds-muted">
              <Users size={34} className="text-ds-teal/30 mx-auto mb-3" />
              <p className="font-medium text-ds-text mb-1">Enter a Patient ID to view their timeline</p>
              <p className="text-sm max-w-xs mx-auto">
                Each visit is automatically compared against the previous one and stored persistently.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Info strip */}
      <div className="mt-12 ds-card p-6 grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          ['First Visit',     'Serves as the baseline — no change report generated.'],
          ['Auto-Compare',    'Each new visit is compared against the previous using SSIM, area, compactness, and asymmetry.'],
          ['ABCDE',           'Scored per visit; Evolution criterion uses change score when a prior visit exists.'],
          ['Body Map',        'Tag the anatomical location per visit. Marked regions appear on the body map across visits.'],
        ].map(([t,d]) => (
          <div key={t}>
            <p className="font-display font-semibold text-ds-text text-sm mb-1">{t}</p>
            <p className="text-ds-muted text-xs leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}