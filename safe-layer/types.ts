export type SafeComponentType = 
  | 'container' 
  | 'text' 
  | 'button' 
  | 'image' 
  | 'card'
  | 'icon';

export type SafeActionType = 
  | 'console_log' 
  | 'alert' 
  | 'toggle_visible'
  | 'custom_event'; // Для общения с основным App

export interface SafeStyleProps {
  padding?: string; // 'p-2', 'px-4'
  margin?: string;
  background?: string; // 'bg-white/10'
  color?: string; // 'text-yellow-500'
  radius?: string; // 'rounded-xl'
  layout?: string; // 'flex flex-col gap-2'
  width?: string;
  shadow?: boolean;
}

export interface SafeNode {
  id: string;
  type: SafeComponentType;
  props: Record<string, any>;
  style?: SafeStyleProps;
  children?: SafeNode[];
  onClickAction?: string; // ID действия
}

export interface SafeAction {
  type: SafeActionType;
  payload?: any;
}

export interface SafeBlueprint {
  id: string;
  title: string;
  root: SafeNode;
  actions: Record<string, SafeAction>;
}
