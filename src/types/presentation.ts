/**
 * Kiểu dữ liệu chung cho hệ thống Bài giảng Block-based.
 *
 * Quan trọng về tương thích dữ liệu:
 * - Mongoose schema (Presentation.blocks) là `Array` không strict
 *   → có thể thêm field mới mà không cần migration.
 * - Mọi field đều optional → block cũ trong DB vẫn render đúng.
 * - Các trường "legacy" (vd: imageUrl, content cho objectives) được giữ
 *   để hiển thị tương thích ngược, chỉ deprecated khi tạo block mới.
 */

export type BlockType =
  // ── 8 module cốt lõi (Phase 1) ──
  | 'heading' | 'text' | 'funFact' | 'mapAction' | 'quiz'
  | 'objectives' | 'imageScenario' | 'dataTable'
  // ── 5 module mở rộng (Phase 2) ──
  | 'video' | 'chart' | 'diagram' | 'compare' | 'callout'
  // ── 9 module nâng cao (Phase 3) ──
  | 'timeline' | 'groupActivity' | 'openQuestion' | 'fillBlank'
  | 'quote' | 'glossary' | 'twoColumn' | 'gallery' | 'summary'
  // ── module đặc biệt ──
  | 'practice';

// ── Sub-types ─────────────────────────────────────────────────────────────

export interface FunFactFormula {
  label?: string;   // optional text description above the formula
  latex: string;    // KaTeX LaTeX string
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DiagramHotspot {
  x: number;   // 0-100 (%)
  y: number;   // 0-100 (%)
  label: string;
  description?: string;
}

export interface CompareColumn {
  title: string;
  icon?: string;
  color?: string;
  items: string[];
}

export interface TimelineEvent {
  date: string;       // "1975", "Kỷ Phấn trắng", "Năm 2050"...
  title: string;
  description?: string;
  icon?: string;
}

export interface PracticeItem {
  text: string;
  icon?: string;  // emoji nhân vật minh họa
}

export interface SummarySection {
  title: string;  // e.g. "1. Hệ thống kinh, vĩ tuyến"
  body: string;   // multiline — lines with "-" prefix = bullet, lines ending ":" = sub-header
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface ColumnContent {
  type: 'text' | 'image';
  content: string;
  caption?: string;
}

export interface GalleryImage {
  url: string;
  caption?: string;
}

export type CalloutVariant = 'info' | 'warning' | 'danger' | 'success' | 'tip';

// ── Quiz (multi-question) ──
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];      // always 4 options A/B/C/D
  correctIndex: number;
  explanation?: string;
  questionImage?: string;
}

// ── Block ──────────────────────────────────────────────────────────────────

export interface StoryBlock {
  id: string;
  type: BlockType;

  // ── Common ──
  content?: string;    // text, callout body, summary intro
  title?: string;      // funFact, callout, activity, gallery, video, etc.

  // ── Heading ──
  level?: 1 | 2 | 3;
  headingBg?: string;    // custom background color / gradient
  headingColor?: string; // custom text color

  // ── List items (objectives, summary, activity steps...) ──
  items?: string[];

  // ── FunFact (added emoji + tag + formulas) ──
  emoji?: string;
  tag?: string;
  funFactFormulas?: FunFactFormula[];
  funFactContentAfter?: string;
  funFactRawContent?: string; // unified plain-text + $$LaTeX$$ content

  // ── Quiz (improved — legacy single + new multi-question) ──
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  questionImage?: string;
  quizQuestions?: QuizQuestion[];  // multi-question (new)

  // ── MapAction (unchanged) ──
  lat?: number;
  lng?: number;
  zoom?: number;
  description?: string;
  showGrid?: boolean;
  showAnnotations?: boolean; // legacy
  annotationPreset?: string;
  showPin?: boolean;
  pinTitle?: string;
  pinInfo?: string;
  pinImage?: string;
  globeStyle?: string;

  // ── ImageScenario (unified to imageUrls; imageUrl is legacy) ──
  imageUrl?: string;
  imageUrls?: string[];

  // ── DataTable ──
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  tableHighlightCol?: number;
  tableHighlightRow?: number;
  tableUnit?: string;
  tableSource?: string;
  tableSplitHeader?: boolean;
  tableRowHeader?: string;
  tableColHeader?: string;
  tableHeaderBg?: string;
  tableHeaderTextColor?: string;

  // ── Video (Phase 2) ──
  videoUrl?: string;
  videoCaption?: string;

  // ── Chart (Phase 2) ──
  chartType?: 'bar' | 'column' | 'line' | 'pie';
  chartData?: ChartDataPoint[];
  chartUnit?: string;
  chartXLabel?: string;
  chartYLabel?: string;
  chartCaption?: string;  // "Hình 1. Tên biểu đồ..."
  chartSource?: string;   // "(Nguồn: Cục Thống kê năm 2025)"

  // ── Diagram (Phase 2) ──
  diagramImage?: string;
  diagramHotspots?: DiagramHotspot[];

  // ── Compare (Phase 2) ──
  compareColumns?: CompareColumn[];

  // ── Callout (Phase 2) ──
  calloutVariant?: CalloutVariant;

  // ── Timeline (Phase 3) ──
  timelineEvents?: TimelineEvent[];

  // ── GroupActivity (Phase 3) ──
  activityGoal?: string;
  activitySteps?: string[];
  activityOutput?: string;
  activityDuration?: string;

  // ── OpenQuestion (Phase 3) — uses `question`, `content` (placeholder) ──
  expectedKeywords?: string[];
  questionType?: 'short' | 'long';
  openAnswer?: string; // Đáp án — chỉ hiện khi giáo viên mở

  // ── FillBlank (Phase 3) ──
  // template dùng {{0}}, {{1}}... để đánh dấu chỗ trống
  blankTemplate?: string;
  blankAnswers?: string[];

  // ── Quote (Phase 3) ──
  quoteText?: string;
  quoteAuthor?: string;
  quoteSource?: string;

  // ── Glossary (Phase 3) ──
  glossaryTerms?: GlossaryTerm[];

  // ── TwoColumn (Phase 3) ──
  twoColumnLeft?: ColumnContent;
  twoColumnRight?: ColumnContent;

  // ── Gallery (Phase 3) ──
  galleryImages?: GalleryImage[];
  galleryDisplayMode?: 'inline' | 'panel'; // 'inline' = lưới ảnh trong nội dung, 'panel' = hiển thị ở khung phải như imageScenario

  // ── Summary — uses title + items + content (intro) ──
  summarySections?: SummarySection[];
  summaryImage?: string;

  // ── Practice (Luyện tập & Vận dụng) ──
  practiceItems?: PracticeItem[];
}
