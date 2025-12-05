import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Scene3D, Group3D, Cube3D } from '@cube3d/react';
import { keyframesToCss, ensureStyle } from '@cube3d/css-renderer';

function App() {
  const headRef = useRef<any>(null);

  // define jump & spiral animations similar to original presets
  const jump = {
    20: { transform: { translateY: '25%' } },
    40: { transform: { translateY: '-150%', scaleY: 1.5, scaleZ: 0.5 } },
    60: { transform: { translateY: '35%', scaleY: 0.75, scaleX: 1.25, scaleZ: 1 } },
    80: { transform: { translateY: '-75%', scaleY: 1.5, scaleZ: 0.5 } },
    100: { transform: { translateY: '0', scaleY: 1, scaleZ: 1 } },
  };

  const spiral = {
    0: { transform: { rotateZ: 45, scaleY: 1, scaleX: 1, scaleZ: 1 } },
    50: { transform: { translateY: '-100%', rotateZ: 585, scaleY: 1.5, scaleX: 1, scaleZ: 1 } },
    100: { transform: { rotateZ: 765, scaleX: 1, scaleY: 1, scaleZ: 1 } },
  };
  return (
    <div style={{ background: '#232325', minHeight: '100vh', color: '#ccc' }}>
      <div style={{ margin: '10px auto', padding: '200px 0 100px 0' }}>
        <div style={{ width: 160, height: 160, margin: '0 auto' }}>
          <Scene3D perspective={900}>
            <Group3D rotation={{ x: -120, y: 0, z: 45 }} ref={headRef}>
              <Cube3D size={{ x: 160, y: 160, z: 160 }} material={{ kind: 'solid', rgba: [205,175,145,1], contrast: 20 }}>
                {/* simple front image overlay */}
                <div style={{ position: 'absolute', width: '120px', height: '120px', left: '20px', top: '20px', transform: 'translateZ(80px)' }}>
                  <img src="/face.png" alt="face" style={{ width: '100%', height: '100%' }} />
                </div>
              </Cube3D>
              {/* Hat layers positioned along -Z axis to match original demo */}
              <Group3D position={{ x: 0, y: 0, z: -120 }}>
                <Cube3D size={{ x: 168, y: 168, z: 16 }} material={{ kind: 'solid', rgba: [240,230,210,1], contrast: 20 }} />
              </Group3D>
              <Group3D position={{ x: 0, y: 0, z: -128 }}>
                <Cube3D size={{ x: 120, y: 120, z: 24 }} material={{ kind: 'solid', rgba: [100,90,85,1], contrast: 20 }} />
              </Group3D>
              <Group3D position={{ x: 0, y: 0, z: -152 }}>
                <Cube3D size={{ x: 120, y: 120, z: 32 }} material={{ kind: 'solid', rgba: [240,230,210,1], contrast: 20 }} />
              </Group3D>
            </Group3D>
          </Scene3D>
        </div>
        <div style={{ position: 'fixed', left: '20px', bottom: '20px', display: 'flex', gap: '12px' }}>
          <button
            style={{ padding: '10px 30px', fontSize: '16pt' }}
            onClick={() => {
              const name = 'c3d-jump';
              const css = keyframesToCss(name, jump);
              ensureStyle(css);
              const target = headRef.current?.getElement();
              if (target) {
                target.style.animation = `${name} 750ms ease-out 0ms 1 normal backwards`;
              }
            }}
          >
            Jump
          </button>
          <button
            style={{ padding: '10px 30px', fontSize: '16pt' }}
            onClick={() => {
              const name = 'c3d-spiral';
              const css = keyframesToCss(name, spiral);
              ensureStyle(css);
              const target = headRef.current?.getElement();
              if (target) {
                target.style.animation = `${name} 1000ms ease-out 0ms 1 normal backwards`;
              }
            }}
          >
            Spiral
          </button>
        </div>
      </div>
    </div>
  );
}

const el = document.getElementById('root')!;
createRoot(el).render(<App />);
