'use client';

import React, { useRef, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Parse raw text that may contain $$...$$ (display math) and $...$ (inline math),
 * returning an HTML string with KaTeX-rendered formulas embedded.
 */
export function renderMathText(raw: string): string {
  if (!raw) return '';
  // First split by $$...$$ (display math)
  const parts = raw.split(/(\$\$[\s\S]*?\$\$)/g);
  let result = '';
  for (const part of parts) {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      const latex = part.slice(2, -2).trim();
      try {
        result += `<div style="overflow-x:auto;text-align:center;padding:4px 0">${katex.renderToString(latex, { displayMode: true, throwOnError: false, trust: false })}</div>`;
      } catch {
        result += `<span style="color:#dc2626;font-family:monospace;font-size:12px">[Lỗi LaTeX: ${part}]</span>`;
      }
    } else {
      // Handle inline $...$ within text parts
      const inlineParts = part.split(/(\$[^$\n]+?\$)/g);
      for (const ip of inlineParts) {
        if (ip.startsWith('$') && ip.endsWith('$') && ip.length > 2) {
          const latex = ip.slice(1, -1);
          try {
            result += katex.renderToString(latex, { displayMode: false, throwOnError: false, trust: false });
          } catch {
            result += `<span style="color:#dc2626;font-family:monospace;font-size:12px">[Lỗi: ${ip}]</span>`;
          }
        } else {
          // Safe-escape HTML, preserve line breaks as <br>
          result += ip
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
        }
      }
    }
  }
  return result;
}

const FORMULA_TEMPLATES: { label: string; desc: string; latex: string }[] = [
  { label: 'Phân số', desc: 'a/b', latex: '\\frac{a}{b}' },
  { label: 'Tỉ lệ ×100', desc: 'a/b × 100', latex: '\\frac{a}{b} \\times 100' },
  { label: 'Mật độ dân số', desc: 'người/km²', latex: '\\text{Mật độ dân số} = \\frac{\\text{Dân số (người)}}{\\text{Diện tích (km}^2\\text{)}}' },
  { label: 'Tỉ số giới tính', desc: 'nam/nữ×100', latex: '\\text{Tỉ số giới tính} = \\frac{\\text{Tổng số nam}}{\\text{Tổng số nữ}} \\times 100' },
  { label: 'Tốc độ tăng trưởng', desc: '%', latex: '\\frac{\\text{Giá trị cuối} - \\text{Giá trị đầu}}{\\text{Giá trị đầu}} \\times 100\\%' },
  { label: 'Tỉ lệ bản đồ', desc: '1:n', latex: '\\frac{\\text{Khoảng cách trên bản đồ}}{\\text{Khoảng cách thực tế}}' },
  { label: 'Vận tốc', desc: 'v = s/t', latex: 'v = \\frac{s}{t}' },
  { label: 'Phần trăm', desc: 'x/tổng×100', latex: '\\% = \\frac{x}{\\text{Tổng}} \\times 100' },
  { label: 'Trung bình', desc: 'mean', latex: '\\bar{x} = \\frac{x_1 + x_2 + \\cdots + x_n}{n}' },
  { label: 'Căn bậc hai', desc: '√a', latex: '\\sqrt{a}' },
  { label: 'Lũy thừa', desc: 'aⁿ', latex: 'a^{n}' },
  { label: 'Năng suất', desc: 'sản lượng/dt', latex: '\\text{Năng suất} = \\frac{\\text{Sản lượng}}{\\text{Diện tích}}' },
  { label: 'Biểu thức tự nhập', desc: 'tùy chỉnh', latex: '\\frac{\\text{...}}{\\text{...}} \\times 100' },
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function MathContentEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = useCallback((latex: string) => {
    const ta = textareaRef.current;
    const toInsert = `\n$$${latex}$$\n`;
    if (!ta) {
      onChange(value + toInsert);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = value.slice(0, start) + toInsert + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + toInsert.length;
    }, 0);
  }, [value, onChange]);

  const preview = renderMathText(value);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Template chips */}
      <div className="px-3 pt-3 pb-2 bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-cyan-100">
        <p className="text-[10px] font-black text-cyan-700 uppercase tracking-wide mb-2">📐 Chèn công thức nhanh</p>
        <div className="flex flex-wrap gap-1.5">
          {FORMULA_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              title={`$$${tpl.latex}$$`}
              onClick={() => insertTemplate(tpl.latex)}
              className="px-2 py-1 bg-white hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-400 rounded-lg text-xs font-bold text-cyan-700 transition-all duration-150 flex flex-col items-start leading-tight"
            >
              <span>{tpl.label}</span>
              <span className="text-[9px] font-normal text-slate-400">{tpl.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Gõ nội dung văn bản...\nDán LaTeX và bọc trong $$...$$ để hiển thị công thức, ví dụ:\n$$\\frac{a}{b} \\times 100$$'}
        rows={6}
        className="w-full px-4 py-3 text-sm text-[#334155] font-mono bg-white outline-none resize-y border-0 focus:ring-0"
        style={{ borderBottom: '1px solid #f1f5f9' }}
      />

      {/* Live preview */}
      {value.trim() && (
        <div className="px-4 py-3 bg-cyan-50/40 border-t border-cyan-100">
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-wide mb-2">Xem trước</p>
          <div
            className="text-sm text-[#334155] leading-relaxed overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      )}
    </div>
  );
}
