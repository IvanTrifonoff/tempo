import React, { useMemo } from 'react';
import { SafeNode, SafeManifestSchema } from './schema';
import * as Icons from '../Icons';

// --- Mappers ---

const mapPadding = (p?: string) => {
  switch (p) {
    case 'small': return 'p-2';
    case 'medium': return 'p-4';
    case 'large': return 'p-6';
    default: return '';
  }
};

const mapMargin = (m?: string) => {
  switch (m) {
    case 'small': return 'm-2';
    case 'medium': return 'm-4';
    case 'large': return 'm-6';
    default: return '';
  }
};

const mapGap = (g?: string) => {
    switch (g) {
      case 'none': return 'gap-0';
      case 'small': return 'gap-2';
      case 'medium': return 'gap-4';
      case 'large': return 'gap-8';
      default: return 'gap-2';
    }
};

const mapColor = (c?: string) => {
    switch (c) {
        case 'yellow': return 'text-yellow-500';
        case 'red': return 'text-red-500';
        case 'white': return 'text-white';
        case 'gray': return 'text-gray-500';
        default: return 'text-current';
    }
}

interface SafeRendererProps {
  node: SafeNode;
  onAction: (actionId: string, payload?: any) => void;
}

const SafeNodeRenderer: React.FC<SafeRendererProps> = ({ node, onAction }) => {
  const commonClasses = [
    mapPadding(node.style?.padding),
    mapMargin(node.style?.margin),
    node.style?.background || '', // Zod regex already validated this is safe-ish
    node.style?.shadow ? 'shadow-lg' : '',
    node.style?.width === 'full' ? 'w-full' : node.style?.width === '1/2' ? 'w-1/2' : '',
  ].filter(Boolean).join(' ');

  switch (node.type) {
    case 'container':
      const layoutClass = node.props.layout === 'row' ? 'flex-row' : 'flex-col';
      const alignClass = node.props.align ? `items-${node.props.align}` : '';
      const justifyClass = node.props.justify ? `justify-${node.props.justify}` : '';
      
      return (
        <div className={`flex ${layoutClass} ${mapGap(node.props.gap)} ${alignClass} ${justifyClass} ${commonClasses}`}>
          {node.children.map(child => (
            <SafeNodeRenderer key={child.id} node={child} onAction={onAction} />
          ))}
        </div>
      );

    case 'text':
      const Tag = ['h1', 'h2', 'h3'].includes(node.props.variant) ? node.props.variant as any : 'p';
      const variantClasses = {
        h1: 'text-3xl font-bold text-white',
        h2: 'text-xl font-bold text-white',
        h3: 'text-lg font-bold text-gray-200',
        body: 'text-base text-gray-300',
        caption: 'text-xs text-gray-500 uppercase tracking-wide'
      }[node.props.variant];
      const align = node.props.align ? `text-${node.props.align}` : 'text-left';

      return (
        <Tag className={`${variantClasses} ${align} ${commonClasses}`}>
          {node.props.content}
        </Tag>
      );

    case 'button':
      const btnVariant = {
        primary: 'bg-yellow-500 text-black hover:bg-yellow-400',
        secondary: 'bg-white/10 text-white hover:bg-white/20',
        danger: 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50',
        ghost: 'bg-transparent text-gray-400 hover:text-white'
      }[node.props.variant];

      return (
        <button
          onClick={() => node.actionId && onAction(node.actionId)}
          disabled={node.props.disabled}
          className={`px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${btnVariant} ${commonClasses} ${node.props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {node.props.icon && (Icons as any)[node.props.icon] && React.createElement((Icons as any)[node.props.icon], { className: "w-4 h-4" })}
          {node.props.label}
        </button>
      );
    
    case 'icon':
        const IconComp = (Icons as any)[node.props.name];
        if (!IconComp) return null;
        return (
            <div className={`${commonClasses} ${mapColor(node.props.color)}`}>
                <IconComp />
            </div>
        )

    case 'image':
      return (
        <img 
            src={node.props.src} 
            alt={node.props.alt} 
            className={`rounded-xl object-cover ${commonClasses} ${node.props.aspectRatio === 'square' ? 'aspect-square' : node.props.aspectRatio === 'video' ? 'aspect-video' : ''}`} 
        />
      );

    default:
      return null;
  }
};

export const SafeRenderer: React.FC<{ data: unknown, onAction: (id: string) => void }> = ({ data, onAction }) => {
  // Runtime Validation
  const result = SafeManifestSchema.safeParse(data);

  if (!result.success) {
    console.error("SafeRenderer Validation Error:", result.error);
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400 text-xs font-mono">
        <strong>UI Protocol Violation:</strong>
        <pre>{JSON.stringify(result.error.format(), null, 2)}</pre>
      </div>
    );
  }

  return (
    <div id="safe-island-root" className="safe-island-isolation">
       <SafeNodeRenderer node={result.data.root} onAction={onAction} />
    </div>
  );
};
