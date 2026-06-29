/*
    cube3d-react
    packages/react-example/src/demos/DemoGallery.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useMemo, useState } from 'react';
import { CubeCandidate } from './CubeCandidate';
import { demoDefinitions, getDemoSpec } from './registry';
import { ThreeReference } from './ThreeReference';

export function DemoGallery() {
  const initialDemo = useMemo(() => getDemoSpec(new URLSearchParams(window.location.search).get('demo')), []);
  const [selectedId, setSelectedId] = useState(initialDemo.id);
  const selected = getDemoSpec(selectedId);

  const handleSelectDemo = (id: string) => {
    const next = getDemoSpec(id);
    const url = new URL(window.location.href);
    url.searchParams.set('demo', next.id);
    window.history.replaceState(null, '', url);
    setSelectedId(next.id);
  };

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <h1 style={titleStyle}>Cube3D Validation Gallery</h1>
        <p style={summaryStyle}>Three.js reference compared against Cube3D HTML/CSS candidates.</p>
        <nav style={navStyle} aria-label="Validation demos">
          {demoDefinitions.map((demo) => (
            <button
              key={demo.id}
              type="button"
              data-demo-nav={demo.id}
              aria-pressed={selected.id === demo.id}
              onClick={() => handleSelectDemo(demo.id)}
              style={{
                ...navButtonStyle,
                ...(selected.id === demo.id ? navButtonActiveStyle : undefined),
              }}
            >
              <span>{demo.title}</span>
              <small style={navMetaStyle}>{Math.round(demo.maxDiffRatio * 100)}% diff gate</small>
            </button>
          ))}
        </nav>
      </aside>

      <section style={contentStyle}>
        <header style={demoHeaderStyle}>
          <div>
            <h2 style={demoTitleStyle}>{selected.title}</h2>
            <p style={capabilityStyle}>{selected.capability}</p>
          </div>
          <code style={codeStyle}>?demo={selected.id}</code>
        </header>

        <div style={comparisonGridStyle}>
          <figure style={panelFrameStyle}>
            <figcaption style={captionStyle}>WebGL Reference</figcaption>
            <div data-validation-panel="reference" style={panelClipStyle}>
              <ThreeReference spec={selected} />
            </div>
          </figure>
          <figure style={panelFrameStyle}>
            <figcaption style={captionStyle}>Cube3D Candidate</figcaption>
            <div data-validation-panel="candidate" style={panelClipStyle}>
              <CubeCandidate spec={selected} />
            </div>
          </figure>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  background: '#191b25',
  color: '#f6f7ff',
  fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
};

const sidebarStyle: React.CSSProperties = {
  borderRight: '1px solid rgba(255,255,255,0.1)',
  padding: 22,
  background: '#20232f',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.1,
};

const summaryStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.62)',
  fontSize: 13,
  lineHeight: 1.45,
};

const navStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  marginTop: 20,
};

const navButtonStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  color: '#f6f7ff',
  background: 'rgba(255,255,255,0.04)',
  textAlign: 'left',
  cursor: 'pointer',
};

const navButtonActiveStyle: React.CSSProperties = {
  borderColor: 'rgba(118,150,255,0.78)',
  background: 'rgba(83,103,220,0.35)',
};

const navMetaStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  fontSize: 11,
};

const contentStyle: React.CSSProperties = {
  padding: 28,
};

const demoHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-between',
  marginBottom: 20,
};

const demoTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const capabilityStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: 'rgba(255,255,255,0.6)',
};

const codeStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 5,
  color: '#cfd6ff',
  background: 'rgba(255,255,255,0.07)',
};

const comparisonGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 520px) minmax(0, 520px)',
  gap: 24,
  alignItems: 'start',
};

const panelFrameStyle: React.CSSProperties = {
  margin: 0,
  display: 'grid',
  gap: 10,
};

const captionStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: 13,
  fontWeight: 700,
};

const panelClipStyle: React.CSSProperties = {
  width: 520,
  height: 360,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#20232f',
};
