
export enum DanceStyle {
  CHA_CHA = 'Cha-Cha-Cha',
  SAMBA = 'Samba',
  WALTZ = 'Slow Waltz',
  VIENNESE = 'Viennese Waltz',
  TANGO = 'Tango',
  QUICKSTEP = 'Quickstep',
  RUMBA = 'Rumba',
  PASODOBLE = 'Pasodoble',
  FOXTROT = 'Foxtrot',
  JIVE = 'Jive',
  KIDS = 'Kids'
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  style: DanceStyle;
  bpm: number;
  url: string;
  ownerId: string;
  isPublic: boolean;
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
  clapDetectionEnabled?: boolean;
}

export interface User {
  id: string;
  email: string;
  isSubscribed: boolean;
  isAdmin: boolean;
  role: 'admin' | 'coach' | 'student';
  coachId?: string | null;
  favorites: string[];
  trackLimit?: number;
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
  isRepeat: boolean;
  isShuffle: boolean;
}
