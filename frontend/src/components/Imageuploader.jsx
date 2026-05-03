import { useRef, useState } from 'react'
import { Upload, ImageIcon, X } from 'lucide-react'
 
export default function ImageUploader({ onFile, label = 'Upload Image', preview = null, compact = false }) {
  const inputRef = useRef()
  const [drag, setDrag] = useState(false)
 
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }
 
  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    handleFile(e.dataTransfer.files[0])
  }
 
  const clear = (e) => {
    e.stopPropagation()
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }
 
  const height = compact ? 'h-36' : 'h-52'
 
  if (preview) {
    return (
      <div className={`relative ${height} rounded-2xl overflow-hidden group`}>
        <img
          src={preview}
          alt="preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ds-bg/60 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-center justify-center">
          <button
            onClick={clear}
            className="flex items-center gap-2 bg-ds-red/80 text-white
                       px-4 py-2 rounded-lg text-sm font-medium hover:bg-ds-red transition-colors"
          >
            <X size={14} /> Remove
          </button>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-ds-bg/80 text-ds-teal text-xs px-2 py-1 rounded-md font-mono">
            ready
          </span>
        </div>
      </div>
    )
  }
 
  return (
    <div
      className={`upload-zone ${height} ${drag ? 'drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
 
      <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center
                      transition-colors ${drag ? 'border-ds-teal bg-ds-teal/15' : 'border-ds-border bg-ds-surface'}`}>
        {drag ? <Upload size={22} className="text-ds-teal" /> : <ImageIcon size={22} />}
      </div>
 
      <div className="text-center">
        <p className="font-medium text-sm text-ds-text">{label}</p>
        <p className="text-xs mt-1">Drop or click · JPG / PNG / WEBP</p>
      </div>
    </div>
  )
}

