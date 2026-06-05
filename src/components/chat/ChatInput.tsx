"use client";

/**
 * Chat composer with image support.
 *
 * Three ways to attach an image:
 *   - paperclip button → file picker
 *   - drag-and-drop on the input area
 *   - paste from clipboard into the textarea
 *
 * One image per message in v1. The image stages in `ImagePreviewCard`
 * before send; the caller (a chat view) receives a normalised
 * `onSend({ text, image? })` object.
 *
 * The compose surface itself stays text-first. The textarea Enter
 * behaviour (Enter = send, Shift+Enter = newline) is unchanged from
 * the previous text-only version.
 */

import React, {
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import { ImagePlus, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Id } from "@convex/_generated/dataModel";
import {
  ChatImageValidationError,
  CHAT_IMAGE_CONSTRAINTS,
  useChatImageUpload,
  type UploadedImage,
} from "@/lib/chat/imageUpload";
import { ImagePreviewCard } from "./ImagePreviewCard";

export interface SendPayload {
  text: string;
  image: UploadedImage | null;
}

interface Props {
  onSend: (payload: SendPayload) => void;
  typingUsers: string[];
  placeholder?: string;
}

const ChatInput: React.FC<Props> = memo(({
  onSend,
  typingUsers,
  placeholder = "Type a message…",
}) => {
  const [message, setMessage] = useState("");
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useChatImageUpload();

  const stageFile = useCallback((file: File) => {
    setError(null);
    if (!CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME.includes(file.type as any)) {
      setError("Only JPG, PNG, WebP, or GIF, please.");
      return;
    }
    if (file.size > CHAT_IMAGE_CONSTRAINTS.MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`Image is ${mb} MB — keep it under 5 MB.`);
      return;
    }
    setStagedFile(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed && !stagedFile) return;
    if (uploading) return;

    let uploadedImage: UploadedImage | null = null;

    if (stagedFile) {
      setUploading(true);
      try {
        uploadedImage = await upload(stagedFile);
      } catch (err) {
        if (err instanceof ChatImageValidationError) {
          setError(err.message);
        } else {
          setError("Couldn't upload that image. Try again.");
        }
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend({ text: trimmed, image: uploadedImage });
    setMessage("");
    setStagedFile(null);
  }, [message, stagedFile, uploading, upload, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            stageFile(file);
            return;
          }
        }
      }
    },
    [stageFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) stageFile(file);
    },
    [stageFile],
  );

  return (
    <div
      className={`border-t bg-background p-4 transition ${
        isDragging ? "ring-2 ring-indigo-500/40" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {typingUsers.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing…
        </div>
      )}

      {stagedFile && (
        <div className="mb-3">
          <ImagePreviewCard
            file={stagedFile}
            uploading={uploading}
            onRemove={() => setStagedFile(null)}
          />
        </div>
      )}

      {error && (
        <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) stageFile(f);
            e.target.value = "";
          }}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-10 w-10 shrink-0"
          aria-label="Attach image"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="min-h-[40px] max-h-[120px] resize-none"
          disabled={uploading}
        />

        <Button
          onClick={() => void handleSubmit()}
          size="icon"
          className="mb-0 h-10 w-10 shrink-0"
          disabled={(!message.trim() && !stagedFile) || uploading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
