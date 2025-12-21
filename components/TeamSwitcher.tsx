import React, { useState } from 'react';
import { Team } from '../types';
import { ChevronDown, Check, Building2 } from 'lucide-react';

interface TeamSwitcherProps {
  teams: Team[];
  activeTeam: Team;
  onSwitch: (teamId: string) => void;
}

const TeamSwitcher: React.FC<TeamSwitcherProps> = ({ teams, activeTeam, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show if only one team
  if (teams.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        aria-label="Switch team"
      >
        <Building2 size={16} className="text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-sumi dark:text-paper">
          {activeTeam.name}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-label="Close team switcher"
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 shadow-xl z-50 animate-fade-in-up">
            <div className="p-2">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                Switch Studio
              </p>
              <div className="space-y-1">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onSwitch(team.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="text-sm text-sumi dark:text-paper">
                        {team.name}
                      </span>
                    </div>
                    {team.id === activeTeam.id && (
                      <Check size={14} className="text-vermilion" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamSwitcher;
