/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Search, 
  FileText, 
  Download, 
  MessageSquare, 
  Camera, 
  Mic, 
  ArrowLeft, 
  Save, 
  History,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { generateNotes, solveDoubt, solveHomework } from './services/ai';

type View = 'home' | 'notes' | 'doubt' | 'saved';

interface SavedNote {
  id: string;
  title: string;
  subject: string;
  className: string;
  content: string;
  date: string;
}

const CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

const SUBJECTS = [
  'Science', 'Mathematics', 'History', 'Geography', 'English', 'Civics', 'Computer', 'Hindi', 'Sanskrit', 'Economics'
];

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [chapter, setChapter] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
  const [doubtText, setDoubtText] = useState('');
  const [doubtResponse, setDoubtResponse] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'doubt'>('notes');

  const notesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('smart_ai_notes');
    if (saved) setSavedNotes(JSON.parse(saved));
  }, []);

  const handleGenerateNotes = async () => {
    if (!chapter) return;
    setLoading(true);
    try {
      const notes = await generateNotes(selectedClass, selectedSubject, chapter);
      setGeneratedNotes(notes || '');
      setView('notes');
      setActiveTab('notes');
    } catch (error) {
      console.error(error);
      alert('Failed to generate notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolveDoubt = async (isHomework = false) => {
    if (!doubtText && !imagePreview) return;
    setLoading(true);
    try {
      let response;
      if (isHomework && imagePreview) {
        response = await solveHomework(selectedClass, selectedSubject, imagePreview);
      } else {
        response = await solveDoubt(selectedClass, selectedSubject, doubtText, imagePreview || undefined);
      }
      setDoubtResponse(response || '');
    } catch (error) {
      console.error(error);
      alert('Failed to solve doubt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = () => {
    if (!generatedNotes || !chapter) return;
    const newNote: SavedNote = {
      id: Date.now().toString(),
      title: chapter,
      subject: selectedSubject,
      className: selectedClass,
      content: generatedNotes,
      date: new Date().toLocaleDateString()
    };
    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('smart_ai_notes', JSON.stringify(updated));
    alert('Note saved successfully!');
  };

  const handleDeleteNote = (id: string) => {
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem('smart_ai_notes', JSON.stringify(updated));
  };

  const downloadPDF = async () => {
    if (!notesRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(notesRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${chapter || 'Notes'}_SmartAI.pdf`);
    } catch (error) {
      console.error(error);
      alert('Failed to download PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Smart AI</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Notes Maker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('saved')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Saved Notes"
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setView('doubt')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Ask Doubt"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 py-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">What are we studying today?</h2>
                <p className="text-slate-500">Generate high-quality notes in seconds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" />
                    Select Class
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CLASSES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={cn(
                          "py-2 px-1 text-sm rounded-lg border transition-all",
                          selectedClass === c 
                            ? "bg-primary text-white border-primary shadow-md" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-primary/50"
                        )}
                      >
                        {c.replace('Class ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" />
                    Select Subject
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBJECTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSubject(s)}
                        className={cn(
                          "py-2 px-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between",
                          selectedSubject === s 
                            ? "bg-primary text-white border-primary shadow-md" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-primary/50"
                        )}
                      >
                        {s}
                        {selectedSubject === s && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chapter Input */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  Chapter Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Photosynthesis, Quadratic Equations..."
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={24} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateNotes}
                disabled={loading || !chapter}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Study Notes
                  </>
                )}
              </button>
            </motion.div>
          )}

          {view === 'notes' && generatedNotes && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={() => setView('home')}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveNote}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                      "flex-1 py-4 font-bold text-sm transition-all border-b-2",
                      activeTab === 'notes' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Study Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('doubt')}
                    className={cn(
                      "flex-1 py-4 font-bold text-sm transition-all border-b-2",
                      activeTab === 'doubt' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Ask Doubt
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {activeTab === 'notes' ? (
                    <div ref={notesRef} className="markdown-body">
                      <div className="mb-8 p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Quick Info</p>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>{selectedClass}</span>
                          <span>•</span>
                          <span>{selectedSubject}</span>
                        </div>
                      </div>
                      <Markdown>{generatedNotes}</Markdown>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">Have a specific question?</h3>
                        <textarea
                          placeholder="Type your doubt here..."
                          value={doubtText}
                          onChange={(e) => setDoubtText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                          >
                            <Camera size={18} />
                            Add Photo
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-all">
                            <Mic size={18} />
                            Voice
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                        {imagePreview && (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setImagePreview(null)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleSolveDoubt()}
                          disabled={loading || (!doubtText && !imagePreview)}
                          className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Solve My Doubt"}
                        </button>
                      </div>

                      {doubtResponse && (
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-700 font-bold">
                            <Sparkles size={18} />
                            AI Solution
                          </div>
                          <div className="markdown-body">
                            <Markdown>{doubtResponse}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'doubt' && (
            <motion.div
              key="doubt-solver"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('home')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">Doubt & Homework Solver</h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Class</label>
                    <select 
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                    >
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                    <select 
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    placeholder="Type your question or homework problem..."
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      <Camera size={20} />
                      Upload Photo
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all">
                      <Mic size={20} />
                      Voice Input
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-slate-100" />
                      <button 
                        onClick={() => setImagePreview(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSolveDoubt(false)}
                      disabled={loading || (!doubtText && !imagePreview)}
                      className="bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : "Solve Doubt"}
                    </button>
                    <button
                      onClick={() => handleSolveDoubt(true)}
                      disabled={loading || !imagePreview}
                      className="bg-secondary text-white py-4 rounded-xl font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : "Homework Helper"}
                    </button>
                  </div>
                </div>

                {doubtResponse && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-slate-900 text-slate-100 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Sparkles size={18} />
                        AI Explanation
                      </div>
                      <button 
                        onClick={() => setDoubtResponse(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="markdown-body text-slate-200 prose-invert">
                      <Markdown>{doubtResponse}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('home')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">Saved Notes</h2>
              </div>

              {savedNotes.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <FileText size={40} />
                  </div>
                  <p className="text-slate-500">No saved notes yet. Start generating!</p>
                  <button 
                    onClick={() => setView('home')}
                    className="text-primary font-bold hover:underline"
                  >
                    Generate your first note
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                          <BookOpen size={20} />
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{note.title}</h3>
                      <div className="flex gap-2 text-xs font-medium text-slate-500 mb-4">
                        <span className="bg-slate-100 px-2 py-1 rounded">{note.subject}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded">{note.className}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setGeneratedNotes(note.content);
                          setChapter(note.title);
                          setSelectedSubject(note.subject);
                          setSelectedClass(note.className);
                          setView('notes');
                        }}
                        className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        Open Notes
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 md:hidden flex justify-around items-center z-50">
        <button 
          onClick={() => setView('home')}
          className={cn("flex flex-col items-center gap-1", view === 'home' ? "text-primary" : "text-slate-400")}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-bold uppercase">Generate</span>
        </button>
        <button 
          onClick={() => setView('doubt')}
          className={cn("flex flex-col items-center gap-1", view === 'doubt' ? "text-primary" : "text-slate-400")}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase">Doubt</span>
        </button>
        <button 
          onClick={() => setView('saved')}
          className={cn("flex flex-col items-center gap-1", view === 'saved' ? "text-primary" : "text-slate-400")}
        >
          <History size={20} />
          <span className="text-[10px] font-bold uppercase">Saved</span>
        </button>
      </nav>
    </div>
  );
}
