import { createRoot } from 'react-dom/client'
import { useEffect, useRef } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'
import useAppStore from './store/useAppStore'
import { applyConfig } from './config/applyConfig'
import type { AppConfig } from './config/schema'
import View from './pages/View'

/**
 * Config accepted by the embed mount() function.
 * Maps to the highperformer AppConfig schema — url is required,
 * everything else is optional.
 */
export interface EmbedConfig {
  url: string
  filterConfig?: {
    ids?: string[]
    obsColumn?: string
    embedding_key?: string
    color_by?: { type: 'category' | 'gene'; value: string }
    mapped_columns?: Array<{
      label: string
      source_column: string
      mapping: Record<string, string>
    }>
  }
}

/** Convert the cbioportal-frontend filterConfig shape into an AppConfig */
function toAppConfig(cfg: EmbedConfig): AppConfig {
  const appConfig: Record<string, unknown> = {
    url: cfg.url,
    showHeader: true,
    showLeftSidebar: true,
    showRightSidebar: true,
    showDatasetDropdown: false,
  }

  if (cfg.filterConfig) {
    const fc = cfg.filterConfig
    if (fc.embedding_key) appConfig.embedding = fc.embedding_key
    if (fc.color_by) {
      appConfig.colorBy = fc.color_by.type
      if (fc.color_by.type === 'gene') appConfig.gene = fc.color_by.value
      if (fc.color_by.type === 'category') appConfig.category = fc.color_by.value
    }
    if (fc.ids && fc.obsColumn) {
      appConfig.filter = { ids: fc.ids, obsColumn: fc.obsColumn }
    }
    if (fc.mapped_columns) {
      appConfig.mappedColumns = fc.mapped_columns.map((mc) => ({
        label: mc.label,
        sourceColumn: mc.source_column,
        mapping: mc.mapping,
      }))
    }
  }

  return appConfig as AppConfig
}

function configFingerprint(cfg: EmbedConfig): string {
  return JSON.stringify({
    url: cfg.url,
    fc: cfg.filterConfig,
  })
}

function EmbedRoot({ config }: { config: EmbedConfig }) {
  const loading = useAppStore((s) => s.loading)
  const adata = useAppStore((s) => s.adata)
  const lastFingerprint = useRef<string | null>(null)
  const mappedColumnsRegistered = useRef(false)

  // Initial config application
  useEffect(() => {
    if (!config.url) return
    const fp = configFingerprint(config)
    if (fp === lastFingerprint.current) return
    lastFingerprint.current = fp
    mappedColumnsRegistered.current = false
    applyConfig(toAppConfig(config))
  }, [config])

  // Register mapped columns once adata is loaded
  useEffect(() => {
    if (!adata || mappedColumnsRegistered.current) return
    const mc = config.filterConfig?.mapped_columns
    if (!mc || mc.length === 0) return
    mappedColumnsRegistered.current = true
    const mappedColumns = mc.map((m) => ({
      label: m.label,
      sourceColumn: m.source_column,
      mapping: m.mapping,
    }))
    useAppStore.getState().registerMappedColumns(mappedColumns)
  }, [adata, config])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return <View />
}

export function mount(el: HTMLElement, config?: EmbedConfig) {
  const root = createRoot(el)
  let current = config || ({ url: '' } as EmbedConfig)

  const render = () =>
    root.render(
      <MemoryRouter initialEntries={['/view']}>
        <Routes>
          <Route path="*" element={<EmbedRoot config={current} />} />
        </Routes>
      </MemoryRouter>
    )

  render()

  return {
    update(next: EmbedConfig) {
      current = next
      render()
    },
    unmount() {
      root.unmount()
    },
  }
}
