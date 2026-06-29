/*
    cube3d-react
    packages/react-example/src/main.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DemoGallery } from './demos/DemoGallery';

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(<DemoGallery />);
