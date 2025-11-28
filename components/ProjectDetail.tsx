import React, { useState, useRef, useEffect } from 'react';
import { Project, Task, ProjectStatus, TaskStatus, BoardItem } from '../types';
import { ArrowLeft, Sparkles, Coffee, Image as ImageIcon, Calendar, ChevronLeft, ChevronRight, X, Circle, CheckCircle, Eye, Wind, Loader, ChevronUp, ChevronDown, Lightbulb, GripVertical, Link as LinkIcon, Lock, GraduationCap, Layout, Grid, MoreHorizontal, Trash2 } from 'lucide-react';
import { getUncleIrohWisdom, suggestTasks, getTaskMentorship, MentorshipResponse } from '../services/gemini';
import MoodBoard from './MoodBoard';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
}

interface ImageViewerState {
  taskId: string;
  imageIndex: number;
}

type SubView = 'STUDIO' | 'COLLECTION';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
  const [subView, setSubView] = useState<SubView>('STUDIO');
  const [wisdom, setWisdom] = useState<string | null>(null);
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
  const [viewerState, setViewerState] = useState<ImageViewerState | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeTaskCollectionId, setActiveTaskCollectionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mentorship State
  const [mentorTask, setMentorTask] = useState<Task | null>(null);

  const askIroh = async () => {
    setIsLoadingWisdom(true);
    const advice = await getUncleIrohWisdom(project);
    setWisdom(advice);
    setIsLoadingWisdom(false);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const generateTasks = async () => {
     const taskStrings = await suggestTasks(project.essence);
     const newTasks: Task[] = taskStrings.map((t, i) => ({
        id: Date.now().toString() + i,
        text: t,
        status: 'todo',
        images: [],
        deadline: '',
        dependencies: [],
        boardItems: []
     }));
     onUpdateProject({ ...project, tasks: [...project.tasks, ...newTasks] });
  };

  const addTask = (text: string, status: TaskStatus) => {
    if (!text.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      status,
      images: [],
      dependencies: [],
      boardItems: []
    };
    onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
  };

  const addSubTasks = (parentTaskId: string, newTexts: string[]) => {
    const parentIndex = project.tasks.findIndex(t => t.id === parentTaskId);
    if (parentIndex === -1) return;

    const newTasks: Task[] = newTexts.map((text, i) => ({
      id: Date.now().toString() + i + Math.random(),
      text: text,
      status: 'todo',
      images: [],
      dependencies: [],
      boardItems: []
    }));
    
    // Insert new tasks directly after the parent
    const updatedTasks = [...project.tasks];
    updatedTasks.splice(parentIndex + 1, 0, ...newTasks);
    
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm("Delete this step?")) {
        const updatedTasks = project.tasks.filter(t => t.id !== taskId);
        onUpdateProject({ ...project, tasks: updatedTasks });
    }
  };

  // --- Drag and Drop Logic ---
  
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropTask = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const draggedIndex = project.tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = project.tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...project.tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    
    if (project.layout === 'kanban') {
       const targetTask = project.tasks[targetIndex];
       if (removed.status !== targetTask.status) {
         removed.status = targetTask.status;
       }
    }

    newTasks.splice(targetIndex, 0, removed);
    onUpdateProject({ ...project, tasks: newTasks });
    setDraggedTaskId(null);
  };

  const handleDropColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = project.tasks.find(t => t.id === draggedTaskId);
    if (task && task.status !== status) {
      updateTask(task.id, { status });
    }
    setDraggedTaskId(null);
  };


  // --- Viewer Logic ---
  const viewerTask = viewerState ? project.tasks.find(t => t.id === viewerState.taskId) : null;
  const viewerImage = viewerTask ? viewerTask.images[viewerState!.imageIndex] : null;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewerTask || !viewerState) return;
    const nextIndex = (viewerState.imageIndex + 1) % viewerTask.images.length;
    setViewerState({ ...viewerState, imageIndex: nextIndex });
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewerTask || !viewerState) return;
    const prevIndex = (viewerState.imageIndex - 1 + viewerTask.images.length) % viewerTask.images.length;
    setViewerState({ ...viewerState, imageIndex: prevIndex });
  };

  // --- Render Content ---
  const renderContent = () => {
    if (activeTaskCollectionId) {
      const task = project.tasks.find(t => t.id === activeTaskCollectionId);
      if (!task) {
        setActiveTaskCollectionId(null);
        return null;
      }
      return (
        <MoodBoard 
          items={task.boardItems || []} 
          onUpdateItems={(items) => updateTask(task.id, { boardItems: items })}
          title={task.text}
          subtitle="Task Collection"
          onBack={() => setActiveTaskCollectionId(null)}
        />
      );
    }

    if (subView === 'COLLECTION') {
      return (
        <MoodBoard 
          items={project.boardItems} 
          onUpdateItems={(items) => onUpdateProject({ ...project, boardItems: items })}
        />
      );
    }

    if (project.layout === 'kanban') {
      return (
        <KanbanBoard 
          project={project}
          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
          generateTasks={generateTasks}
          setViewerState={setViewerState}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDropTask={handleDropTask}
          onDropColumn={handleDropColumn}
          draggedTaskId={draggedTaskId}
          onOpenMentor={setMentorTask}
          onOpenCollection={setActiveTaskCollectionId}
        />
      );
    }

    return (
      <ManuscriptView 
        project={project}
        addTask={addTask}
        updateTask={updateTask}
        deleteTask={deleteTask}
        generateTasks={generateTasks}
        setViewerState={setViewerState}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDropTask={handleDropTask}
        onOpenMentor={setMentorTask}
        onOpenCollection={setActiveTaskCollectionId}
      />
    );
  };

  return (
    <div className="w-full h-screen flex flex-col bg-paper dark:bg-sumi overflow-hidden animate-fade-in relative transition-colors duration-300">
      
      {/* Mentorship Modal */}
      {mentorTask && (
        <MentorshipModal 
          task={mentorTask}
          essence={project.essence}
          onClose={() => setMentorTask(null)}
          onAddSteps={(steps) => {
            addSubTasks(mentorTask.id, steps);
            setMentorTask(null);
          }}
        />
      )}

      {/* Cinema Lightbox */}
      {viewerState && viewerTask && viewerImage && (
        <div 
          className="fixed inset-0 bg-sumi/95 dark:bg-black/95 z-[60] flex flex-col items-center justify-center p-8 backdrop-blur-md animate-fade-in select-none"
          onClick={() => setViewerState(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
             <img 
               src={viewerImage} 
               alt="Asset Preview" 
               className="max-h-[80vh] max-w-full object-contain shadow-2xl" 
               onClick={(e) => e.stopPropagation()} 
             />
             
             {/* Navigation */}
             {viewerTask.images.length > 1 && (
               <>
                 <button onClick={prevImage} className="absolute left-0 p-4 text-white/30 hover:text-white transition-colors hover:scale-110">
                   <ChevronLeft size={48} strokeWidth={1} />
                 </button>
                 <button onClick={nextImage} className="absolute right-0 p-4 text-white/30 hover:text-white transition-colors hover:scale-110">
                   <ChevronRight size={48} strokeWidth={1} />
                 </button>
               </>
             )}
          </div>

          <div className="absolute bottom-8 text-center space-y-2 pointer-events-none">
             <p className="text-white font-serif text-xl tracking-wide">{viewerTask.text}</p>
             <p className="text-white/70 text-xs uppercase tracking-widest font-sans font-medium">
               {viewerState.imageIndex + 1} of {viewerTask.images.length} • {project.title}
             </p>
          </div>

          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={32} strokeWidth={1} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex-none px-4 md:px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-paper dark:bg-sumi z-10 transition-colors duration-300">
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between max-w-xl">
             <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors group mb-2"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="uppercase tracking-widest text-xs font-medium">Back to Studio</span>
              </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-8">
            <h1 className="text-2xl md:text-3xl font-serif text-sumi dark:text-paper">{project.title}</h1>
            
            {/* Sub-View Switcher (Project Level) */}
            <div className="flex items-center gap-4 mb-1">
              <button 
                onClick={() => {
                  setSubView('STUDIO');
                  setActiveTaskCollectionId(null);
                }}
                className={`text-xs uppercase tracking-widest font-medium pb-1 transition-colors border-b-2 ${subView === 'STUDIO' && !activeTaskCollectionId ? 'text-sumi dark:text-paper border-vermilion' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-sumi dark:hover:text-paper'}`}
              >
                Studio
              </button>
              <button 
                onClick={() => {
                  setSubView('COLLECTION');
                  setActiveTaskCollectionId(null);
                }}
                className={`text-xs uppercase tracking-widest font-medium pb-1 transition-colors border-b-2 ${subView === 'COLLECTION' && !activeTaskCollectionId ? 'text-sumi dark:text-paper border-vermilion' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-sumi dark:hover:text-paper'}`}
              >
                Collection
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-col items-end gap-2">
          <button 
             onClick={askIroh}
             disabled={isLoadingWisdom}
             className="text-xs font-medium flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
          >
             <Coffee size={14} />
             <span>Tea with Uncle Iroh</span>
          </button>
          {wisdom && (
             <div className="absolute top-20 right-8 w-72 bg-sumi dark:bg-neutral-800 text-white dark:text-paper p-6 text-sm font-serif leading-relaxed shadow-xl z-50 animate-fade-in-up border-l-2 border-vermilion">
               "{wisdom}"
               <button onClick={() => setWisdom(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={12}/></button>
             </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden relative">
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-sumi dark:text-paper">
              <MoreHorizontal size={24} />
           </button>
           {isMobileMenuOpen && (
             <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 rounded-sm">
                <button 
                  onClick={askIroh}
                  className="w-full text-left px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                >
                  <Coffee size={14} />
                  Tea with Iroh
                </button>
             </div>
           )}
           {wisdom && isMobileMenuOpen && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setWisdom(null)}>
               <div className="bg-sumi dark:bg-neutral-800 text-white dark:text-paper p-6 max-w-sm w-full relative">
                 <p className="font-serif italic">"{wisdom}"</p>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

// --- Mentorship Component ---

const MentorshipModal: React.FC<{
  task: Task;
  essence: string;
  onClose: () => void;
  onAddSteps: (steps: string[]) => void;
}> = ({ task, essence, onClose, onAddSteps }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MentorshipResponse | null>(null);

  useEffect(() => {
    const fetchGuidance = async () => {
      const result = await getTaskMentorship(task.text, essence);
      setData(result);
      setLoading(false);
    };
    fetchGuidance();
  }, [task, essence]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-sumi/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-paper dark:bg-neutral-900 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-up flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-paper dark:bg-neutral-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3 text-sumi dark:text-paper">
             <GraduationCap size={20} />
             <h3 className="font-serif text-lg">Mentor's Guidance</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper"><X size={20}/></button>
        </div>
        
        <div className="p-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-8 gap-4 text-gray-500 dark:text-gray-400">
               <Loader size={24} className="animate-spin text-vermilion" />
               <p className="text-xs uppercase tracking-widest font-medium">Consulting Senior Designers...</p>
             </div>
           ) : data ? (
             <div className="space-y-8">
               <div>
                 <h4 className="text-xs font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-3">Strategic Advice</h4>
                 <p className="font-serif text-lg leading-relaxed text-sumi dark:text-paper italic">
                   "{data.advice}"
                 </p>
               </div>
               
               <div>
                 <h4 className="text-xs font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-3">Recommended Path</h4>
                 <ul className="space-y-3">
                   {data.steps.map((step, i) => (
                     <li key={i} className="flex gap-3 items-start text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 p-3 border border-gray-100 dark:border-gray-700">
                       <span className="text-vermilion font-mono font-medium">0{i+1}</span>
                       <span>{step}</span>
                     </li>
                   ))}
                 </ul>
               </div>

               <button 
                 onClick={() => onAddSteps(data.steps)}
                 className="w-full py-3 bg-sumi dark:bg-paper text-white dark:text-sumi hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors text-sm uppercase tracking-widest font-medium flex items-center justify-center gap-2"
               >
                 <Sparkles size={14} />
                 <span>Add Steps to Plan</span>
               </button>
             </div>
           ) : (
             <p className="text-center text-red-500">Failed to retrieve guidance.</p>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Helpers ---

const getDependencyStatus = (task: Task, allTasks: Task[]) => {
  if (!task.dependencies || task.dependencies.length === 0) return 'clear';
  const blockers = allTasks.filter(t => task.dependencies.includes(t.id) && t.status !== 'done');
  if (blockers.length > 0) return 'blocked';
  return 'clear';
};

const TaskDependencySelect: React.FC<{
  task: Task;
  allTasks: Task[];
  onToggle: (depId: string) => void;
  onClose: () => void;
}> = ({ task, allTasks, onToggle, onClose }) => {
  const available = allTasks.filter(t => t.id !== task.id);

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-800 shadow-xl border border-gray-100 dark:border-gray-700 z-50 p-2 animate-fade-in-up">
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
         <span className="text-xs font-sans uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Depends on...</span>
         <button onClick={onClose}><X size={12} className="text-gray-400 hover:text-sumi dark:hover:text-paper"/></button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
        {available.length === 0 && <div className="text-xs text-gray-400 italic p-2">No other tasks available.</div>}
        {available.map(t => (
          <button 
            key={t.id}
            onClick={() => onToggle(t.id)}
            className={`w-full text-left text-xs p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center gap-2 ${task.dependencies.includes(t.id) ? 'text-sumi dark:text-paper font-medium' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <div className={`w-2 h-2 rounded-full ${task.dependencies.includes(t.id) ? 'bg-vermilion' : 'bg-gray-200 dark:bg-gray-600'}`} />
            <span className="truncate">{t.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


// --- Manuscript View Components ---

interface ManuscriptViewProps {
  project: Project;
  addTask: (text: string, status: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  generateTasks: () => void;
  setViewerState: (state: ImageViewerState) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, targetId: string) => void;
  onOpenMentor: (task: Task) => void;
  onOpenCollection: (taskId: string) => void;
}

const ManuscriptView: React.FC<ManuscriptViewProps> = ({ project, addTask, updateTask, deleteTask, generateTasks, setViewerState, onDragStart, onDragOver, onDropTask, onOpenMentor, onOpenCollection }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const cycleStatus = (task: Task) => {
    const statusState = getDependencyStatus(task, project.tasks);
    if (statusState === 'blocked') {
      alert("This task is waiting for dependencies to complete.");
      return; 
    }
    const flow: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = flow.indexOf(task.status);
    const newIndex = (currentIndex + 1) % flow.length;
    updateTask(task.id, { status: flow[newIndex] });
  };

  const getStatusIcon = (status: TaskStatus, isBlocked: boolean) => {
    if (isBlocked) return <Lock size={20} className="text-gray-400 dark:text-gray-600" />;
    switch(status) {
      case 'todo': return <Circle size={20} className="text-gray-500 dark:text-gray-400" />; 
      case 'in-progress': return <Wind size={20} className="text-vermilion animate-pulse" />;
      case 'review': return <Eye size={20} className="text-yellow-700 dark:text-yellow-500" />;
      case 'done': return <CheckCircle size={20} className="text-emerald-800 dark:text-emerald-500" />;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-paper dark:bg-sumi custom-scrollbar transition-colors duration-300">
      <div className="max-w-3xl mx-auto py-16 px-4 md:px-8 min-h-full">
        
        {/* Project Essence Header */}
        <div className="mb-16 border-l-2 border-vermilion pl-6 py-2">
           <h3 className="text-xs font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-2">Essence</h3>
           <p className="font-serif text-xl md:text-2xl text-sumi dark:text-paper italic leading-relaxed">
             "{project.essence}"
           </p>
        </div>

        {/* Tasks List */}
        <div className="space-y-6">
           {project.tasks.map((task, index) => (
             <ManuscriptRow 
               key={task.id} 
               task={task} 
               index={index}
               allTasks={project.tasks}
               essence={project.essence}
               cycleStatus={() => cycleStatus(task)} 
               getStatusIcon={getStatusIcon}
               updateTask={updateTask}
               deleteTask={deleteTask}
               setViewerState={setViewerState}
               onDragStart={onDragStart}
               onDragOver={onDragOver}
               onDropTask={onDropTask}
               onOpenMentor={onOpenMentor}
               onOpenCollection={onOpenCollection}
             />
           ))}

           {/* Add New Task */}
           <div className="flex items-center gap-6 group py-4 opacity-60 hover:opacity-100 transition-opacity pl-8">
              <div className="w-5 flex justify-center text-gray-400 dark:text-gray-600"><Circle size={20} /></div>
              <input 
                type="text"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addTask(newTaskText, 'todo');
                    setNewTaskText('');
                  }
                }}
                placeholder="Add a new step..."
                className="flex-1 bg-transparent border-none outline-none font-sans text-lg text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-600"
              />
           </div>
        </div>

        {project.tasks.length === 0 && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={generateTasks}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors border border-dashed border-gray-400 dark:border-gray-600 px-6 py-4 rounded-sm"
            >
              <Sparkles size={16} />
              <span className="text-xs uppercase tracking-widest font-medium">Suggest Initial Steps</span>
            </button>
          </div>
        )}
        
        <div className="mt-32 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-400 dark:text-gray-600 font-serif italic text-sm">
          End of scroll
        </div>
      </div>
    </div>
  );
};

const ManuscriptRow: React.FC<{
  task: Task;
  index: number;
  allTasks: Task[];
  essence: string;
  cycleStatus: () => void;
  getStatusIcon: (s: TaskStatus, b: boolean) => React.ReactNode;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setViewerState: (state: ImageViewerState) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, id: string) => void;
  onOpenMentor: (task: Task) => void;
  onOpenCollection: (taskId: string) => void;
}> = ({ task, index, allTasks, essence, cycleStatus, getStatusIcon, updateTask, deleteTask, setViewerState, onDragStart, onDragOver, onDropTask, onOpenMentor, onOpenCollection }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDepSelect, setShowDepSelect] = useState(false);
  
  const isBlocked = getDependencyStatus(task, allTasks) === 'blocked';
  const blockers = allTasks.filter(t => task.dependencies.includes(t.id) && t.status !== 'done');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateTask(task.id, { images: [...task.images, base64] });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDependency = (depId: string) => {
    const newDeps = task.dependencies.includes(depId)
      ? task.dependencies.filter(d => d !== depId)
      : [...task.dependencies, depId];
    updateTask(task.id, { dependencies: newDeps });
  };

  return (
    <div 
      className={`group transition-all duration-500 relative pl-4 md:pl-8 py-2 border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 ${task.status === 'done' ? 'opacity-50' : 'opacity-100'} ${isBlocked ? 'opacity-75 grayscale' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDropTask(e, task.id)}
    >
      
      {/* Drag Handle */}
      <div 
        className="hidden md:block absolute left-0 top-4 text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      <div className="flex items-start gap-4 md:gap-6">
        {/* Status Indicator (Clickable) */}
        <button 
          onClick={cycleStatus}
          className="mt-1 hover:scale-110 transition-transform flex-shrink-0"
          title={isBlocked ? "Waiting for dependencies" : `Current Status: ${task.status}`}
        >
          {getStatusIcon(task.status, isBlocked)}
        </button>

        <div className="flex-1 space-y-3">
          {/* Text & Meta */}
          <div className="flex flex-col gap-1">
             <div className="flex justify-between items-baseline">
                <span className={`font-sans text-lg text-sumi dark:text-paper ${task.status === 'done' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                  {task.text}
                </span>

                <div className="flex items-center gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                  
                  {/* Task Collection (Moodboard) Trigger */}
                  <button
                    onClick={() => onOpenCollection(task.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
                    title="Open Task Collection"
                  >
                    <Grid size={16} />
                  </button>

                  {/* Dependency Trigger */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowDepSelect(!showDepSelect)}
                      className={`flex items-center gap-1 transition-colors ${task.dependencies.length > 0 ? 'text-sumi dark:text-paper' : 'text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper'}`}
                      title="Manage Dependencies"
                    >
                      <LinkIcon size={16} />
                      {task.dependencies.length > 0 && <span className="text-xs font-mono font-medium">{task.dependencies.length}</span>}
                    </button>
                    {showDepSelect && (
                      <TaskDependencySelect 
                        task={task} 
                        allTasks={allTasks} 
                        onToggle={toggleDependency} 
                        onClose={() => setShowDepSelect(false)} 
                      />
                    )}
                  </div>

                  {/* Mentorship */}
                  <button
                    onClick={() => onOpenMentor(task)}
                    className="text-gray-500 dark:text-gray-400 hover:text-vermilion dark:hover:text-vermilion transition-colors"
                    title="Ask Mentor"
                  >
                    <Sparkles size={16} />
                  </button>

                  {/* Deadline */}
                  <div className="relative">
                      <input 
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        onChange={(e) => updateTask(task.id, { deadline: e.target.value })}
                      />
                      <div className={`flex items-center gap-1 text-xs uppercase tracking-wider font-medium ${task.deadline ? 'text-vermilion' : 'text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper'}`}>
                        <Calendar size={16} />
                        <span>{task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : ''}</span>
                      </div>
                  </div>

                  {/* Upload */}
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
                  >
                      <ImageIcon size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />

                  {/* Delete */}
                  <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-vermilion transition-colors ml-2"
                      title="Delete Step"
                  >
                      <Trash2 size={16} />
                  </button>
                </div>
             </div>

             {/* Dependency Warning Text */}
             {isBlocked && (
               <div className="text-xs text-vermilion italic font-serif">
                 Waiting for: {blockers.map(b => b.text).join(', ')}
               </div>
             )}
          </div>

          {/* Inline Images */}
          {task.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {task.images.map((img, idx) => (
                <div key={idx} className="relative aspect-video bg-gray-50 dark:bg-neutral-800 cursor-zoom-in group/image overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={img} 
                    alt="work in progress" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    onClick={() => setViewerState({ taskId: task.id, imageIndex: idx })}
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newImages = task.images.filter((_, i) => i !== idx);
                      updateTask(task.id, { images: newImages });
                    }}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 p-1 opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-vermilion hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// --- Kanban View Components ---

interface KanbanBoardProps {
  project: Project;
  addTask: (text: string, status: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  generateTasks?: () => void;
  setViewerState: (state: ImageViewerState) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, targetId: string) => void;
  onDropColumn: (e: React.DragEvent, status: TaskStatus) => void;
  onOpenMentor: (task: Task) => void;
  onOpenCollection: (taskId: string) => void;
  draggedTaskId: string | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, addTask, updateTask, deleteTask, generateTasks, setViewerState, onDragStart, onDragOver, onDropTask, onDropColumn, draggedTaskId, onOpenMentor, onOpenCollection }) => {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-8 snap-x snap-mandatory bg-paper dark:bg-sumi transition-colors duration-300">
        <div className="h-full flex gap-4 md:gap-8 min-w-max">
          {(['todo', 'in-progress', 'review', 'done'] as TaskStatus[]).map(status => (
            <Column 
              key={status}
              title={status === 'todo' ? 'Stillness' : status === 'in-progress' ? 'Flow' : status === 'review' ? 'Critique' : 'Harmony'} 
              status={status} 
              allTasks={project.tasks}
              tasks={project.tasks.filter(t => t.status === status)}
              onAddTask={(text) => addTask(text, status)}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onGenerateTasks={status === 'todo' && project.tasks.length === 0 ? generateTasks : undefined}
              setViewerState={setViewerState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDropTask={onDropTask}
              onDropColumn={onDropColumn}
              draggedTaskId={draggedTaskId}
              onOpenMentor={onOpenMentor}
              onOpenCollection={onOpenCollection}
            />
          ))}
        </div>
      </div>
  )
}

interface ColumnProps {
  title: string;
  status: TaskStatus;
  allTasks: Task[];
  tasks: Task[];
  onAddTask: (text: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onGenerateTasks?: () => void;
  setViewerState: (state: ImageViewerState) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, targetId: string) => void;
  onDropColumn: (e: React.DragEvent, status: TaskStatus) => void;
  onOpenMentor: (task: Task) => void;
  onOpenCollection: (taskId: string) => void;
  draggedTaskId: string | null;
}

const Column: React.FC<ColumnProps> = ({ title, status, allTasks, tasks, onAddTask, onUpdateTask, onDeleteTask, onGenerateTasks, setViewerState, onDragStart, onDragOver, onDropTask, onDropColumn, draggedTaskId, onOpenMentor, onOpenCollection }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`w-80 h-full flex flex-col transition-colors duration-300 snap-center ${isDragOver ? 'bg-gray-50 dark:bg-neutral-800/30' : ''}`}
      onDragOver={(e) => {
        onDragOver(e);
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDropColumn(e, status);
      }}
    >
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-serif text-lg text-sumi dark:text-paper">{title}</h3>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-600">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-12 custom-scrollbar">
        {onGenerateTasks && (
          <button 
            onClick={onGenerateTasks}
            className="w-full py-4 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-vermilion hover:border-vermilion transition-colors flex flex-col items-center gap-2 mb-4"
          >
            <Sparkles size={16} />
            <span className="text-xs uppercase tracking-widest font-medium">Suggest Workflow</span>
          </button>
        )}

        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            allTasks={allTasks}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            setViewerState={setViewerState}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDropTask={onDropTask}
            isDragging={draggedTaskId === task.id}
            onOpenMentor={onOpenMentor}
            onOpenCollection={onOpenCollection}
          />
        ))}

        <div className="relative mt-2">
          <input 
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onAddTask(newTaskText);
                setNewTaskText('');
              }
            }}
            placeholder="+ Add task"
            className="w-full bg-transparent border-none outline-none font-sans text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-600 py-2 focus:placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  setViewerState: (state: ImageViewerState) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, targetId: string) => void;
  isDragging: boolean;
  onOpenMentor: (task: Task) => void;
  onOpenCollection: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, allTasks, onUpdate, onDelete, setViewerState, onDragStart, onDragOver, onDropTask, isDragging, onOpenMentor, onOpenCollection }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDepSelect, setShowDepSelect] = useState(false);
  const isBlocked = getDependencyStatus(task, allTasks) === 'blocked';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdate(task.id, { images: [...task.images, base64] });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDependency = (depId: string) => {
    const newDeps = task.dependencies.includes(depId)
      ? task.dependencies.filter(d => d !== depId)
      : [...task.dependencies, depId];
    onUpdate(task.id, { dependencies: newDeps });
  };

  const handleMobileMove = (newStatus: TaskStatus) => {
    onUpdate(task.id, { status: newStatus });
  };

  return (
    <div 
      className={`group bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 flex flex-col gap-3 relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.stopPropagation(); // Stop bubbling to column
        onDropTask(e, task.id);
      }}
    >
      
      {/* Dependency Indicator */}
      {isBlocked && (
         <div className="absolute top-2 right-2 text-vermilion" title="Blocked by dependency">
            <Lock size={12} />
         </div>
      )}

      {/* Task Text */}
      <div className={`font-sans font-light text-sumi dark:text-gray-100 text-sm leading-relaxed ${isBlocked ? 'text-gray-400 dark:text-gray-600' : ''}`}>
        {task.text}
      </div>

      {/* Image Grid */}
      {task.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {task.images.map((img, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-neutral-900 group/image cursor-zoom-in">
              <img 
                src={img} 
                alt="asset" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" 
                onClick={() => setViewerState({ taskId: task.id, imageIndex: idx })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Meta & Controls (Hover) */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          
          {/* Task Collection (Moodboard) Trigger */}
          <button
             onClick={() => onOpenCollection(task.id)}
             className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
             title="Open Task Collection"
          >
             <Grid size={14} />
          </button>

          {/* Dependency Trigger */}
          <div className="relative">
             <button 
                onClick={() => setShowDepSelect(!showDepSelect)}
                className={`text-[10px] flex items-center gap-1 ${task.dependencies.length > 0 ? 'text-sumi dark:text-paper' : 'text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper'}`}
                title="Dependencies"
             >
                <LinkIcon size={14} />
                {task.dependencies.length > 0 && <span className="font-medium text-xs">{task.dependencies.length}</span>}
             </button>
             {showDepSelect && (
                <TaskDependencySelect 
                  task={task} 
                  allTasks={allTasks} 
                  onToggle={toggleDependency} 
                  onClose={() => setShowDepSelect(false)} 
                />
             )}
          </div>

          {/* Mentorship Trigger */}
          <button
             onClick={() => onOpenMentor(task)}
             className="text-gray-500 dark:text-gray-400 hover:text-vermilion dark:hover:text-vermilion transition-colors"
             title="Ask Mentor"
          >
             <Sparkles size={14} />
          </button>

          {/* Deadline */}
          <div className="relative group/date">
             <input 
               type="date"
               className="absolute inset-0 opacity-0 cursor-pointer w-6"
               onChange={(e) => onUpdate(task.id, { deadline: e.target.value })}
             />
             <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium ${task.deadline ? 'text-vermilion' : 'text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper'}`}>
                <Calendar size={14} />
                {task.deadline && <span className="text-xs">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>}
             </div>
          </div>

          {/* Image Upload */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
            title="Attach visual asset"
          >
            <ImageIcon size={14} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />

           {/* Delete */}
           <button 
              onClick={() => onDelete(task.id)}
              className="text-gray-500 dark:text-gray-400 hover:text-vermilion dark:hover:text-vermilion transition-colors"
              title="Delete"
           >
              <Trash2 size={14} />
           </button>

          {/* Mobile Move Dropdown */}
          <div className="md:hidden relative group/move">
             <MoreHorizontal size={14} className="text-gray-400" />
             <div className="absolute top-full right-0 bg-white dark:bg-neutral-800 shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover/move:block z-50 min-w-[120px]">
               {['todo', 'in-progress', 'review', 'done'].map((s) => (
                 <button 
                   key={s} 
                   onClick={() => handleMobileMove(s as TaskStatus)}
                   className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 capitalize"
                 >
                   Move to {s}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;