declare module "pdfjs-dist" {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export interface TextItem {
    str: string;
    dir?: string;
    width?: number;
    height?: number;
    transform?: number[];
    fontName?: string;
    hasEOL?: boolean;
  }
  export interface TextMarkedContent {
    type: string;
    id: string;
  }
  export interface TextContent {
    items: Array<TextItem | TextMarkedContent | unknown>;
    styles: Record<string, unknown>;
  }
  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
  }
  export interface PDFPageProxy {
    pageNumber: number;
    numPages: number;
    getViewport(params: { scale: number; rotation?: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
      canvas?: HTMLCanvasElement;
    }): {
      promise: Promise<void>;
    };
    getTextContent(): Promise<TextContent>;
  }
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  export function getDocument(src: { data: Uint8Array } | unknown): PDFDocumentLoadingTask;
}
