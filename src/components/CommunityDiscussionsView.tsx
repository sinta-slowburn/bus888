import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Sparkles,
  Bus,
  Train,
  CloudRain,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  Share2
} from 'lucide-react';
import { DisqusThread } from './DisqusThread';

interface DiscussionChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const CHANNELS: DiscussionChannel[] = [
  {
    id: 'sg-transit-general',
    name: 'General Commuter Lounge',
    description: 'Share daily Singapore transit tips, morning commute experiences, and ask questions.',
    icon: 'forum',
    color: 'bg-blue-600'
  },
  {
    id: 'sg-bus-delays-crowds',
    name: 'Bus Timings & Crowd Reports',
    description: 'Live field updates on bus bunched services, crowded stops, and driver appreciation.',
    icon: 'directions_bus',
    color: 'bg-emerald-600'
  },
  {
    id: 'sg-mrt-updates',
    name: 'MRT & Rail Discussions',
    description: 'Track line disruptions, train crowding during peak hours, and new station feedback.',
    icon: 'train',
    color: 'bg-purple-600'
  },
  {
    id: 'sg-rain-transit-tips',
    name: 'Weather & Sheltered Pathways',
    description: 'Wet weather commuting hacks, best covered linkways between MRT stations & malls.',
    icon: 'umbrella',
    color: 'bg-amber-600'
  }
];

export const CommunityDiscussionsView: React.FC = () => {
  const [activeChannelId, setActiveChannelId] = useState<string>('sg-transit-general');

  const currentChannel =
    CHANNELS.find((c) => c.id === activeChannelId) || CHANNELS[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Community Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              <MessageSquare className="w-4 h-4" />
              Singapore Commuter Community
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Disqus Commuter Discussions & Feedback
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
              Connect with fellow Singapore commuters in real-time. Discuss bus frequencies, MRT experiences, rainy day routes, and transit tips powered by Disqus.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="text-xs font-bold">Disqus Live Feed Active</div>
          </div>
        </div>
      </div>

      {/* Channel Topic Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {CHANNELS.map((ch) => {
          const isActive = ch.id === activeChannelId;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-8 h-8 rounded-xl ${ch.color} text-white flex items-center justify-center shadow-xs flex-shrink-0`}
                >
                  <span className="material-symbols-outlined text-[18px]">{ch.icon}</span>
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                  {ch.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                {ch.description}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                  {isActive ? '● Active Channel' : 'View Thread'}
                </span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Channel Header Info */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${currentChannel.color} text-white flex items-center justify-center shadow-sm`}>
            <span className="material-symbols-outlined text-[20px]">{currentChannel.icon}</span>
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {currentChannel.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Topic ID: <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{currentChannel.id}</code>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <span>Disqus Comments Widget</span>
        </div>
      </div>

      {/* Embed Disqus Thread Component */}
      <DisqusThread
        shortname="sinta888"
        identifier={currentChannel.id}
        title={`${currentChannel.name} - SG Transit`}
      />
    </div>
  );
};
