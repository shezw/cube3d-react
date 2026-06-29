/*
    Cube3D React
    packages/react-example/src/main.tsx
    Repository: https://github.com/shezw/cube3d-react
*/

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DemoGallery } from './demos/DemoGallery';

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(<DemoGallery />);
