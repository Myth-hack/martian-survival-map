/**
 * Futuristic Cinematic Sci-Fi Bottom Navigation Bar
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 *
 * Provides a fixed, responsive bottom HUD navigation bar with 10 mission tabs,
 * glowing active states, sci-fi monospace labels, and smooth tab switching.
 */

import React, { useRef, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Navigation,
  Layers,
  AlertTriangle,
  Microscope,
  User,
  HelpCircle,
  Users,
  MessageSquare,
  LucideIcon
} from 'lucide-react';

export interface BottomNavTabItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
}

export interface BottomNavigationBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabs?: BottomNavTabItem[];
}

export const DEFAULT_BOTTOM_NAV_TABS: BottomNavTabItem[] = [
  {
    id: 'LOCATIONS',
    label: '10 Sites',
    shortLabel: 'Sites',
    icon: Compass,
    description: '10 Iconic Martian Geological Sites'
  },
  {
    id: 'AI_HUB',
    label: 'AI Hub',
    shortLabel: 'AI Hub',
    icon: Sparkles,
    description: 'Neural Strategic Mission Intelligence'
  },
  {
    id: 'ROUTES',
    label: 'Routing',
    shortLabel: 'Routing',
    icon: Navigation,
    description: 'Pareto-Optimal A* Rover Pathfinding'
  },
  {
    id: 'LAYERS',
    label: 'Layers',
    shortLabel: 'Layers',
    icon: Layers,
    description: 'HiRISE, MOLA & Mineral GIS Overlays'
  },
  {
    id: 'HAZARDS',
    label: 'Hazards',
    shortLabel: 'Hazards',
    icon: AlertTriangle,
    description: 'Real-time Slope, Dust & Dune Detection'
  },
  {
    id: 'SCIENCE',
    label: 'Science',
    shortLabel: 'Science',
    icon: Microscope,
    description: 'Biosignature & Geological Sample Targets'
  },
  {
    id: 'MARSWALK',
    label: 'EVA',
    shortLabel: 'EVA',
    icon: User,
    description: 'Astronaut Marswalk & Consumables'
  },
  {
    id: 'WHAT_IF',
    label: 'What-If',
    shortLabel: 'What-If',
    icon: HelpCircle,
    description: 'Contingency Simulator & Sandstorms'
  },
  {
    id: 'CONSENSUS',
    label: 'Consensus',
    shortLabel: 'Consensus',
    icon: Users,
    description: 'Multi-Agent AI Second Opinion'
  },
  {
    id: 'AI_CHAT',
    label: 'AI Chat',
    shortLabel: 'AI Chat',
    icon: MessageSquare,
    description: 'Ground-Controlled Mars Mission Copilot'
  }
];

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabChange,
  className = '',
  tabs = DEFAULT_BOTTOM_NAV_TABS
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Normalize active tab matching to support case-insensitivity and aliases
  const isTabActive = (item: BottomNavTabItem): boolean => {
    const normalizedActive = activeTab.trim().toLowerCase();
    const normalizedId = item.id.trim().toLowerCase();
    const normalizedLabel = item.label.trim().toLowerCase();

    if (normalizedActive === normalizedId) return true;
    if (normalizedActive === normalizedLabel) return true;

    // Handle standard aliases
    if (normalizedActive === 'routing' && normalizedId === 'routes') return true;
    if (normalizedActive === 'routes' && normalizedId === 'routes') return true;
    if (normalizedActive === 'sites' && normalizedId === 'locations') return true;
    if (normalizedActive === 'eva' && normalizedId === 'marswalk') return true;
    if (normalizedActive === 'marswalk' && normalizedId === 'marswalk') return true;
    if (normalizedActive === 'consensus' && normalizedId === 'consensus') return true;
    if (normalizedActive === 'ai chat' && normalizedId === 'ai_chat') return true;
    if (normalizedActive === 'ai hub' && normalizedId === 'ai_hub') return true;

    return false;
  };

  // Scroll active tab into view horizontally on smaller viewports
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [activeTab]);

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Mission Control Bottom Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none pb-1.5 sm:pb-3 px-4 md:px-8 ${className}`}
    >
      {/* Sci-Fi Floating Pill / Dock */}
      <div
        ref={containerRef}
        role="tablist"
        className="pointer-events-auto relative w-full max-w-4xl lg:max-w-5xl bg-[#0a0d14]/90 sm:bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-2xl shadow-black/90 flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar scrollbar-none touch-pan-x"
      >
        {/* Subtle Top Glowing Cyan Accent Line */}
        <div
          aria-hidden="true"
          className="absolute -top-[1px] inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none"
        />

        {/* Tactical HUD Corner Trim (Sci-Fi Aesthetic) */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-1 left-2 w-1.5 h-1.5 border-t border-l border-cyan-500/50 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-1 right-2 w-1.5 h-1.5 border-t border-r border-cyan-500/50 pointer-events-none"
        />

        {tabs.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              ref={active ? activeTabRef : null}
              id={`bottom-nav-tab-${item.id.toLowerCase()}`}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${item.id.toLowerCase()}`}
              title={item.description || item.label}
              onClick={() => onTabChange(item.id)}
              className={`relative group flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1.8 rounded-xl shrink-0 transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                active
                  ? 'border border-cyan-500/50 bg-cyan-950/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                  : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800/60 font-medium'
              }`}
            >
              {/* Active Ambient Glow Pip */}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 sm:-top-1 left-1/2 -translate-x-1/2 w-3 sm:w-4 h-0.5 sm:h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                />
              )}

              {/* Icon */}
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                  active
                    ? 'text-cyan-400 scale-110 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]'
                    : 'text-slate-400 group-hover:text-cyan-300 group-hover:scale-105'
                }`}
              />

              {/* Label */}
              <span className="font-mono text-[10px] sm:text-xs tracking-wider whitespace-nowrap uppercase">
                {item.label}
              </span>

              {/* Optional Badge Indicator */}
              {item.badge !== undefined && (
                <span className="ml-0.5 px-1 py-0.2 text-[9px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
