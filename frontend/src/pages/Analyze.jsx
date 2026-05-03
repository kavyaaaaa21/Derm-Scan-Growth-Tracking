import { useState } from 'react'
import axios from 'axios'
import { Zap, RotateCcw, FileDown, CheckCircle } from 'lucide-react'
import ImageUploader  from '../components/ImageUploader'
import ResultCard     from '../components/ResultCard'
import GradCAMViewer  from '../components/GradCAMViewer'
import ABCDECard      from '../components/ABCDECard'
import MultiClassChart from '../components/MultiClassChart'

const API = 'http://localhost:8000/api'

export default function Analyze() {
  const [file,        setFile]       = useState(null)
  const [preview,     setPreview]    = useState(null)
  const [result,      setResult]     = useState(null)
  const [loading,     setLoading]    = useState(false)
  const [pdfLoading,  setPdfLoading] = useState(false)
  const [pdfDone,     setPdfDone]    = useState(false)
  const [error,       setError]      = useState(null)
  const [mode,        setMode]       = useState('gradcam')
  const [patientId,   setPatientId]  = useState('')

  const handleFile = (f) => {
    if (!f) { setFile(null); setPreview(null); setResult(null); return }
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null)
  }

  const run = async () => {
    if (!file) return
    setLoading(true); setError(null); setPdfDone(false)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const endpoint = mode === 'gradcam' ? `${API}/gradcam` : `${API}/predict`
      const { data } = await axios.post(endpoint, fd)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!file) return
    setPdfLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('patient_id', patientId || 'Unknown')
    fd.append('visit_date', new Date().toISOString().slice(0, 10))
    fd.append('include_gradcam', mode === 'gradcam' ? 'true' : 'false')
    try {
      const res = await axios.post(`${API}/report`, fd, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `dermscan_${patientId || 'report'}_${new Date().toISOString().slice(0,10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setPdfDone(true)
      setTimeout(() => setPdfDone(false), 3000)
    } catch (e) {
      setError('PDF generation failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null)
    setError(null); setPdfDone(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-ds-teal text-xs font-mono uppercase tracking-widest mb-3">
          <Zap size={12} /> Single Image Analysis
        </div>
        <h1 className="section-title">Analyze a Lesion</h1>
        <p className="section-sub">
          Upload a dermoscopy image for AI classification, Grad-CAM explanation,
          ABCDE scoring, and multi-class probability breakdown.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Mode toggle */}
        <div className="flex gap-1 bg-ds-surface border border-ds-border rounded-xl p-1">
          {[['gradcam', 'With Grad-CAM'], ['predict', 'Classification Only']].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${mode === m ? 'bg-ds-teal text-ds-bg' : 'text-ds-muted hover:text-ds-text'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Patient ID input for PDF */}
        <input
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          placeholder="Patient ID (for PDF report)"
          className="bg-ds-surface border border-ds-border rounded-xl px-4 py-2.5
                     text-ds-text text-sm outline-none placeholder:text-ds-muted
                     focus:border-ds-teal/50 transition-colors w-56"
        />
      </div>

      {/* Main grid: upload | viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Upload + actions */}
        <div className="space-y-4">
          <ImageUploader onFile={handleFile} label="Upload dermoscopy image" preview={preview} />

          <div className="flex gap-3">
            <button onClick={run} disabled={!file || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none">
              {loading
                ? <><div className="w-4 h-4 border-2 border-ds-bg/30 border-t-ds-bg rounded-full animate-spin"/> Analyzing…</>
                : <><Zap size={16} /> Analyze</>}
            </button>
            {(file || result) && (
              <button onClick={reset} className="btn-outline px-4">
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* PDF download button — only show after analysis */}
          {result && (
            <button onClick={downloadPDF} disabled={pdfLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         border text-sm font-medium transition-all duration-200
                         ${pdfDone
                           ? 'border-ds-green/40 bg-ds-green/10 text-ds-green'
                           : 'border-ds-border text-ds-muted hover:border-ds-teal/40 hover:text-ds-teal hover:bg-ds-teal/5'}
                         disabled:opacity-50 disabled:cursor-not-allowed`}>
              {pdfLoading
                ? <><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/> Generating PDF…</>
                : pdfDone
                ? <><CheckCircle size={15}/> PDF Downloaded</>
                : <><FileDown size={15}/> Download Clinical Report (PDF)</>}
            </button>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-ds-red/10 border border-ds-red/25 text-ds-red text-sm">
              {error}
            </div>
          )}

          {/* Prediction result */}
          {result && <ResultCard result={result} />}
        </div>

        {/* Grad-CAM / preview panel */}
        <div>
          {result && mode === 'gradcam'
            ? <GradCAMViewer original_b64={result.original_b64}
                              heatmap_b64={result.heatmap_b64}
                              overlay_b64={result.overlay_b64} />
            : result
            ? <div className="ds-card overflow-hidden aspect-square bg-ds-surface">
                <img src={`data:image/png;base64,${result.image_b64 || result.original_b64}`}
                     alt="result" className="w-full h-full object-contain" />
              </div>
            : preview
            ? <div className="ds-card overflow-hidden aspect-square bg-ds-surface">
                <img src={preview} alt="preview" className="w-full h-full object-cover opacity-60" />
              </div>
            : <div className="ds-card aspect-square bg-ds-surface flex flex-col items-center
                              justify-center gap-3 text-ds-muted">
                <div className="w-16 h-16 rounded-2xl border border-ds-border bg-ds-card
                                flex items-center justify-center">
                  <Zap size={28} className="text-ds-teal/40" />
                </div>
                <p className="text-sm text-center px-8">
                  Upload an image and click Analyze
                </p>
              </div>
          }
        </div>
      </div>

      {/* ABCDE + Multi-class — full width below, only when result present */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ABCDECard abcde={result.abcde} />
          <MultiClassChart data={result.multiclass} />
        </div>
      )}

      {/* Info panel */}
      <div className="ds-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          ['EfficientNetB3',   'Backbone pre-trained on ImageNet, fine-tuned on ISIC 2019 in a 2-stage process.'],
          ['Sigmoid Output',   'Single neuron with sigmoid produces a calibrated malignancy probability.'],
          ['Grad-CAM',         'Gradient-weighted class activation maps highlight the regions most influencing the decision.'],
          ['ABCDE Scoring',    'Asymmetry, Border, Color, Diameter, Evolution — the standard dermoscopic assessment framework.'],
        ].map(([title, desc]) => (
          <div key={title}>
            <p className="font-display font-semibold text-ds-text text-sm mb-1">{title}</p>
            <p className="text-ds-muted text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}