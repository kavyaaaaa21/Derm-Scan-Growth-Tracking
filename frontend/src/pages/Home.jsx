import { Link } from 'react-router-dom'
import { Microscope, Brain, GitCompare, Users, ChevronRight,
         ShieldCheck, Zap, Eye, ArrowRight } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Classification',
    desc: 'EfficientNetB3 trained on 25,000+ ISIC 2019 images classifies lesions as benign or requiring professional consultation.',
    cta: '/analyze',
    ctaLabel: 'Try Analysis',
    color: 'teal',
  },
  {
    icon: Eye,
    title: 'Grad-CAM Explainability',
    desc: 'Visual heatmaps highlight the exact regions of the lesion that drove the AI decision — no black boxes.',
    cta: '/analyze',
    ctaLabel: 'See Heatmaps',
    color: 'teal',
  },
  {
    icon: GitCompare,
    title: 'Growth Tracking',
    desc: 'Upload before/after images to quantify changes in area, compactness, color variance, and asymmetry.',
    cta: '/compare',
    ctaLabel: 'Compare Visits',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Patient Timeline',
    desc: 'Maintain multi-visit records per patient and visualise lesion evolution and AI risk scores over time.',
    cta: '/tracker',
    ctaLabel: 'Open Tracker',
    color: 'amber',
  },
]

const STATS = [
  { value: '25K+',  label: 'Training Images' },
  { value: '9',     label: 'Lesion Classes'  },
  { value: 'B3',    label: 'EfficientNet'    },
  { value: 'v3',    label: 'Model Version'   },
]

const CLASSES = [
  { code: 'MEL',  name: 'Melanoma',            type: 'malignant' },
  { code: 'BCC',  name: 'Basal Cell Carc.',    type: 'malignant' },
  { code: 'AK',   name: 'Actinic Keratosis',   type: 'malignant' },
  { code: 'SCC',  name: 'Squamous Cell Carc.', type: 'malignant' },
  { code: 'NV',   name: 'Melanocytic Nevus',   type: 'benign'    },
  { code: 'BKL',  name: 'Benign Keratosis',    type: 'benign'    },
  { code: 'DF',   name: 'Dermatofibroma',      type: 'benign'    },
  { code: 'VASC', name: 'Vascular Lesion',     type: 'benign'    },
  { code: 'UNK',  name: 'Unknown',             type: 'other'     },
]

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-ds-teal/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-64 h-64
                        bg-ds-teal/3 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-ds-teal/10 border border-ds-teal/25
                          rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ds-teal animate-pulse-slow" />
            <span className="text-ds-teal text-xs font-mono tracking-widest uppercase">
              ISIC 2019 · EfficientNetB3 · Grad-CAM
            </span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-ds-text
                         leading-none tracking-tight mb-6">
            Early-Stage<br />
            <span className="text-ds-teal">Skin Lesion</span><br />
            Analyzer
          </h1>

          <p className="text-ds-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Upload a dermoscopy image and receive an instant AI-powered assessment with
            Grad-CAM visual explanations and longitudinal growth tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyze" className="btn-primary flex items-center gap-2 justify-center text-base py-3.5 px-8">
              <Zap size={18} /> Analyze a Lesion
            </Link>
            <Link to="/compare" className="btn-outline flex items-center gap-2 justify-center text-base py-3.5 px-8">
              <GitCompare size={18} /> Compare Visits
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="ds-card p-6 text-center">
              <p className="font-display font-extrabold text-3xl text-ds-teal mb-1">{value}</p>
              <p className="text-ds-muted text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Everything you need</h2>
            <p className="section-sub max-w-xl mx-auto">
              From single-image screening to multi-visit longitudinal tracking —
              powered by state-of-the-art deep learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, cta, ctaLabel, color }) => (
              <div key={title} className="ds-card-glow p-6 flex flex-col gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                  ${color === 'teal'
                    ? 'bg-ds-teal/15 border border-ds-teal/30'
                    : 'bg-ds-amber/15 border border-ds-amber/30'}`}>
                  <Icon size={20} className={color === 'teal' ? 'text-ds-teal' : 'text-ds-amber'} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-ds-text mb-2">{title}</h3>
                  <p className="text-ds-muted text-sm leading-relaxed">{desc}</p>
                </div>
                <Link to={cta}
                  className="flex items-center gap-1.5 text-ds-teal text-sm font-medium
                             hover:gap-2.5 transition-all duration-200">
                  {ctaLabel} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Classes ───────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title">9 Lesion Classes</h2>
            <p className="section-sub">Trained on all ISIC 2019 categories, mapped to a clinically meaningful binary output.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {CLASSES.map(({ code, name, type }) => (
              <div key={code}
                className={`ds-card p-3 text-center hover:scale-105 transition-transform cursor-default
                  ${type === 'malignant' ? 'border-ds-red/30 bg-ds-red/5' :
                    type === 'benign'    ? 'border-ds-green/30 bg-ds-green/5' :
                                          'border-ds-border'}`}>
                <p className={`font-mono font-bold text-sm mb-1
                  ${type === 'malignant' ? 'text-ds-red' :
                    type === 'benign' ? 'text-ds-green' : 'text-ds-muted'}`}>
                  {code}
                </p>
                <p className="text-ds-muted text-[10px] leading-tight hidden md:block">{name}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-6 justify-center mt-4">
            {[['Malignant', 'text-ds-red'], ['Benign', 'text-ds-green'], ['Other', 'text-ds-muted']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${c.replace('text-', 'bg-')}`} />
                <span className="text-ds-muted text-xs">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ──────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title">Two-Stage Training</h2>
            <p className="section-sub">
              Stage 1 trains the classification head with frozen backbone.
              Stage 2 fine-tunes the top EfficientNetB3 layers at a lower learning rate.
            </p>
          </div>
          <div className="ds-card p-6 font-mono text-sm space-y-3">
            {[
              ['Stage 1', 'Frozen backbone · Train head only', 'LR = 1e-3 · 8 epochs', 'teal'],
              ['Stage 2', 'Unfreeze top layers (from 100)', 'LR = 1e-5 · 15 epochs', 'amber'],
              ['Loss', 'BinaryFocalCrossentropy (γ=2)', 'Class-balanced weights', 'teal'],
              ['Metrics', 'AUC · Accuracy · Precision · Recall', 'F1 offline via sklearn', 'muted'],
            ].map(([stage, desc, detail, c]) => (
              <div key={stage} className="flex items-start gap-4 p-3 rounded-xl bg-ds-surface">
                <span className={`text-ds-${c} font-bold min-w-[4rem]`}>{stage}</span>
                <span className="text-ds-text">{desc}</span>
                <span className="text-ds-muted ml-auto text-xs hidden md:block">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="ds-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ds-teal/5 to-transparent pointer-events-none" />
            <ShieldCheck size={40} className="text-ds-teal mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl text-ds-text mb-3">
              Ready to analyze?
            </h2>
            <p className="text-ds-muted mb-8">
              Upload your first dermoscopy image and get an AI assessment with visual explanations in seconds.
            </p>
            <Link to="/analyze" className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-10">
              <Microscope size={18} /> Start Analyzing
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}