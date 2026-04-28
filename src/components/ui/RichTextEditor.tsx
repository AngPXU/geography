'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Nhập nội dung văn bản...' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal HTML state when external value changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML && !isFocused) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const btnClass = "w-8 h-8 flex items-center justify-center hover:bg-slate-200 hover:text-[#082F49] rounded text-slate-500 transition-colors font-bold";

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <button 
          onClick={() => execCommand('bold')}
          className={btnClass}
          title="In đậm (Ctrl+B)"
        >
          <span className="font-black">B</span>
        </button>
        <button 
          onClick={() => execCommand('italic')}
          className={btnClass}
          title="In nghiêng (Ctrl+I)"
        >
          <span className="italic font-serif">I</span>
        </button>
        <button 
          onClick={() => execCommand('underline')}
          className={btnClass}
          title="Gạch chân (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1"></div>
        <button 
          onClick={() => execCommand('insertUnorderedList')}
          className={btnClass}
          title="Gạch đầu dòng"
        >
          <span>•</span>
        </button>
        <button 
          onClick={() => execCommand('insertOrderedList')}
          className={btnClass}
          title="Danh sách đánh số"
        >
          <span className="text-xs">1.</span>
        </button>
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full min-h-[120px] max-h-[400px] overflow-y-auto p-4 outline-none text-[#334155] leading-relaxed [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_b]:font-black [&_i]:italic [&_u]:underline"
      />
    </div>
  );
}
