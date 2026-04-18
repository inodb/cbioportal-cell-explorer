import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { MemoryRouter } from "react-router";
import { Spin, Alert } from "antd";
import useAppStore from "./store/useAppStore";
import ExplorerLayout from "./components/layouts/ExplorerLayout";

function EmbedRoot({ url, filterConfig }) {
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const adata = useAppStore((s) => s.adata);
  const initialize = useAppStore((s) => s.initialize);
  const applyFilterConfig = useAppStore((s) => s.applyFilterConfig);

  useEffect(() => {
    useAppStore.setState({ isEmbedded: true });
  }, []);

  useEffect(() => {
    if (!url) return;
    initialize(url);
  }, [url, initialize]);

  useEffect(() => {
    if (!filterConfig) return;
    applyFilterConfig(filterConfig);
  }, [filterConfig, applyFilterConfig]);

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading cell data"
        description={error}
      />
    );
  }
  if (loading || !adata) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }
  return <ExplorerLayout />;
}

export function mount(el, config) {
  const root = createRoot(el);
  let current = config || {};
  const render = () =>
    root.render(
      <MemoryRouter>
        <EmbedRoot url={current.url} filterConfig={current.filterConfig} />
      </MemoryRouter>
    );
  render();
  return {
    update(next) {
      current = next || {};
      render();
    },
    unmount() {
      root.unmount();
    },
  };
}
