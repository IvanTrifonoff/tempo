
import { DanceStyle, Track } from './types';

export const APP_VERSION = '1.0.22-test';

export const INITIAL_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Passion Cha Cha',
    artist: 'Ballroom Orchestra',
    style: DanceStyle.CHA_CHA,
    bpm: 31,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isPreloaded: true
  },
  {
    id: '2',
    title: 'Moonlight Waltz',
    artist: 'Vienna Strings',
    style: DanceStyle.WALTZ,
    bpm: 29,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isPreloaded: true
  },
  {
    id: '3',
    title: 'Imperial Vienna',
    artist: 'Strauss Ensemble',
    style: DanceStyle.VIENNESE,
    bpm: 58,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    isPreloaded: true
  },
  {
    id: '4',
    title: 'Midnight Tango',
    artist: 'Buenos Aires Trio',
    style: DanceStyle.TANGO,
    bpm: 32,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    isPreloaded: true
  },
  {
    id: '5',
    title: 'Electric Quickstep',
    artist: 'Big Band Jazz',
    style: DanceStyle.QUICKSTEP,
    bpm: 50,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    isPreloaded: true
  },
  {
    id: '6',
    title: 'Soft Whispers Rumba',
    artist: 'Cuban Soul',
    style: DanceStyle.RUMBA,
    bpm: 25,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    isPreloaded: true
  },
  {
    id: '7',
    title: 'Espana Cani Style',
    artist: 'Bullfighter Brass',
    style: DanceStyle.PASODOBLE,
    bpm: 60,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    isPreloaded: true
  },
  {
    id: '8',
    title: 'Smooth Satin Foxtrot',
    artist: 'Lounge Masters',
    style: DanceStyle.FOXTROT,
    bpm: 28,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    isPreloaded: true
  },
  {
    id: '9',
    title: 'Neon Jive',
    artist: 'Rock & Roll Revival',
    style: DanceStyle.JIVE,
    bpm: 44,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    isPreloaded: true
  }
];

export const STYLE_COLORS: Record<DanceStyle, string> = {
  [DanceStyle.CHA_CHA]: 'bg-rose-500',
  [DanceStyle.WALTZ]: 'bg-blue-500',
  [DanceStyle.VIENNESE]: 'bg-indigo-500',
  [DanceStyle.TANGO]: 'bg-red-700',
  [DanceStyle.QUICKSTEP]: 'bg-yellow-500',
  [DanceStyle.RUMBA]: 'bg-pink-500',
  [DanceStyle.PASODOBLE]: 'bg-orange-600',
  [DanceStyle.FOXTROT]: 'bg-emerald-500',
  [DanceStyle.JIVE]: 'bg-purple-500',
  [DanceStyle.KIDS]: 'bg-cyan-500',
};
