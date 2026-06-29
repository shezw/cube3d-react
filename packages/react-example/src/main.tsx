import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { FaceDescriptor, SceneNode } from '@cube3d/core';
import { Box3D, Extrude3D, Model3D, Scene3D, Space3D, Sprite3D } from '@cube3d/react';
import { Character3D, characterMotionCss } from './scene/Character3D';
import { createCameraNode, createIslandNode } from './scene/models';

type Rgba = [number, number, number, number];

function App() {
  const scale = useViewportScale(1920, 1080);

  return (
    <main style={viewportStyle}>
      <style>{characterMotionCss}</style>
      <div style={{ ...pageStyle, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div style={cornerStyle('left')} />
        <div style={cornerStyle('right')} />

        <section style={sceneWrapStyle} aria-label="Pseudo 3D portfolio cover demo">
          <Scene3D perspective={1150} origin="42% 42%" style={{ width: 940, height: 690, maxWidth: '100%' }}>
            <Space3D size={{ x: 720, y: 520, z: 320 }} position={{ x: 150, y: 118, z: 0 }} rotation={{ x: 58, y: 0, z: -36 }}>
              <PortfolioIsland />
            </Space3D>
          </Scene3D>
        </section>

        <section style={titleBlockStyle}>
          <h1 style={headlineStyle}>
            玩<span style={{ fontSize: '0.56em', marginLeft: 18 }}>er</span>
            <br />
            <span style={{ fontSize: '0.58em', letterSpacing: 4 }}>设计</span>
          </h1>
          <p style={roleStyle}>跨媒体设计师<br />创意视觉设计师<br />梦想主义</p>
        </section>

        <footer style={footerStyle}>
          <span>余志伟个人作品集2016</span>
          <span>联络:186-0101-3441</span>
        </footer>
      </div>
    </main>
  );
}

function PortfolioIsland() {
  return (
    <>
      <Island3D />

      <Word3D text="DESIGN" color={[70, 170, 236, 1]} position={{ x: 44, y: 164, z: 70 }} size={42} depth={18} />
      <Word3D text="PORT" color={[124, 132, 255, 1]} position={{ x: 78, y: 218, z: 71 }} size={64} depth={28} />
      <Word3D text="FOLIO" color={[118, 126, 248, 1]} position={{ x: 94, y: 292, z: 72 }} size={58} depth={24} />
      <Word3D text="VISUAL" color={[239, 130, 168, 1]} position={{ x: 224, y: 92, z: 72 }} size={70} depth={30} />
      <Word3D text="ART" color={[246, 213, 98, 1]} position={{ x: 390, y: 164, z: 74 }} size={82} depth={36} />

      <RobotCamera />
      <Character3D position={{ x: 408, y: -2, z: 88 }} rotation={{ z: 0 }} scale={{ x: 1.22, y: 1.22, z: 1.22 }} />
      <TreeRing />
      <FloatingProps />
    </>
  );
}

function Word3D({ text, color, position, size, depth }: { text: string; color: Rgba; position: { x: number; y: number; z: number }; size: number; depth: number }) {
  return (
    <Extrude3D
      position={position}
      depth={depth}
      layers={Math.max(8, Math.round(depth / 2))}
      layerStyle={({ progress, isFront }) => ({
        fontSize: size,
        lineHeight: 0.82,
        fontWeight: 900,
        fontFamily: 'Arial Black, Impact, Inter, sans-serif',
        color: rgba(color, isFront ? 1 : 0.72 + progress * 0.2),
        textShadow: isFront ? '0 1px 0 rgba(255,255,255,0.24)' : undefined,
        filter: isFront ? undefined : `brightness(${0.58 + progress * 0.34})`,
        whiteSpace: 'nowrap',
        letterSpacing: -1,
      })}
    >
      {text}
    </Extrude3D>
  );
}

function RobotCamera() {
  const model = React.useMemo(() => createCameraNode(), []);

  return (
    <Space3D position={{ x: 155, y: 48, z: 78 }}>
      <Model3D model={model} nodeFaceStyle={styleCameraNode} />
    </Space3D>
  );
}

function Island3D() {
  const model = React.useMemo(() => createIslandNode(), []);

  return (
    <Model3D
      model={model}
      nodeFaceContent={{
        parkGrid: <div style={parkLabelStyle}>PARK<br />Some<br />Family<br />LOVELY</div>,
      }}
      nodeFaceStyle={styleIslandNode}
    />
  );
}

function styleIslandNode(node: SceneNode, face: FaceDescriptor): React.CSSProperties | undefined {
  if (node.id === 'base' && face.direction === 'top') {
    return {
      boxShadow: '0 34px 90px rgba(0,0,0,0.34)',
    };
  }

  if (node.id === 'parkGrid') {
    return {
      border: '1px solid rgba(255,255,255,0.12)',
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      backgroundSize: '26px 26px',
    };
  }

  return undefined;
}

function styleCameraNode(node: SceneNode): React.CSSProperties | undefined {
  if (node.id !== 'beam') return undefined;
  return beamStyle;
}

function TreeRing() {
  const trees = Array.from({ length: 24 }, (_, index) => {
    const angle = (index / 24) * Math.PI * 2;
    return {
      x: 300 + Math.cos(angle) * 116,
      y: 286 + Math.sin(angle) * 68,
    };
  });

  return (
    <>
      {trees.map((tree, index) => (
        <Space3D key={index} position={{ x: tree.x, y: tree.y, z: 72 }}>
          <Box3D size={{ x: 8, y: 8, z: 32 }} position={{ x: 4, y: 4, z: 0 }} material={{ kind: 'solid', rgba: [143, 111, 72, 1] }} contrast={5} />
          <Box3D size={{ x: 24, y: 24, z: 24 }} position={{ x: -4, y: -5, z: 26 }} material={{ kind: 'solid', rgba: [57, 180, 91, 1] }} faceStyle={{ borderRadius: 999 }} contrast={9} />
        </Space3D>
      ))}
    </>
  );
}

function FloatingProps() {
  return (
    <>
      <Space3D position={{ x: -110, y: 142, z: 28 }}>
        <Box3D size={{ x: 100, y: 70, z: 24 }} material={{ kind: 'solid', rgba: [56, 135, 184, 1] }} contrast={10} />
        <Sprite3D size={{ x: 72, y: 56 }} position={{ x: 14, y: 8, z: 26 }} faceStyle={laptopStyle}>
          <span style={{ fontSize: 48 }}>⌨</span>
        </Sprite3D>
      </Space3D>

      <Space3D position={{ x: 468, y: 390, z: 24 }}>
        <Box3D size={{ x: 100, y: 70, z: 28 }} material={{ kind: 'solid', rgba: [70, 178, 104, 1] }} contrast={10} />
        <Sprite3D size={{ x: 74, y: 50 }} position={{ x: 14, y: 10, z: 30 }} faceStyle={glassWidgetStyle}>
          <span style={{ fontSize: 42 }}>☁</span>
        </Sprite3D>
      </Space3D>

      <Space3D position={{ x: 246, y: 402, z: 26 }}>
        <Box3D size={{ x: 96, y: 68, z: 28 }} material={{ kind: 'solid', rgba: [202, 99, 113, 0.82] }} contrast={10} />
        <Sprite3D size={{ x: 74, y: 52 }} position={{ x: 12, y: 8, z: 30 }} faceStyle={redWidgetStyle}>
          <span style={{ fontSize: 40 }}>≋</span>
        </Sprite3D>
      </Space3D>
    </>
  );
}

function rgba(color: Rgba, alpha = color[3]) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function useViewportScale(width: number, height: number) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [height, width]);

  return scale;
}

const viewportStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background: '#1d1f2a',
};

const pageStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 1920,
  height: 1080,
  overflow: 'hidden',
  transformOrigin: 'center center',
  background:
    'radial-gradient(circle at 22% 24%, rgba(87,167,255,0.85) 0 2px, transparent 3px), radial-gradient(circle at 46% 12%, rgba(94,123,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 72% 8%, rgba(83,119,255,0.7) 0 1px, transparent 2px), linear-gradient(180deg, #1d1f2a 0%, #282c38 100%)',
  color: '#fff',
  fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
};

const sceneWrapStyle: React.CSSProperties = {
  position: 'absolute',
  left: 50,
  top: 78,
  width: 940,
  height: 690,
};

const titleBlockStyle: React.CSSProperties = {
  position: 'absolute',
  right: 190,
  top: 128,
  width: 390,
};

const headlineStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 144,
  lineHeight: 0.92,
  fontWeight: 800,
  letterSpacing: 1,
};

const roleStyle: React.CSSProperties = {
  marginTop: 210,
  color: 'rgba(255,255,255,0.66)',
  fontSize: 16,
  lineHeight: 2,
};

const footerStyle: React.CSSProperties = {
  position: 'absolute',
  left: 68,
  right: 394,
  bottom: 56,
  display: 'flex',
  justifyContent: 'space-between',
  color: 'rgba(255,255,255,0.65)',
  fontSize: 16,
  letterSpacing: 1,
};

const parkLabelStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 16,
  color: 'rgba(255,255,255,0.18)',
  fontSize: 16,
  lineHeight: 1.15,
  fontWeight: 700,
  textAlign: 'center',
};

const beamStyle: React.CSSProperties = {
  opacity: 0.55,
  background:
    'linear-gradient(90deg, rgba(255,66,92,0.52), rgba(255,66,92,0.12) 46%, transparent 76%)',
  clipPath: 'polygon(0 46%, 100% 0, 100% 100%)',
  filter: 'blur(0.4px)',
};

const laptopStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  color: '#d8dde4',
  background: 'linear-gradient(180deg, #d7dee7, #9ba6b1)',
  border: '4px solid #2d3139',
};

const glassWidgetStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  color: 'rgba(217,255,220,0.85)',
  background: 'rgba(158,255,170,0.25)',
  border: '1px solid rgba(210,255,222,0.36)',
  boxShadow: '0 0 22px rgba(121,255,142,0.56) inset',
};

const redWidgetStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  color: 'rgba(255,120,140,0.9)',
  background: 'rgba(255,109,127,0.26)',
  border: '1px solid rgba(255,189,198,0.32)',
  boxShadow: '0 0 18px rgba(255,90,110,0.45) inset',
};

function cornerStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    width: side === 'left' ? 320 : 800,
    height: side === 'left' ? 176 : 410,
    background: '#3d4dc7',
    transform: side === 'left' ? 'skewY(-31deg)' : 'skewY(-29deg)',
    transformOrigin: side === 'left' ? '0 0' : '100% 100%',
    left: side === 'left' ? 0 : undefined,
    right: side === 'right' ? -68 : undefined,
    top: side === 'left' ? -10 : undefined,
    bottom: side === 'right' ? -170 : undefined,
  };
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(<App />);
