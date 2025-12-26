
export enum DanceStyle {
  CHA_CHA = 'Cha-Cha-Cha',
  WALTZ = 'Slow Waltz',
  VIENNESE = 'Viennese Waltz',
  TANGO = 'Tango',
  QUICKSTEP = 'Quickstep',
  RUMBA = 'Rumba',
  PASODOBLE = 'Pasodoble',
  FOXTROT = 'Foxtrot',
  JIVE = 'Jive'
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  style: DanceStyle;
  bpm: number;
  url: string;
  isPreloaded?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface TrainingSettings {
  isActive: boolean;
  trackDurationLimit: number; // 0 means no limit
  pauseDuration: number;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  clapDetectionEnabled: boolean;
  clapSensitivity: number;
}

export interface User {
  email: string;
  isSubscribed: boolean;
  isAdmin: boolean;
  favorites: string[];
}

export interface PlayerState {
  currentTrack: null | Track;
  isPlaying: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  volume: number;
  isPauseCountdown: boolean;
  countdownValue: number;
}
