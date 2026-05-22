"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Mic,
  Video,
  Image as ImageIcon,
  File,
  Upload,
  Check,
  Loader2,
  Trash2,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpointId: Id<"ventureCheckpoints">;
  taskLevel: "t1" | "t2" | "t3"; // For future use with task-specific validation
  isGoldCheckpoint: boolean;
  onSuccess?: () => void;
}

type ContributionFormat = "text" | "audio" | "video" | "image" | "file";

export function ContributionModal({
  isOpen,
  onClose,
  checkpointId,
  taskLevel,
  isGoldCheckpoint,
  onSuccess,
}: ContributionModalProps) {
  const [selectedFormat, setSelectedFormat] =
    useState<ContributionFormat>("text");
  const [textContent, setTextContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const generateUploadUrl = useMutation(api.ventures.generateUploadUrl);
  const submitEvidence = useMutation(api.ventures.submitEvidence);

  // Update word count when text changes
  useEffect(() => {
    if (selectedFormat === "text") {
      const words = textContent.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      if (words.length < 50 && textContent.trim()) {
        setValidationError(`Need ${50 - words.length} more words (minimum 50)`);
      } else {
        setValidationError(null);
      }
    }
  }, [textContent, selectedFormat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadedFileUrl) {
        URL.revokeObjectURL(uploadedFileUrl);
      }
    };
  }, [uploadedFileUrl]);

  const handleFormatChange = (format: ContributionFormat) => {
    setSelectedFormat(format);
    setValidationError(null);
    // Clear previous content when switching formats
    setTextContent("");
    setWordCount(0);
    setUploadedFile(null);
    setUploadedFileName("");
    setAudioBlob(null);
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type based on format
    const validTypes: Record<string, string[]> = {
      video: ["video/mp4", "video/webm", "video/quicktime"],
      image: [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
      ],
      file: [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    const allowedTypes = validTypes[selectedFormat];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      setValidationError("Invalid file type for selected format");
      return;
    }

    setUploadedFile(file);
    setValidationError(null);

    // Create preview URL for images and videos
    if (selectedFormat === "image" || selectedFormat === "video") {
      const url = URL.createObjectURL(file);
      setUploadedFileUrl(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      // Directly handle the file instead of creating a fake event
      setUploadedFile(file);
      setUploadedFileName(file.name);
      setValidationError(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setValidationError(null);
    } catch (error) {
      setValidationError(
        "Microphone access denied. Please allow microphone access.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (!audioBlob) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsPlaying(false);
    }

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audioPlayerRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      audioPlayerRef.current = null;
    };

    audio.play();
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioBlob(null);
    setIsPlaying(false);
  };

  const canSubmit = () => {
    if (selectedFormat === "text") {
      return wordCount >= 50;
    }
    if (selectedFormat === "audio") {
      return audioBlob !== null;
    }
    return uploadedFile !== null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      let storageId: Id<"_storage"> | undefined;
      let content: Record<string, unknown> = {};

      if (selectedFormat === "text") {
        content = {
          text: textContent,
          wordCount,
          submittedAt: Date.now(),
        };
      } else {
        // Upload file to Convex storage
        const uploadUrl = await generateUploadUrl();

        let fileToUpload: File | Blob;
        if (selectedFormat === "audio" && audioBlob) {
          // Use Blob directly as File constructor may not be available in all contexts
          fileToUpload = new Blob([audioBlob], { type: "audio/webm" });
        } else if (uploadedFile) {
          fileToUpload = uploadedFile;
        } else {
          throw new Error("No file to upload");
        }

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });

        const { storageId: uploadedStorageId } = await uploadResult.json();
        storageId = uploadedStorageId;

        content = {
          storageId,
          fileName: uploadedFile?.name || "recording.webm",
          fileType: fileToUpload.type,
          uploadedAt: Date.now(),
        };
      }

      // Submit evidence with content
      await submitEvidence({
        taskId: checkpointId as unknown as Id<"ventureTasks">,
        content: JSON.stringify(content),
        storageId,
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Reset state
        setTextContent("");
        setWordCount(0);
        setUploadedFile(null);
        setAudioBlob(null);
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Submission error:", error);
      setValidationError("Failed to submit contribution. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTabs = [
    { id: "text" as const, label: "Text", icon: FileText },
    { id: "audio" as const, label: "Audio", icon: Mic },
    { id: "video" as const, label: "Video", icon: Video },
    { id: "image" as const, label: "Image", icon: ImageIcon },
    { id: "file" as const, label: "File", icon: File },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0A0D12] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">
                Submit Contribution
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isGoldCheckpoint
                  ? "Gold checkpoint requires evidence"
                  : "Complete your checkpoint submission"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Success State */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-[#0A0D12] flex items-center justify-center z-10"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">
                  Contribution Submitted!
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Processing your submission...
                </p>
              </div>
            </motion.div>
          )}

          {/* Format Tabs */}
          <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
            {formatTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFormat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleFormatChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Text Format */}
            {selectedFormat === "text" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Write your contribution (minimum 50 words)
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Share your insights, findings, or reflections..."
                  className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-sm font-medium ${
                      wordCount >= 50 ? "text-emerald-400" : "text-gray-400"
                    }`}
                  >
                    {wordCount} / 50 words
                  </span>
                  {wordCount >= 50 && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Requirement met
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Audio Format */}
            {selectedFormat === "audio" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  Record your audio contribution
                </label>

                {!audioBlob ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="w-20 h-20 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full flex items-center justify-center transition-all"
                      >
                        <Mic className="w-8 h-8 text-red-400" />
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all animate-pulse"
                      >
                        <StopCircle className="w-8 h-8 text-white" />
                      </button>
                    )}
                    <p className="text-sm text-gray-400">
                      {isRecording
                        ? "Recording... Click to stop"
                        : "Click to start recording"}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Mic className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Recording Complete
                          </p>
                          <p className="text-xs text-gray-400">
                            Ready to submit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={isPlaying ? pauseAudio : playAudio}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-gray-300" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                        <button
                          onClick={deleteRecording}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video/Image/File Upload */}
            {(selectedFormat === "video" ||
              selectedFormat === "image" ||
              selectedFormat === "file") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload your {selectedFormat}
                </label>

                {!uploadedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-indigo-500/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-300 font-medium mb-1">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedFormat === "video" && "MP4, WebM, QuickTime"}
                      {selectedFormat === "image" && "PNG, JPG, GIF, WebP"}
                      {selectedFormat === "file" && "PDF, PPT, XLS, DOC"}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    {/* Image Preview */}
                    {selectedFormat === "image" && uploadedFileUrl && (
                      <img
                        src={uploadedFileUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain bg-black/20"
                      />
                    )}

                    {/* Video Preview */}
                    {selectedFormat === "video" && uploadedFileUrl && (
                      <video
                        src={uploadedFileUrl}
                        controls
                        className="w-full h-64 bg-black/20"
                      />
                    )}

                    {/* File Info */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          if (uploadedFileUrl) {
                            URL.revokeObjectURL(uploadedFileUrl);
                            setUploadedFileUrl(null);
                          }
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept={
                    selectedFormat === "video"
                      ? "video/mp4,video/webm,video/quicktime"
                      : selectedFormat === "image"
                        ? "image/png,image/jpeg,image/gif,image/webp"
                        : ".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx"
                  }
                  className="hidden"
                />
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-sm text-red-400">{validationError}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Contribution
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
