/**
 * Storybook preview configuration
 * Global decorators, parameters, and imports
 */

import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
