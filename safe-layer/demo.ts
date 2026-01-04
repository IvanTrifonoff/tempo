import { SafeBlueprint } from './types';

export const DEMO_BLUEPRINT: SafeBlueprint = {
  id: 'demo-welcome',
  title: 'Welcome Banner',
  root: {
    id: 'root',
    type: 'container',
    style: {
      padding: 'p-4',
      margin: 'mb-4',
      background: 'bg-indigo-500/10',
      radius: 'rounded-2xl',
      layout: 'flex items-center justify-between border border-indigo-500/30'
    },
    children: [
      {
        id: 'text-col',
        type: 'container',
        children: [
          {
            id: 'title',
            type: 'text',
            props: { content: 'Safe Mode Active', variant: 'h2' },
            style: { color: 'text-indigo-400' }
          },
          {
            id: 'desc',
            type: 'text',
            props: { content: 'This UI is generated via Safe Engine JSON.' },
          }
        ]
      },
      {
        id: 'action-btn',
        type: 'button',
        props: { label: 'Test Action', icon: 'ShieldCheckIcon' },
        onClickAction: 'test_click'
      }
    ]
  },
  actions: {
    'test_click': {
      type: 'alert',
      payload: 'Safe Engine Works! No DOM manipulation used.'
    }
  }
};
