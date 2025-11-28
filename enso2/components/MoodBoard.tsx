
import React, { useState, useRef } from 'react';
import { BoardItem } from '../types';
import { Plus, Image as ImageIcon, Type, Link as LinkIcon, Mic, Square, Trash2, ExternalLink, Play, Pause, ArrowLeft } from 'lucide-react';
import { processFile, MEDIA_CONFIG } from '../services/media';

interface MoodBoardProps {
  items: BoardItem[];
  onUpdateItems: (items: BoardItem[]) => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const MoodBoard: React.FC<MoodBoardProps> = ({ items, onUpdateItems, title, subtitle, onBack }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = (item: BoardItem) => {
    onUpdateItems([item, ...items]);
    setIsMenuOpen(false);
  };

  const deleteItem = (id: string) => {
    onUpdateItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BoardItem>) => {
    onUpdateItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processedContent = await processFile(file);
        addItem({
          id: Date.now().toString(),
          type: 'image',
          content: processedContent,
          marginalia: '',
          createdAt: Date.now()
        });
      } catch (err) {
        console.error("File processing failed", err);
        alert("Could not process file.");
      }
    }
  };

  const handleAddText = () => {
    addItem({
      id: Date.now().toString(),
      type: 'text',
      content: '',
      marginalia: '',
      createdAt: Date.now()
    });
  };

  const handleAddLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
       addItem({
        id: Date.now().toString(),
        type: 'link',
        content: url,
        meta: new URL(url).hostname,
        marginalia: '',
        createdAt: Date.now()
      });
    }
  };

  return (
    <div className="w-full h-full bg-paper dark:bg-sumi p-8 overflow-y-auto custom-scrollbar relative transition-colors duration-300">
      
      {/* Header for Task Context */}
      {(title || onBack) && (
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
           {onBack && (
             <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper">
               <ArrowLeft size={20} />
             </button>
           )}
           <div>
             {title && <h2 className="text-xl font-serif text-sumi dark:text-paper">{title}</h2>}
             {subtitle && <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">{subtitle}</p>}
           </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-12 right-12 z-40 flex flex-col items-end gap-4">
        {isMenuOpen && (
          <div className="flex flex-col gap-3 mb-2 animate-fade-in-up">
            <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-neutral-800 text-sumi dark:text-paper p-3 rounded-full shadow-lg hover:bg-vermilion hover:text-white dark:hover:bg-vermilion dark:hover:text-white transition-colors tooltip" title="Image">
              <ImageIcon size={20} />
            </button>
            <button onClick={handleAddText} className="bg-white dark:bg-neutral-800 text-sumi dark:text-paper p-3 rounded-full shadow-lg hover:bg-vermilion hover:text-white dark:hover:bg-vermilion dark:hover:text-white transition-colors tooltip" title="Note">
              <Type size={20} />
            </button>
            <button onClick={handleAddLink} className="bg-white dark:bg-neutral-800 text-sumi dark:text-paper p-3 rounded-full shadow-lg hover:bg-vermilion hover:text-white dark:hover:bg-vermilion dark:hover:text-white transition-colors tooltip" title="Link">
              <LinkIcon size={20} />
            </button>
            <AudioRecorder onRecord={(blobUrl) => addItem({
               id: Date.now().toString(),
               type: 'audio',
               content: blobUrl,
               marginalia: '',
               createdAt: Date.now()
            })} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        )}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${isMenuOpen ? 'bg-vermilion rotate-45 text-white' : 'bg-sumi dark:bg-paper text-white dark:text-sumi hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white'}`}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 pointer-events-none">
          <div className="text-center">
            <h3 className="font-serif text-2xl mb-2 italic">Tabula Rasa</h3>
            <p className="font-sans text-sm tracking-widest uppercase">The collection is empty.</p>
          </div>
        </div>
      )}

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 pb-32 max-w-7xl mx-auto">
        {items.map(item => (
          <div key={item.id} className="break-inside-avoid group relative animate-fade-in-up">
            
            {/* Main Content Block */}
            <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-shadow hover:shadow-md p-4">
               {/* Delete Button */}
               <button 
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-2"
               >
                 <Trash2 size={16} />
               </button>

               {item.type === 'image' && (
                 <img src={item.content} alt="Mood board asset" className="w-full h-auto object-cover" />
               )}

               {item.type === 'text' && (
                 <textarea 
                   value={item.content}
                   onChange={(e) => updateItem(item.id, { content: e.target.value })}
                   placeholder="Write a thought..."
                   className="w-full min-h-[120px] bg-transparent border-none outline-none font-serif text-lg leading-relaxed text-sumi dark:text-paper resize-none placeholder-gray-300 dark:placeholder-gray-600"
                 />
               )}

               {item.type === 'link' && (
                 <a href={item.content} target="_blank" rel="noopener noreferrer" className="block group/link">
                    <div className="flex items-start justify-between mb-4">
                       <div className="p-3 bg-gray-50 dark:bg-neutral-700 rounded-full text-gray-400 dark:text-gray-500 group-hover/link:bg-gray-100 dark:group-hover/link:bg-neutral-600 group-hover/link:text-sumi dark:group-hover/link:text-paper transition-colors">
                         <LinkIcon size={20} />
                       </div>
                       <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 group-hover/link:text-vermilion" />
                    </div>
                    <p className="font-sans font-medium text-sumi dark:text-paper break-words line-clamp-2">{item.content}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">{item.meta || 'External Link'}</p>
                 </a>
               )}

               {item.type === 'audio' && (
                  <AudioPlayer src={item.content} />
               )}
            </div>

            {/* Marginalia (Handwriting) */}
            <div className="mt-3 ml-2 relative pl-4 border-l border-gray-300/50 dark:border-gray-600/50">
               <textarea 
                  value={item.marginalia}
                  onChange={(e) => updateItem(item.id, { marginalia: e.target.value })}
                  placeholder="jot something down..."
                  className="w-full bg-transparent border-none outline-none font-hand text-xl text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-700 resize-none overflow-hidden"
                  style={{ minHeight: '1.5em', height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
               />
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

// --- Sub Components ---

const AudioRecorder: React.FC<{ onRecord: (blobUrl: string) => void }> = ({ onRecord }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Optimize options for speech to save space (32kbps)
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: MEDIA_CONFIG.AUDIO_BITRATE, 
        mimeType: 'audio/webm;codecs=opus'
      };

      // Fallback if specific codec is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
         delete options.mimeType;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        onRecord(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button 
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-3 rounded-full shadow-lg transition-colors tooltip ${isRecording ? 'bg-vermilion text-white animate-pulse' : 'bg-white dark:bg-neutral-800 text-sumi dark:text-paper hover:bg-vermilion hover:text-white dark:hover:bg-vermilion dark:hover:text-white'}`}
      title={isRecording ? "Stop Recording" : "Voice Note"}
    >
      {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
    </button>
  );
};

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4 py-2">
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => setIsPlaying(false)}
        className="hidden" 
      />
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-sumi dark:text-paper hover:bg-sumi hover:text-white dark:hover:bg-paper dark:hover:text-sumi transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-1" />}
      </button>
      <div className="flex-1 h-8 flex items-center">
         {/* Visual waveform placeholder */}
         <div className="w-full h-1 bg-gray-100 dark:bg-neutral-700 flex items-center justify-between gap-[2px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-full bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                style={{ height: Math.max(20, Math.random() * 100) + '%' }}
              />
            ))}
         </div>
      </div>
    </div>
  );
};

export default MoodBoard;
