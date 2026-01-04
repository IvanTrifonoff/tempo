import React, { useState, useCallback } from 'react';
import { SafeBlueprint, SafeNode, SafeStyleProps, SafeAction } from './types';
import * as Icons from '../components/Icons'; // Используем существующие иконки

// --- 1. Style Resolver (Sanitizer) ---
// Превращает абстрактные пропсы в конкретные Tailwind классы
// Защищает от ломающих стилей (например, fixed z-9999)
const resolveStyles = (s?: SafeStyleProps): string => {
  if (!s) return '';
  const classes = [];
  if (s.padding) classes.push(s.padding);
  if (s.margin) classes.push(s.margin);
  if (s.background) classes.push(s.background);
  if (s.color) classes.push(s.color);
  if (s.radius) classes.push(s.radius);
  if (s.layout) classes.push(s.layout);
  if (s.width) classes.push(s.width);
  if (s.shadow) classes.push('shadow-lg');
  return classes.join(' ');
};

interface SafeEngineProps {
  blueprint: SafeBlueprint;
  onEvent?: (eventName: string, payload: any) => void;
}

export const SafeEngine: React.FC<SafeEngineProps> = ({ blueprint, onEvent }) => {
  const [localState, setLocalState] = useState<Record<string, any>>({});

  // --- 2. Action Handler ---
  const handleAction = useCallback((actionId?: string) => {
    if (!actionId || !blueprint.actions[actionId]) return;
    const action = blueprint.actions[actionId];

    switch (action.type) {
      case 'console_log':
        console.log('[SafeEngine Log]', action.payload);
        break;
      case 'alert':
        alert(action.payload);
        break;
      case 'custom_event':
        if (onEvent) onEvent(action.payload.name, action.payload.data);
        break;
      // В будущем можно добавить мутацию localState
    }
  }, [blueprint.actions, onEvent]);

  // --- 3. Recursive Renderer ---
  const renderNode = (node: SafeNode): React.ReactNode => {
    const commonClasses = resolveStyles(node.style);
    const key = node.id;

    try {
      switch (node.type) {
        case 'container':
          return (
            <div key={key} className={commonClasses} onClick={() => handleAction(node.onClickAction)}>
              {node.children?.map(renderNode)}
            </div>
          );

        case 'card':
          return (
            <div key={key} className={`bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl ${commonClasses}`}>
              {node.children?.map(renderNode)}
            </div>
          );

        case 'text':
          const Tag = node.props.variant === 'h1' ? 'h1' : node.props.variant === 'h2' ? 'h2' : 'p';
          const sizeClass = node.props.variant === 'h1' ? 'text-2xl font-bold' : node.props.variant === 'h2' ? 'text-lg font-bold' : 'text-sm text-gray-400';
          return (
            <Tag key={key} className={`${sizeClass} ${commonClasses}`}>
              {node.props.content}
            </Tag>
          );

        case 'button':
          return (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); handleAction(node.onClickAction); }}
              className={`px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition active:scale-95 ${commonClasses}`}
            >
              {node.props.label}
              {node.props.icon && (Icons as any)[node.props.icon] && React.createElement((Icons as any)[node.props.icon], { className: "ml-2 w-4 h-4" })}
            </button>
          );

        case 'icon':
            const IconComp = (Icons as any)[node.props.name || 'MetronomeIcon'];
            return IconComp ? <div key={key} className={commonClasses}><IconComp /></div> : null;

        default:
          return <div key={key} className="text-red-500 text-xs">Unknown: {node.type}</div>;
      }
    } catch (e) {
      return <div key={key} className="hidden">Render Error</div>;
    }
  };

  return (
    <div className="safe-engine-root animate-in fade-in duration-300">
      {renderNode(blueprint.root)}
    </div>
  );
};
