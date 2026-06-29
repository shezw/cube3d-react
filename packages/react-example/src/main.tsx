/*
    Cube3D React
    packages/react-example/src/main.tsx

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DemoGallery } from './demos/DemoGallery';

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(<DemoGallery />);
