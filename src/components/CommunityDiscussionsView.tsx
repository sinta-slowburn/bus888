import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  MessageCircle,
  Tag,
  Clock,
  Sparkles,
  AlertTriangle,
  Bus,
  Train,
  CloudRain,
  Share2,
  CheckCircle2,
  Filter,
  Search,
  User,
  CornerDownRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { DisqusThread } from './DisqusThread';

export interface CommuterPost {
  id: string;
  channelId: string;
  authorName: string;
  content: string;
  category: 'General' | 'Delay / Crowd' | 'Bus Service' | 'MRT Alert' | 'Weather Tip';
  timestamp: number;
  upvotes: number;
  hasUpvoted?: boolean;
  replies?: Array<{
    id: string;
    authorName: string;
    content: string;
    timestamp: number;
  }>;
}

interface DiscussionChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  badgeColor: string;
}

const CHANNELS: DiscussionChannel[] = [
  {
    id: 'sg-transit-general',
    name: 'General Commuter Lounge',
    description: 'Share daily Singapore transit tips, commute questions, and general discussions.',
    icon: 'forum',
    color: 'bg-blue-600',
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400'
  },
  {
    id: 'sg-bus-delays-crowds',
    name: 'Bus Timings & Crowd Reports',
    description: 'Live field updates on bus bunched services, crowded stops, and driver appreciation.',
    icon: 'directions_bus',
    color: 'bg-emerald-600',
    badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400'
  },
  {
    id: 'sg-mrt-updates',
    name: 'MRT & Rail Discussions',
    description: 'Track line disruptions, train crowding during peak hours, and station feedback.',
    icon: 'train',
    color: 'bg-purple-600',
    badgeColor: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400'
  },
  {
    id: 'sg-rain-transit-tips',
    name: 'Weather & Sheltered Pathways',
    description: 'Wet weather commuting hacks, best covered linkways between MRT stations & malls.',
    icon: 'umbrella',
    color: 'bg-amber-600',
    badgeColor: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400'
  }
];

const INITIAL_POSTS: CommuterPost[] = [
  {
    id: 'post-1',
    channelId: 'sg-transit-general',
    authorName: 'Alex Tan',
    content: 'Pro tip for morning commuters transferring at Dhoby Ghaut: walk through the North South Line linkway at platform B for a faster connection to the North East Line!',
    category: 'General',
    timestamp: Date.now() - 1000 * 60 * 35,
    upvotes: 14,
    replies: [
      {
        id: 'rep-1',
        authorName: 'Sarah K.',
        content: 'Super helpful! Saved me 5 minutes during rush hour today.',
        timestamp: Date.now() - 1000 * 60 * 18
      }
    ]
  },
  {
    id: 'post-2',
    channelId: 'sg-bus-delays-crowds',
    authorName: 'Marcus L.',
    content: 'Bus 190 heading towards Orchard is currently quite packed at Bukit Panjang Interchange due to rain. Consider taking the DTL train if you are in a rush!',
    category: 'Delay / Crowd',
    timestamp: Date.now() - 1000 * 60 * 15,
    upvotes: 8,
    replies: []
  },
  {
    id: 'post-3',
    channelId: 'sg-mrt-updates',
    authorName: 'Wei Ming',
    content: 'Thomson-East Coast Line frequencies seem to have improved significantly during evening peak hours. Trains arriving every 2.5 minutes at Orchard station.',
    category: 'MRT Alert',
    timestamp: Date.now() - 1000 * 60 * 65,
    upvotes: 19,
    replies: []
  },
  {
    id: 'post-4',
    channelId: 'sg-rain-transit-tips',
    authorName: 'Cheryl Goh',
    content: 'Fully sheltered route from Raffles Place MRT Exit B straight to Telok Ayer Market: go through Republic Plaza basement tunnel, completely dry even in heavy rain!',
    category: 'Weather Tip',
    timestamp: Date.now() - 1000 * 60 * 120,
    upvotes: 27,
    replies: [
      {
        id: 'rep-2',
        authorName: 'Darren T.',
        content: 'Can confirm! There are signs posted near the basement food hall.',
        timestamp: Date.now() - 1000 * 60 * 45
      }
    ]
  }
];

const STORAGE_KEY = 'sg_transit_community_posts_v1';

export const CommunityDiscussionsView: React.FC = () => {
  const [activeChannelId, setActiveChannelId] = useState<string>('sg-transit-general');
  const [viewMode, setViewMode] = useState<'feed' | 'disqus'>('feed');
  const [posts, setPosts] = useState<CommuterPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading saved posts:', e);
    }
    return INITIAL_POSTS;
  });

  // New Post Form State
  const [authorName, setAuthorName] = useState<string>('Commuter');
  const [newContent, setNewContent] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CommuterPost['category']>('General');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Replying state
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replyAuthor, setReplyAuthor] = useState<string>('Commuter');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('Error persisting posts:', e);
    }
  }, [posts]);

  const currentChannel =
    CHANNELS.find((c) => c.id === activeChannelId) || CHANNELS[0];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    const newPost: CommuterPost = {
      id: `post-${Date.now()}`,
      channelId: activeChannelId,
      authorName: authorName.trim() || 'Anonymous Commuter',
      content: newContent.trim(),
      category: selectedCategory,
      timestamp: Date.now(),
      upvotes: 1,
      hasUpvoted: true,
      replies: []
    };

    setTimeout(() => {
      setPosts((prev) => [newPost, ...prev]);
      setNewContent('');
      setIsSubmitting(false);
      setShowSuccessBadge(true);
      setTimeout(() => setShowSuccessBadge(false), 3000);
    }, 200);
  };

  const handleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const alreadyUpvoted = p.hasUpvoted;
          return {
            ...p,
            upvotes: alreadyUpvoted ? p.upvotes - 1 : p.upvotes + 1,
            hasUpvoted: !alreadyUpvoted
          };
        }
        return p;
      })
    );
  };

  const handleAddReply = (postId: string) => {
    if (!replyText.trim()) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newReply = {
            id: `rep-${Date.now()}`,
            authorName: replyAuthor.trim() || 'Commuter',
            content: replyText.trim(),
            timestamp: Date.now()
          };
          return {
            ...p,
            replies: [...(p.replies || []), newReply]
          };
        }
        return p;
      })
    );

    setReplyText('');
    setReplyingToPostId(null);
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesChannel = p.channelId === activeChannelId;
    const matchesSearch =
      searchQuery === '' ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || p.category === filterCategory;

    return matchesChannel && matchesSearch && matchesCategory;
  });

  const formatTimeAgo = (time: number) => {
    const seconds = Math.floor((Date.now() - time) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryBadgeClass = (category: CommuterPost['category']) => {
    switch (category) {
      case 'Delay / Crowd':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400';
      case 'Bus Service':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
      case 'MRT Alert':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-400';
      case 'Weather Tip':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Community Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              <MessageSquare className="w-4 h-4" />
              Singapore Commuter Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Live Commuter Discussions & Feedback
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
              Post real-time crowd reports, ask transit questions, and share daily commuting tips with fellow commuters across Singapore.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="text-xs font-bold">
              {posts.filter((p) => p.channelId === activeChannelId).length} Active Reports
            </div>
          </div>
        </div>
      </div>

      {/* Channel Topic Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {CHANNELS.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const channelPostsCount = posts.filter((p) => p.channelId === ch.id).length;
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
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl ${ch.color} text-white flex items-center justify-center shadow-xs flex-shrink-0`}
                >
                  <span className="material-symbols-outlined text-[18px]">{ch.icon}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {channelPostsCount} posts
                </span>
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 block mb-1">
                  {ch.name}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                  {ch.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                  {isActive ? '● Selected Channel' : 'View Channel'}
                </span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode Switcher (Instant Commuter Board vs Disqus Global) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${currentChannel.color} text-white flex items-center justify-center`}>
            <span className="material-symbols-outlined text-[18px]">{currentChannel.icon}</span>
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {currentChannel.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Channel: <code className="text-blue-600 dark:text-blue-400 font-mono">{currentChannel.id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'feed'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Input & Feed</span>
          </button>
          <button
            onClick={() => setViewMode('disqus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'disqus'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Disqus Embed (`sinta888`)</span>
          </button>
        </div>
      </div>

      {viewMode === 'feed' ? (
        <div className="space-y-6">
          {/* PROMINENT DIRECT POST INPUT BOX */}
          <div
            id="commuter-discussion-input-section"
            className="bg-white dark:bg-slate-850 rounded-3xl p-5 sm:p-6 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-md transition"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Post a Commuter Update or Question
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type directly below — no external registration required!
                  </p>
                </div>
              </div>

              {showSuccessBadge && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-xs font-bold animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Posted successfully!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Top Controls: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name / Handle:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Commuter, Bus Fan, Tan..."
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Post Category:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as CommuterPost['category'])}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="General">💬 General Discussion / Transit Tip</option>
                    <option value="Delay / Crowd">⚠️ Delay / Heavy Crowd Alert</option>
                    <option value="Bus Service">🚌 Bus Service Frequency Note</option>
                    <option value="MRT Alert">🚆 MRT Line Feedback</option>
                    <option value="Weather Tip">🌧️ Rain / Sheltered Walkway Advice</option>
                  </select>
                </div>
              </div>

              {/* Main Text Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Message / Field Report:
                </label>
                <textarea
                  id="commuter-comment-input"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={`Type your comment, delay report, or question for ${currentChannel.name}...`}
                  rows={3}
                  className="w-full p-4 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Posts appear immediately in the live channel feed below.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newContent.trim()}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Feed Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {['all', 'General', 'Delay / Crowd', 'Bus Service', 'MRT Alert', 'Weather Tip'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    filterCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'All Posts' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No discussions found in this view
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Be the first to post a transit update or tip in the input box above!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {post.authorName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(post.category)}`}>
                            {post.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(post.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Body */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line mb-4">
                    {post.content}
                  </p>

                  {/* Post Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpvote(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition font-bold ${
                          post.hasUpvoted
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.hasUpvoted ? 'fill-current' : ''}`} />
                        <span>{post.upvotes} Helpful</span>
                      </button>

                      <button
                        onClick={() => setReplyingToPostId(replyingToPostId === post.id ? null : post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.replies && post.replies.length > 0 ? `${post.replies.length} Replies` : 'Reply'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Replies List */}
                  {post.replies && post.replies.length > 0 && (
                    <div className="mt-3.5 pl-4 sm:pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800">
                      {post.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {reply.authorName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatTimeAgo(reply.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Input Box */}
                  {replyingToPostId === post.id && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={replyAuthor}
                          onChange={(e) => setReplyAuthor(e.target.value)}
                          placeholder="Your name"
                          className="w-full sm:w-32 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddReply(post.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddReply(post.id)}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* DISQUS EMBED VIEW */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <strong>Disqus Community Thread:</strong> You can comment below using your Disqus, Google, or social login. If the Disqus box is loading, you can also switch back to the <strong>Direct Input & Feed</strong> tab above to post immediately without logging in.
          </div>

          <DisqusThread
            shortname="sinta888"
            identifier={currentChannel.id}
            title={`${currentChannel.name} - SG Transit`}
          />
        </div>
      )}
    </div>
  );
};
