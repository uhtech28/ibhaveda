'use client';

import { useEffect, useRef, useState } from 'react';
import {
    formatBytes,
    useFileUpload,
    type FileMetadata,
    type FileWithPreview,
} from '@/hooks/use-file-upload';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    CloudUpload,
    FileArchiveIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    HeadphonesIcon,
    ImageIcon,
    RefreshCwIcon,
    Trash2,
    TriangleAlert,
    Upload,
    VideoIcon,
    XIcon,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Extend FileWithPreview to include upload status and progress
interface FileUploadItem extends FileWithPreview {
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
    selected: boolean;
}

interface CardUploadProps {
    maxFiles?: number;
    maxSize?: number;
    accept?: string;
    multiple?: boolean;
    className?: string;
    onFilesChange?: (files: FileUploadItem[]) => void;
    onChange?: (files: File[]) => void;
    simulateUpload?: boolean;
}

export default function CardUpload({
    maxFiles = 1,
    maxSize = 50 * 1024 * 1024, // 50MB
    accept = '*',
    multiple = false,
    className,
    onFilesChange,
    onChange,
    simulateUpload = true,
}: CardUploadProps) {
    const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);
    const lastFileIdsRef = useRef<string[]>([]);
    const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, { kind: 'image' | 'video' | 'pdf' | 'word' | 'excel' | 'ppt' | 'text' | 'other'; url?: string; text?: string }>>({});

    const [
        { isDragging, errors },
        {
            removeFile,
            clearFiles,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            openFileDialog,
            getInputProps,
        },
    ] = useFileUpload({
        maxFiles,
        maxSize,
        accept,
        multiple,
        initialFiles: [],
        onFilesChange: (newFiles) => {
            const existingIds = new Set(uploadFiles.map((f) => f.id));
            let merged = newFiles.map((file) => {
                const existingFile = uploadFiles.find((existing) => existing.id === file.id);
                return existingFile
                    ? { ...existingFile, ...file }
                    : { ...file, progress: 0, status: 'uploading' as const, selected: false };
            });

            if (multiple) {
                merged = merged.map((f) => (existingIds.has(f.id) ? f : { ...f, selected: true }));
            } else {
                const lastId = merged[merged.length - 1]?.id;
                merged = merged.map((f) => ({ ...f, selected: f.id === lastId }));
            }

            setUploadFiles(merged);
            onFilesChange?.(merged);
        },
    });

    useEffect(() => {
        if (!onChange) return;
        const currentSig = uploadFiles.map((f) => `${f.id}:${f.selected ? 1 : 0}`);
        const prevSig = lastFileIdsRef.current;
        const changed = currentSig.length !== prevSig.length || currentSig.some((s, i) => s !== prevSig[i]);
        if (!changed) return;
        lastFileIdsRef.current = currentSig;
        const selectedFiles = uploadFiles
            .filter((f) => f.selected)
            .map((f) => f.file)
            .filter((f): f is File => f instanceof File);
        onChange(selectedFiles);
    }, [uploadFiles, onChange]);

    // Simulate upload progress for new files
    useEffect(() => {
        if (!simulateUpload) return;

        const uploadingFiles = uploadFiles.filter((file) => file.status === 'uploading');
        if (uploadingFiles.length === 0) return;

        const interval = setInterval(() => {
            setUploadFiles((prev) =>
                prev.map((file) => {
                    if (file.status !== 'uploading') return file;

                    const increment = Math.random() * 20 + 5; // Random increment between 5-25%
                    const newProgress = Math.min(file.progress + increment, 100);

                    if (newProgress >= 100) {
                        // Simulate occasional failures (10% chance)
                        const shouldFail = Math.random() < 0.1;
                        return {
                            ...file,
                            progress: 100,
                            status: shouldFail ? ('error' as const) : ('completed' as const),
                            error: shouldFail ? 'Upload failed. Please try again.' : undefined,
                        };
                    }

                    return { ...file, progress: newProgress };
                }),
            );
        }, 500);

        return () => clearInterval(interval);
    }, [uploadFiles, simulateUpload]);

    useEffect(() => {
        const detectKind = (file: File): 'image' | 'video' | 'pdf' | 'word' | 'excel' | 'ppt' | 'text' | 'other' => {
            const type = file.type || '';
            const name = file.name.toLowerCase();
            if (type.startsWith('image/')) return 'image';
            if (type.startsWith('video/')) return 'video';
            if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
            if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
            if (type.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel';
            if (type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
            if (type.startsWith('text/') || name.endsWith('.txt')) return 'text';
            return 'other';
        };

        const genVideoThumb = async (file: File, src?: string) => {
            return new Promise<string | undefined>((resolve) => {
                try {
                    const video = document.createElement('video');
                    video.src = src || URL.createObjectURL(file);
                    video.muted = true;
                    video.preload = 'metadata';
                    const capture = () => {
                        const canvas = document.createElement('canvas');
                        const w = 256;
                        const h = 256;
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return resolve(undefined);
                        try {
                            ctx.drawImage(video, 0, 0, w, h);
                            const url = canvas.toDataURL('image/png');
                            resolve(url);
                        } catch {
                            resolve(undefined);
                        }
                    };
                    video.addEventListener('loadeddata', () => {
                        try {
                            video.currentTime = Math.min(1, video.duration || 1);
                        } catch {
                            capture();
                        }
                    });
                    video.addEventListener('seeked', capture);
                    video.addEventListener('error', () => resolve(undefined));
                } catch {
                    resolve(undefined);
                }
            });
        };

        const genTextSnippet = async (file: File) => {
            return new Promise<string | undefined>((resolve) => {
                try {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const content = typeof reader.result === 'string' ? reader.result : '';
                        const text = content.replace(/\s+/g, ' ').slice(0, 160);
                        resolve(text || undefined);
                    };
                    reader.onerror = () => resolve(undefined);
                    reader.readAsText(file);
                } catch {
                    resolve(undefined);
                }
            });
        };

        const readArrayBuffer = (file: File) => new Promise<ArrayBuffer>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as ArrayBuffer);
            r.onerror = reject;
            r.readAsArrayBuffer(file);
        });

        const genPdfThumb = async (file: File) => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.212/legacy/build/pdf.worker.min.js';
                const ab = await readArrayBuffer(file);
                const doc = await pdfjsLib.getDocument({ data: ab }).promise;
                if (!doc || doc.numPages < 1) return undefined;
                const page = await doc.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                const off = document.createElement('canvas');
                const offCtx = off.getContext('2d');
                if (!offCtx) return undefined;
                off.width = viewport.width;
                off.height = viewport.height;
                await page.render({ canvasContext: offCtx, viewport, canvas: off }).promise;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return undefined;
                canvas.width = 256;
                canvas.height = 256;
                ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/png');
            } catch {
                return undefined;
            }
        };

        const genDocxText = async (file: File) => {
            try {
                const mammothModule = await import('mammoth');
                interface MammothLibrary {
                    extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
                }
                interface MammothImportedModule {
                    default?: MammothLibrary;
                }
                const mammoth: MammothLibrary = (mammothModule as MammothImportedModule).default || (mammothModule as MammothLibrary);
                const ab = await readArrayBuffer(file);
                interface MammothInput { arrayBuffer: ArrayBuffer; } const res = await mammoth.extractRawText({ arrayBuffer: ab } as MammothInput);
                const text = (res.value || '').replace(/\s+/g, ' ').slice(0, 200);
                return text || undefined;
            } catch {
                return undefined;
            }
        };

        const genExcelSample = async (file: File) => {
            try {
                const xlsxModule = await import('xlsx');
                const XLSX = xlsxModule.default || xlsxModule;
                const ab = await readArrayBuffer(file);
                const wb = XLSX.read(ab, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const rows: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }) as (string | number)[][];
                const sample = rows.slice(0, 3).map(r => (Array.isArray(r) ? r.slice(0, 3).join(' | ') : String(r))).join('\n');
                return sample || undefined;
            } catch {
                return undefined;
            }
        };

        const genPptText = async (file: File) => {
            try {
                const jszipModule = await import('jszip');
                const JSZip = jszipModule.default || jszipModule;
                const ab = await readArrayBuffer(file);
                const zip = await JSZip.loadAsync(ab);
                const slide1 = zip.file('ppt/slides/slide1.xml');
                if (!slide1) return undefined;
                const xml = await slide1.async('string');
                const doc = new DOMParser().parseFromString(xml, 'application/xml');
                const texts = Array.from(doc.getElementsByTagName('a:t')).map(n => n.textContent || '').filter(Boolean);
                const content = texts.join(' ').slice(0, 200);
                return content || undefined;
            } catch {
                return undefined;
            }
        };

        const run = async () => {
            const targets = uploadFiles.filter(f => f.file instanceof File);
            for (const fi of targets) {
                if (generatedPreviews[fi.id]) continue;
                const file = fi.file as File;
                const kind = detectKind(file);
                if (kind === 'image') {
                    setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'image', url: fi.preview } }));
                    continue;
                }
                if (kind === 'video') {
                    const thumb = await genVideoThumb(file, fi.preview);
                    if (thumb) {
                        setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'video', url: thumb } }));
                    } else {
                        setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'video' } }));
                    }
                    continue;
                }
                if (kind === 'text') {
                    const text = await genTextSnippet(file);
                    setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'text', text } }));
                    continue;
                }
                if (kind === 'pdf') {
                    const url = await genPdfThumb(file);
                    if (url) {
                        setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'pdf', url } }));
                    } else {
                        setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'pdf' } }));
                    }
                    continue;
                }
                if (kind === 'word') {
                    const text = await genDocxText(file);
                    setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'word', text } }));
                    continue;
                }
                if (kind === 'excel') {
                    const text = await genExcelSample(file);
                    setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'excel', text } }));
                    continue;
                }
                if (kind === 'ppt') {
                    const text = await genPptText(file);
                    setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'ppt', text } }));
                    continue;
                }
                setGeneratedPreviews(prev => ({ ...prev, [fi.id]: { kind: 'other' } }));
            }
        };
        run();
    }, [uploadFiles, generatedPreviews]);

    const removeUploadFile = (fileId: string) => {
        const fileToRemove = uploadFiles.find((f) => f.id === fileId);
        if (fileToRemove) {
            removeFile(fileToRemove.id);
        }
    };

    const toggleSelect = (fileId: string) => {
        setUploadFiles((prev) => {
            return multiple
                ? prev.map((f) => (f.id === fileId ? { ...f, selected: !f.selected } : f))
                : prev.map((f) => ({ ...f, selected: f.id === fileId }));
        });
    };

    const retryUpload = (fileId: string) => {
        setUploadFiles((prev) =>
            prev.map((file) =>
                file.id === fileId ? { ...file, progress: 0, status: 'uploading' as const, error: undefined } : file,
            ),
        );
    };

    const getFileIcon = (file: File | FileMetadata) => {
        const type = file instanceof File ? file.type : file.type;
        if (type.startsWith('image/')) return <ImageIcon className="size-6" />;
        if (type.startsWith('video/')) return <VideoIcon className="size-6" />;
        if (type.startsWith('audio/')) return <HeadphonesIcon className="size-6" />;
        if (type.includes('pdf')) return <FileTextIcon className="size-6" />;
        if (type.includes('word') || type.includes('doc')) return <FileTextIcon className="size-6" />;
        if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheetIcon className="size-6" />;
        if (type.includes('zip') || type.includes('rar')) return <FileArchiveIcon className="size-6" />;
        return <FileTextIcon className="size-6" />;
    };

    return (
        <div className={cn('w-full space-y-4', className)}>
            {/* Upload Area */}
            <div onClick={openFileDialog} 
                className={cn(
                    'relative rounded-lg border border-dashed p-6 text-center transition-colors cursor-pointer',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input {...getInputProps()} className="sr-only" />

                <div className="flex flex-col items-center gap-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors',
                            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
                        )}
                    >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Drop files here or{' '}
                            <button
                                type="button"
                                onClick={openFileDialog}
                                className="cursor-pointer text-primary underline-offset-4 hover:underline"
                            >
                                browse files
                            </button>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Maximum file size: {formatBytes(maxSize)} • Maximum files: {maxFiles}
                        </p>
                    </div>
                </div>
            </div>

            {/* Files Grid */}
            {uploadFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mx-3">
                        <h3 className="text-sm font-medium">Files ({uploadFiles.length})</h3>
                        <div className="flex gap-2">
                            <Button onClick={openFileDialog} variant="outline" size="sm">
                                <CloudUpload />
                                Add files
                            </Button>
                            <Button onClick={clearFiles} variant="outline" size="sm">
                                <Trash2 />
                                Remove all
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 mx-3 mb-2">
                        {uploadFiles.map((fileItem) => (
                            <div
                                key={fileItem.id}
                                className={cn(
                                    "relative group",
                                    fileItem.status === 'uploading' ? 'is-uploading' : '',
                                    fileItem.status === 'completed' ? 'is-uploaded' : ''
                                )}
                                aria-busy={fileItem.status === 'uploading'}
                                aria-live="polite"
                            >
                                {/* Remove button */}
                                <Button
                                    onClick={() => removeUploadFile(fileItem.id)}
                                    variant="outline"
                                    size="icon"
                                    className="absolute -end-2 -top-2 z-10 size-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <XIcon className="size-3" />
                                </Button>

                                {/* Wrapper */}
                                <div
                                    className={cn(
                                        'relative overflow-hidden rounded-lg border bg-card transition-colors',
                                    )}
                                    onClick={() => toggleSelect(fileItem.id)}
                                >
                                    {/* Image preview or file icon area */}
                                    <div
                                        className={cn(
                                            'relative aspect-square bg-muted',
                                            'transition-all duration-300',
                                            fileItem.status === 'uploading' ? 'brightness-75' : 'brightness-100'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'absolute inset-0 bg-black/60 transition-opacity duration-300',
                                                fileItem.status === 'uploading' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                            )}
                                        />
                                        {fileItem.status === 'uploading' && (
                                            <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Uploading">
                                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/70 border-t-transparent" />
                                            </div>
                                        )}
                                        {fileItem.file.type.startsWith('image/') && fileItem.preview ? (
                                            <>
                                                <img
                                                    src={fileItem.preview}
                                                    alt={fileItem.file.name}
                                                    className={cn(
                                                        'h-full w-full object-cover transition-opacity duration-300',
                                                        fileItem.status === 'completed' ? 'opacity-100' : 'opacity-100'
                                                    )}
                                                />
                                            </>
                                        ) : (
                                            /* File icon area for non-images */
                                            <div className="relative w-full h-full flex items-center justify-center text-muted-foreground/80">
                                                {generatedPreviews[fileItem.id]?.url ? (
                                                    <img
                                                        src={generatedPreviews[fileItem.id]?.url}
                                                        alt={fileItem.file.name}
                                                        className="h-full w-full object-cover transition-opacity duration-300"
                                                    />
                                                ) : generatedPreviews[fileItem.id]?.text ? (
                                                    <div className="p-3 text-xs text-muted-foreground overflow-hidden w-full h-full">
                                                        <div className="w-full h-full rounded-md border bg-background/40 p-2 leading-snug transition-opacity duration-300">
                                                            {generatedPreviews[fileItem.id]?.text}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-4xl transition-opacity duration-300">
                                                        {getFileIcon(fileItem.file)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {fileItem.status === 'completed' && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute inset-0 opacity-0 animate-in fade-in-0 duration-300" />
                                            </div>
                                        )}
                                        {fileItem.status === 'error' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[1px] transition-opacity duration-300">
                                                <div className="flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-xs">
                                                    <TriangleAlert className="size-3" />
                                                    Upload failed
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* File info footer */}
                                    <div className="p-3">
                                        <div className="space-y-1">
                                            <p className="truncate text-sm font-medium">{fileItem.file.name}</p>
                                            <div className="relative flex items-center justify-between gap-2">
                                                <span className="text-xs text-muted-foreground">{formatBytes(fileItem.file.size)}</span>

                                                {fileItem.status === 'error' && fileItem.error && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                onClick={() => retryUpload(fileItem.id)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute end-0 -top-1.25 size-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <RefreshCwIcon className="size-3 opacity-100" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Upload failed. Retry</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <Alert variant="destructive" className="mt-5">
                    <AlertIcon>
                        <TriangleAlert />
                    </AlertIcon>
                    <AlertContent>
                        <AlertTitle>File upload error(s)</AlertTitle>
                        <AlertDescription>
                            {errors.map((error, index) => (
                                <p key={index} className="last:mb-0">
                                    {error}
                                </p>
                            ))}
                        </AlertDescription>
                    </AlertContent>
                </Alert>
            )}
        </div>
    );
}
