import { Microscope, ExternalLink } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { Link } from 'react-router-dom'
 
export default function Footer() {
  return (
    <footer className="border-t border-ds-border bg-ds-surface mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-ds-teal/15 border border-ds-teal/30
                              flex items-center justify-center">
                <Microscope size={14} className="text-ds-teal" />
              </div>
              <span className="font-display font-bold text-ds-text">
                Derm<span className="text-ds-teal">Scan</span>
              </span>
            </div>
            <p className="text-ds-muted text-sm leading-relaxed">
              AI-powered early-stage skin lesion analysis using EfficientNetB3
              trained on the ISIC 2019 dataset.
            </p>
          </div>
 
          {/* Links */}
          <div>
            <p className="font-display font-semibold text-ds-text text-sm mb-3">Features</p>
            <div className="flex flex-col gap-2">
              {[
                ['/analyze', 'Single Image Analysis'],
                ['/compare', 'Lesion Growth Comparison'],
                ['/tracker', 'Patient Timeline Tracker'],
              ].map(([to, label]) => (
                <Link key={to} to={to}
                  className="text-ds-muted text-sm hover:text-ds-teal transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
 
          {/* Disclaimer */}
          <div>
            <p className="font-display font-semibold text-ds-text text-sm mb-3">Disclaimer</p>
            <p className="text-ds-muted text-xs leading-relaxed">
              DermScan is a research tool and does <strong className="text-ds-amber">not</strong> provide
              medical diagnoses. Always consult a licensed dermatologist for professional evaluation.
            </p>
          </div>
 
        </div>
 
        <div className="mt-8 pt-6 border-t border-ds-border flex flex-col md:flex-row
                        items-center justify-between gap-3 text-ds-muted text-xs">
          <span>© {new Date().getFullYear()} DermScan · EfficientNetB3 + ISIC 2019</span>
          <span className="flex items-center gap-1">
            Built with TensorFlow · Keras · FastAPI · React
          </span>
        </div>
      </div>
    </footer>
  )
}
