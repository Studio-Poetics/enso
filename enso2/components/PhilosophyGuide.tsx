import React from 'react';
import { X, Wind, Circle, Eye, CheckCircle, LayoutList, Kanban } from 'lucide-react';

interface PhilosophyGuideProps {
  onClose: () => void;
}

const PhilosophyGuide: React.FC<PhilosophyGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-paper/95 dark:bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
      >
        <X size={24} />
      </button>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 p-8 md:p-12 overflow-y-auto max-h-screen custom-scrollbar">
        <div className="space-y-8 flex flex-col justify-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-sumi dark:text-paper mb-6">The Way of Enso</h2>
            <p className="font-serif italic text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              "To design is to clear away the noise so the essence can speak."
            </p>
          </div>
          <div className="text-sm font-sans text-gray-500 dark:text-gray-400 uppercase tracking-widest space-y-2 font-medium">
            <p>Inspired by Dieter Rams</p>
            <p>Kenya Hara</p>
            <p>Ikko Tanaka</p>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* States of Matter */}
          <div className="space-y-6">
            <h3 className="text-xs font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-2 font-medium">States of Matter</h3>
            
            <div className="flex gap-4 group">
              <div className="mt-1 text-gray-400 group-hover:text-sumi dark:group-hover:text-paper transition-colors"><Circle size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">Stillness <span className="text-xs font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 font-medium">(Todo)</span></h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  The empty vessel. Ideas waiting to be born. Keep this space curated.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="mt-1 text-gray-400 group-hover:text-vermilion transition-colors"><Wind size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">Flow <span className="text-xs font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 font-medium">(In Progress)</span></h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Action without friction. Upload visual assets directly to maintain momentum.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="mt-1 text-gray-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-500 transition-colors"><Eye size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">Critique <span className="text-xs font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 font-medium">(Review)</span></h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  The objective eye. Use the cinema preview to step back and see the work clearly.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="mt-1 text-gray-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-500 transition-colors"><CheckCircle size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">Harmony <span className="text-xs font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 font-medium">(Done)</span></h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Completion. The resolution of tension.
                </p>
              </div>
            </div>
          </div>

          {/* Tools of Trade */}
          <div className="space-y-6">
            <h3 className="text-xs font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-2 font-medium">Tools of the Trade</h3>
            
            <div className="flex gap-4">
              <div className="mt-1 text-sumi dark:text-paper"><LayoutList size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">The Scroll (Manuscript)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <span className="font-medium">Best for:</span> Narrative, Planning, Linear Execution.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Use this view when the project is a story unfolding. Drag steps to reorder the timeline. It helps you see the "Before" and "After".
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 text-sumi dark:text-paper"><Kanban size={20} /></div>
              <div>
                <h4 className="font-serif text-lg text-sumi dark:text-paper">The Board (Kanban)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <span className="font-medium">Best for:</span> Logistics, Teamwork, Multi-state complexity.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Use this view when tasks are independent moving parts. Drag cards between columns to visualize the bottleneck.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PhilosophyGuide;