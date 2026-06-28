import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Cube3D, Plane3D, Scene3D, Space3D } from '@cube3d/react';

function App() {
  const [tilt, setTilt] = useState({ x: 58, y: 0, z: -34 });

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        placeItems: 'center',
        background: 'linear-gradient(145deg, #121418 0%, #20262a 54%, #30382f 100%)',
        color: '#eef3f8',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Scene3D
        perspective={980}
        origin="50% 45%"
        style={{
          width: 720,
          height: 560,
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 96px)',
        }}
      >
        <Space3D
          size={{ x: 420, y: 420, z: 220 }}
          position={{ x: 150, y: 94, z: 0 }}
          rotation={tilt}
        >
          <Plane3D
            size={{ x: 420, y: 420 }}
            material={{ kind: 'solid', rgba: [50, 66, 68, 1] }}
            faceStyle={{
              border: '1px solid rgba(214, 232, 218, 0.24)',
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
              boxShadow: '0 26px 80px rgba(0,0,0,0.34)',
            }}
          />

          <Cube3D
            size={{ x: 112, y: 112, z: 86 }}
            position={{ x: 70, y: 70, z: 43 }}
            material={{ kind: 'solid', rgba: [214, 112, 92, 1] }}
            contrast={18}
            faceStyle={(face) => ({
              border: '1px solid rgba(255,255,255,0.16)',
              display: 'grid',
              placeItems: 'center',
              color: face.direction === 'front' ? '#251512' : 'transparent',
              fontWeight: 700,
            })}
            faces={{ front: <span>A</span> }}
          />

          <Cube3D
            size={{ x: 76, y: 76, z: 148 }}
            position={{ x: 270, y: 235, z: 74 }}
            material={{ kind: 'solid', rgba: [96, 158, 224, 1] }}
            contrast={16}
            faceStyle={(face) => ({
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'grid',
              placeItems: 'center',
              color: face.direction === 'front' ? '#091723' : 'transparent',
              fontWeight: 700,
            })}
            faces={{ front: <span>B</span> }}
          />
        </Space3D>
      </Scene3D>

      <div
        style={{
          position: 'fixed',
          insetInline: 0,
          bottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <button type="button" onClick={() => setTilt({ x: 58, y: 0, z: -34 })} style={buttonStyle}>
          Iso
        </button>
        <button type="button" onClick={() => setTilt({ x: 68, y: 0, z: -18 })} style={buttonStyle}>
          Side
        </button>
        <button type="button" onClick={() => setTilt({ x: 42, y: 0, z: -48 })} style={buttonStyle}>
          Top
        </button>
      </div>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  minWidth: 76,
  minHeight: 38,
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 6,
  background: 'rgba(18, 20, 24, 0.78)',
  color: '#f8fafc',
  fontWeight: 700,
  cursor: 'pointer',
};

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(<App />);
