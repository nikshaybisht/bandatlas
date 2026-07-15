import { useState } from 'react'
import type { Compound, Spectrum, TechniqueTab } from '../types'
import { useAppTheme } from '../context/AppThemeContext'
import {
  buildFigureCardDataUrl,
  clipboardMarkdownCitation,
  compoundShareUrl,
  downloadDataUrl,
  fullBibtexClipboard,
  techniqueLabel,
} from '../lib/export'

interface Props {
  compound: Compound
  technique: TechniqueTab
  caption: string
  spectrum?: Spectrum | null
}

export function ShareCard({ compound, technique, caption, spectrum = null }: Props) {
  const { theme } = useAppTheme()
  const [status, setStatus] = useState<string | null>(null)
  const url = compoundShareUrl(compound.id, technique)

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 2200)
  }

  const downloadPng = (printLight: boolean) => {
    const png = buildFigureCardDataUrl(compound, technique, caption, {
      theme: printLight ? 'light' : theme,
      spectrum,
    })
    if (!png) {
      flash('Figure failed')
      return
    }
    downloadDataUrl(`bandatlas-${compound.id}-${technique}.png`, png)
    flash(printLight ? 'Figure (print light)' : 'Figure card PNG')
  }

  const copyMarkdown = async () => {
    const text = clipboardMarkdownCitation({ compound, spectrum, technique, url })
    try {
      await navigator.clipboard.writeText(text)
      flash('Markdown citation copied')
    } catch {
      flash('Clipboard blocked')
    }
  }

  const copyBibtex = async () => {
    const text = fullBibtexClipboard(compound, spectrum, { url })
    try {
      await navigator.clipboard.writeText(text)
      flash('BibTeX copied')
    } catch {
      flash('Clipboard blocked')
    }
  }

  return (
    <div className="share-block" data-testid="share-card">
      <div className="share-actions">
        <button type="button" className="ghost" onClick={() => downloadPng(false)}>
          Figure card
        </button>
        <button
          type="button"
          className="ghost"
          title="Always light background for lab notebooks / print"
          onClick={() => downloadPng(true)}
        >
          Figure (print)
        </button>
        <button type="button" className="ghost" onClick={copyMarkdown} data-testid="copy-md-cite">
          Copy Markdown
        </button>
        <button type="button" className="ghost" onClick={copyBibtex} data-testid="copy-bibtex">
          Copy BibTeX
        </button>
        {status && (
          <span className="share-status" role="status">
            {status}
          </span>
        )}
      </div>
      <p className="share-hint">
        Figure includes <strong>TEACHING MODEL</strong> watermark · {techniqueLabel(technique)} ·
        axes labeled
      </p>
    </div>
  )
}
