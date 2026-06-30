/*
    Cube3D React
    packages/react-example/src/demos/DemoGallery.tsx

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import React, { useMemo, useState } from 'react';
import { CubeCandidate } from './CubeCandidate';
import { DemoDetails } from './DemoDetails';
import { demoDefinitions, getDemoCases, getDemoSpec, type DemoCaseOption, type DemoSpec } from './registry';
import { createSolidTextDemoNodes } from './solidText';
import { ThreeReference } from './ThreeReference';
import { defaultTypefaceFontId, type TypefaceFontId, typefaceFontOptions } from './typefaceFonts';

export function DemoGallery() {
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialDemo = useMemo(() => getDemoSpec(initialParams.get('demo'), initialParams.get('case')), [initialParams]);
  const [selectedId, setSelectedId] = useState(initialDemo.id);
  const [selectedCaseId, setSelectedCaseId] = useState(initialDemo.selectedCase);
  const [selectedFontId, setSelectedFontId] = useState<TypefaceFontId>(defaultTypefaceFontId);
  const selected = getDemoSpec(selectedId, selectedCaseId);
  const selectedCases = getDemoCases(selectedId);
  const selectedSpec = useMemo(() => withSolidTextFont(selected, selectedFontId), [selected, selectedFontId]);

  const handleSelectDemo = (id: string) => {
    const next = getDemoSpec(id);
    const url = new URL(window.location.href);
    url.searchParams.set('demo', next.id);
    if (next.selectedCase) url.searchParams.set('case', next.selectedCase);
    else url.searchParams.delete('case');
    window.history.replaceState(null, '', url);
    setSelectedId(next.id);
    setSelectedCaseId(next.selectedCase);
  };

  const handleSelectCase = (caseId: string) => {
    const next = getDemoSpec(selected.id, caseId);
    const url = new URL(window.location.href);
    url.searchParams.set('demo', next.id);
    url.searchParams.set('case', next.selectedCase ?? caseId);
    window.history.replaceState(null, '', url);
    setSelectedCaseId(next.selectedCase);
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
          <div style={headerControlsStyle}>
            {selected.id === 'solid-text' ? (
              <label style={fontSelectLabelStyle}>
                <span>Font</span>
                <select
                  data-solid-font-select
                  value={selectedFontId}
                  onChange={(event) => setSelectedFontId(event.target.value as TypefaceFontId)}
                  style={fontSelectStyle}
                >
                  {typefaceFontOptions.map((font, index) => (
                    <option key={font.id} value={font.id}>
                      {index === 0 ? `${font.label} (implemented)` : font.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {selectedCases.length > 0 ? (
              <CaseSelect cases={selectedCases} selectedCase={selected.selectedCase} onSelect={handleSelectCase} />
            ) : null}
            <code style={codeStyle}>?demo={selected.id}{selected.selectedCase ? `&case=${selected.selectedCase}` : ''}</code>
          </div>
        </header>

        <div style={comparisonGridStyle}>
          <figure style={panelFrameStyle}>
            <figcaption style={captionStyle}>WebGL Reference</figcaption>
            <div data-validation-panel="reference" style={panelClipStyle}>
              <ThreeReference spec={selectedSpec} />
            </div>
          </figure>
          <figure style={panelFrameStyle}>
            <figcaption style={captionStyle}>Cube3D Candidate</figcaption>
            <div data-validation-panel="candidate" style={panelClipStyle}>
              <CubeCandidate spec={selectedSpec} />
            </div>
          </figure>
        </div>

        <DemoDetails spec={selectedSpec} />
      </section>
    </main>
  );
}

function CaseSelect({ cases, selectedCase, onSelect }: { cases: DemoCaseOption[]; selectedCase?: string; onSelect: (caseId: string) => void }) {
  return (
    <label style={fontSelectLabelStyle}>
      <span>Case</span>
      <select
        data-demo-case-select
        value={selectedCase ?? cases[0]?.id}
        onChange={(event) => onSelect(event.target.value)}
        style={fontSelectStyle}
      >
        {cases.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}

function withSolidTextFont(spec: DemoSpec, fontId: TypefaceFontId): DemoSpec {
  if (spec.id !== 'solid-text') return spec;
  return {
    ...spec,
    root: {
      ...spec.root,
      children: replaceSolidTextRows(spec, fontId),
    },
  };
}

function replaceSolidTextRows(spec: DemoSpec, fontId: TypefaceFontId) {
  const rows = createSolidTextDemoNodes(fontId);
  let inserted = false;
  return spec.root.children.flatMap((child) => {
    if (child.kind !== 'model' || child.modelName !== 'solid-text') return [child];
    if (inserted) return [];
    inserted = true;
    return rows;
  });
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

const headerControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const fontSelectLabelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  color: 'rgba(255,255,255,0.68)',
  fontSize: 12,
  fontWeight: 700,
};

const fontSelectStyle: React.CSSProperties = {
  minWidth: 190,
  height: 30,
  color: '#eef1ff',
  background: '#272b39',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 5,
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
