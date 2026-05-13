import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Sparkles, Droplets, ShieldAlert, Sprout, ThermometerSun, Leaf, CalendarIcon, Mic, MicOff, Volume2, X } from 'lucide-react';
import { getFarmingAdvice, getSpecializedAdvice, getFarmingVoiceAdvice, getFarmingNexusStream, textToSpeech, streamTextToSpeech } from '@/services/gemini';
import Markdown from 'react-markdown';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

const QUICK_ACTIONS = [
  { id: 'fertilizer', label: 'Fertilizer', icon: Sprout, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'pest', label: 'Pest Control', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
  { id: 'disease', label: 'Disease Detection', icon: Leaf, color: 'text-amber-600 bg-amber-50' },
  { id: 'watering', label: 'Watering Tips', icon: Droplets, color: 'text-blue-600 bg-blue-50' },
  { id: 'soil', label: 'Soil Health', icon: ThermometerSun, color: 'text-slate-600 bg-slate-50' },
  { id: 'seasonal', label: 'Seasonal Plan', icon: CalendarIcon, color: 'text-indigo-600 bg-indigo-50' },
] as const;

export default function AIChat() {
  const { settings, crops } = useApp();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<number | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<number | null>(null);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudioResponse = async (text: string, index: number) => {
    // Resume audio context on user interaction
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    // If already playing or generating this one, stop it
    if (isPlayingAudio === index || isGeneratingAudio === index) {
      stopCurrentPlayback();
      setIsPlayingAudio(null);
      setIsGeneratingAudio(null);
      return;
    }

    // Stop any current playback
    stopCurrentPlayback();

    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    let cachedBase64 = audioCache[index];
    
    if (cachedBase64) {
      // Direct playback from cache
      playFromBase64(cachedBase64, index);
      return;
    }

    // Start streaming
    setIsGeneratingAudio(index);
    setIsPlayingAudio(index);
    let allChunks: Uint8Array[] = [];
    let nextStartTime = audioCtx.currentTime + 0.1;

    try {
      const stream = streamTextToSpeech(text);
      let isFirstChunk = true;

      for await (const chunk of stream) {
        // Check if user switched or stopped
        if (isPlayingAudio !== index && isGeneratingAudio !== index) break;
        
        if (isFirstChunk) {
          setIsGeneratingAudio(null);
          isFirstChunk = false;
        }

        const binaryString = atob(chunk);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        allChunks.push(bytes);

        const buffer = await decodeAudioChunk(chunk, audioCtx);
        if (buffer) {
          playBufferChunk(buffer, nextStartTime, index);
          nextStartTime += buffer.duration;
        }
      }

      if (allChunks.length > 0) {
        // Build the full binary
        const totalLen = allChunks.reduce((acc, curr) => acc + curr.length, 0);
        const fullBytes = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of allChunks) {
          fullBytes.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Fast binary to base64
        let binary = '';
        for (let i = 0; i < fullBytes.length; i++) {
          binary += String.fromCharCode(fullBytes[i]);
        }
        const fullBase64 = btoa(binary);
        setAudioCache(prev => ({ ...prev, [index]: fullBase64 }));
      }
    } catch (err) {
      console.error("Streaming TTS Error:", err);
    } finally {
      setIsGeneratingAudio(null);
      // Optional: keep isPlayingAudio until last chunk finishes
      // For now, clearing it here is safe enough as the loop ended
      setIsPlayingAudio(null);
    }
  };

  const stopCurrentPlayback = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
      currentSourceRef.current = null;
    }
    // We might have multiple scheduled nodes, but they will end naturally or be stopped if we track them.
    // For simplicity, we just clear the reference used for the UI state.
    setIsPlayingAudio(null);
  };

  const decodeAudioChunk = async (source: string | Uint8Array, audioCtx: AudioContext): Promise<AudioBuffer | null> => {
    try {
      let bytes: Uint8Array;
      if (typeof source === 'string') {
        const binaryString = atob(source);
        const len = binaryString.length;
        bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else {
        bytes = source;
      }

      const len = bytes.length;

      // Try encoded decode first
      try {
        return await audioCtx.decodeAudioData(bytes.buffer.slice(0));
      } catch (e) {
        // Fallback to raw PCM 16-bit 24kHz
        const pcmLen = len / 2;
        const audioBuffer = audioCtx.createBuffer(1, pcmLen, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const pcmData = new Int16Array(bytes.buffer);
        for (let i = 0; i < pcmLen; i++) {
          channelData[i] = pcmData[i] / 32768;
        }
        return audioBuffer;
      }
    } catch (err) {
      console.error("Chunk decode error:", err);
      return null;
    }
  };

  const playBufferChunk = (buffer: AudioBuffer, startTime: number, index: number) => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    // Smooth transition
    const actualStartTime = Math.max(startTime, audioCtx.currentTime);
    source.start(actualStartTime);
    
    source.onended = () => {
      // If this was the "current" source, we should check if more chunks are coming.
      // But in streaming mode, we don't know easily when it ends until the generator finishes.
    };
  };

  const playFromBase64 = async (base64: string, index: number) => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    setIsPlayingAudio(index);
    const buffer = await decodeAudioChunk(base64, audioCtx);
    if (buffer) {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setIsPlayingAudio(null);
      };
      currentSourceRef.current = source;
      source.start();
    } else {
      setIsPlayingAudio(null);
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media Capture API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const currentMime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: currentMime });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await handleVoiceSend(base64Audio, currentMime);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      let message = "Could not access microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = "Microphone access denied. Please enable permissions in your browser settings.";
        if (window.self !== window.top) {
          message += " If you are in an iframe, try opening the app in a new tab.";
        }
      } else if (err.name === 'NotFoundError') {
        message = "No microphone found on this device.";
      }
      setError(message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNexusStream = async (stream: AsyncGenerator<{ text: string | null; audio: string | null | undefined }>) => {
    setIsLoading(true);
    const botIdx = messages.length; // The index the new message will have
    setMessages(prev => [...prev, { role: 'bot', content: '' }]);
    
    // Resume audio context
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    await audioCtxRef.current.resume();
    const audioCtx = audioCtxRef.current;
    
    setIsPlayingAudio(botIdx);
    let nextAudioTime = audioCtx.currentTime + 0.1;
    let accumulatedText = '';
    let allAudioChunks: Uint8Array[] = [];

    try {
      for await (const chunk of stream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], content: accumulatedText };
            return next;
          });
        }
        
        if (chunk.audio) {
          const binaryString = atob(chunk.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          allAudioChunks.push(bytes);
          
          const buffer = await decodeAudioChunk(chunk.audio, audioCtx);
          if (buffer) {
            playBufferChunk(buffer, nextAudioTime, botIdx);
            nextAudioTime += buffer.duration;
          }
        }
      }

      // Cache the full audio once complete
      if (allAudioChunks.length > 0) {
        const totalLen = allAudioChunks.reduce((acc, curr) => acc + curr.length, 0);
        const fullBytes = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of allAudioChunks) {
          fullBytes.set(c, offset);
          offset += c.length;
        }
        let binary = '';
        for (let i = 0; i < fullBytes.length; i++) binary += String.fromCharCode(fullBytes[i]);
        setAudioCache(prev => ({ ...prev, [botIdx]: btoa(binary) }));
      }
    } catch (err) {
      console.error("Nexus Stream Error:", err);
    } finally {
      setIsLoading(false);
      // Keep playing state until audio catch-up if needed, 
      // but for UX, clearing it when stream ends is often okay if buffer is small.
      setTimeout(() => {
        if (audioCtx.currentTime >= nextAudioTime - 0.5) {
          setIsPlayingAudio(null);
        }
      }, 1000);
    }
  };

  const handleVoiceSend = async (base64Audio: string, mimeType: string) => {
    const userMessage: Message = { role: 'user', content: "🎤 _Voice Input Received_" };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botResponse = await getFarmingVoiceAdvice(base64Audio, mimeType, settings.language);
      const botMessage: Message = { role: 'bot', content: botResponse };
      setMessages(prev => {
        const newMessages = [...prev, botMessage];
        // Use the index of the response to trigger audio
        const botIdx = newMessages.length - 1;
        playAudioResponse(botResponse, botIdx);
        return newMessages;
      });
    } catch (err) {
      console.error("Voice Send Error:", err);
      setMessages(prev => [...prev, { role: 'bot', content: "I encountered an error processing your voice uplink. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadChat() {
      if (!user || !supabase) {
        if (!user) {
          setMessages([
            { role: 'bot', content: "Hello! I'm your AI Farming Advisor. How can I help you today? You can ask me about crop maintenance, pest control, or weather-related farming tips." }
          ]);
        }
        return;
      }
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('messages')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.messages) {
          setMessages(data.messages);
        } else {
          setMessages([
            { role: 'bot', content: "Hello! I'm your AI Farming Advisor. How can I help you today? You can ask me about crop maintenance, pest control, or weather-related farming tips." }
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    }
    loadChat();
  }, [user]);

  useEffect(() => {
    if (messages.length > 0 && user && supabase) {
      const saveChat = async () => {
        try {
          await supabase
            .from('chats')
            .upsert({ 
              user_id: user.id, 
              messages: messages, 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });
        } catch (err) {
          console.error('Failed to save chat:', err);
        }
      };
      saveChat();
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, user]);

  // Pre-fetch audio for the last bot message for efficiency
  useEffect(() => {
    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    
    if (lastMsg && lastMsg.role === 'bot' && !audioCache[lastIdx]) {
      const fetchAudio = async () => {
        try {
          const audio = await textToSpeech(lastMsg.content);
          if (audio) {
            setAudioCache(prev => ({ ...prev, [lastIdx]: audio }));
          }
        } catch (err) {
          console.warn("Pre-fetch error:", err);
        }
      };
      fetchAudio();
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  const clearChat = async () => {
    if (confirm("Are you sure you want to delete all communication logs?")) {
      const initialMsg: Message[] = [{ role: 'bot', content: "Logs cleared. Awaiting new agricultural queries." }];
      setMessages(initialMsg);
      if (user && supabase) {
        try {
          await supabase.from('chats').delete().eq('user_id', user.id);
        } catch (err) {
          console.error('Failed to clear chat:', err);
        }
      }
    }
  };

  const handleQuickAction = async (category: typeof QUICK_ACTIONS[number]['id']) => {
    if (isLoading) return;

    const currentCrop = crops[0]?.name || 'Wheat';
    const location = settings.location;
    const weather = "Atmospheric stability: Delta-9";

    const label = QUICK_ACTIONS.find(a => a.id === category)?.label;
    const userPrompt = `System: Generate ${label} report for ${currentCrop} at ${location}.`;
    
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setIsLoading(true);

    const botResponse = await getSpecializedAdvice({
      crop: currentCrop,
      location,
      weather,
      category,
      language: settings.language
    });

    setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const stream = getFarmingNexusStream(userMessage, settings.language);
      await handleNexusStream(stream);
    } catch (err) {
      console.error("Chat Send Error:", err);
      setMessages(prev => [...prev, { role: 'bot', content: "Protocol error in agricultural gateway. Please refresh." }]);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] flex flex-col max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 md:pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Intelligence Nexus</h1>
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em] mt-1">Real-time Agricultural Synthesis</p>
        </div>
        <button 
          onClick={clearChat}
          className="w-full sm:w-auto text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors px-3 py-2 border border-slate-200 rounded-lg hover:border-rose-200 bg-white"
        >
          Purge Logs
        </button>
      </div>

      <div className="flex-1 card overflow-hidden flex flex-col p-0 border border-slate-200 shadow-xl bg-white rounded-2xl">
        <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Encryption Active</span>
          </div>
          <div className="hidden md:flex gap-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Latency: 42ms</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Buffer: Optimized</span>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scroll-smooth custom-scrollbar"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium flex gap-3 mb-4"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Permission Integrity Compromised</p>
                <p>{error}</p>
                {window.self !== window.top && (
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] hover:bg-rose-700 transition-colors"
                  >
                    Open in Full Tab for Voice Access
                  </button>
                )}
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {messages.length <= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pb-8">
              {[
                "How to increase wheat yield in loamy soil?",
                "Identify organic pests control for tomatoes",
                "Suggest a winter crop rotation for Sector 4",
                "What are the signs of nitrogen deficiency?"
              ].map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(starter);
                  }}
                  className="p-3 md:p-4 text-left border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
                >
                  <p className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-700 transition-colors uppercase tracking-tight mb-1">Starter Query</p>
                  <p className="text-xs md:text-sm text-slate-700 group-hover:text-emerald-900 leading-tight">{starter}</p>
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                  ? 'bg-slate-900 border-slate-800 text-white' 
                  : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-xl md:rounded-2xl p-4 md:p-5 text-xs md:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className={`prose prose-xs md:prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-emerald'}`}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  {msg.role === 'bot' && (
                    <button 
                      onClick={() => playAudioResponse(msg.content, i)}
                      className={cn(
                        "mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        isPlayingAudio === i ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700"
                      )}
                    >
                      {isGeneratingAudio === i ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Synthesizing Audio...
                        </>
                      ) : isPlayingAudio === i ? (
                        <>
                          <div className="flex gap-0.5 items-center">
                            <span className="w-0.5 h-2 bg-rose-500 animate-[bounce_0.6s_infinite]" />
                            <span className="w-0.5 h-3 bg-rose-500 animate-[bounce_0.6s_infinite_0.1s]" />
                            <span className="w-0.5 h-2 bg-rose-500 animate-[bounce_0.6s_infinite_0.2s]" />
                          </div>
                          Stop Synthesis
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          Play Voice Response
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <span className={`text-[8px] md:text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'mr-10 md:mr-11' : 'ml-10 md:ml-11'}`}>
                {msg.role === 'user' ? 'User_Uplink' : 'Krishi_AI_Core'}
              </span>
            </motion.div>
          ))}

          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 rounded-tl-none">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-4 md:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-slate-100 transition-all hover:border-emerald-200 hover:bg-emerald-50 shadow-sm ${action.color}`}
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>

      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 pb-12 lg:pb-6">
        <div className="flex gap-2 md:gap-3 bg-white p-2 rounded-xl md:rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-600 transition-all shadow-inner">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "p-2 rounded-lg transition-all",
                isRecording ? "bg-rose-100 text-rose-600 animate-pulse" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              )}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <textarea 
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Inject query..."
              className="flex-1 bg-transparent px-3 py-2 outline-hidden text-sm resize-none min-h-[40px] flex items-center"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 md:px-6 bg-emerald-600 text-white rounded-lg md:rounded-xl hover:bg-emerald-700 disabled:opacity-30 transition-all shadow-md flex items-center justify-center group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <div className="mt-2 md:mt-3 flex justify-center">
            <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              KrishiSahay Intel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
