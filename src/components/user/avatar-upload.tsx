"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Loader2 } from "lucide-react"

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  displayName: string
  className?: string
}

export function AvatarUpload({ currentAvatar, onAvatarChange, displayName, className }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 File input changed:", event.target.files)

    const file = event.target.files?.[0]
    if (!file) {
      console.log("❌ No file selected")
      return
    }

    console.log("📁 File selected:", file.name, file.type, file.size)

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      console.log("❌ File too large:", file.size, ">", maxSize)
      toast({
        title: "Image too large",
        description: `Your image is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please choose an image under 1MB.`,
        variant: "destructive",
        duration: 5000,
      })
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log("❌ Invalid file type:", file.type)
      toast({
        title: "Invalid file type",
        description: "Please choose an image file (JPG, PNG, or GIF).",
        variant: "destructive",
        duration: 4000,
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setUploading(true)
    console.log("🔄 Starting file read...")

    const reader = new FileReader()

    reader.onload = () => {
      console.log("✅ FileReader completed, result type:", typeof reader.result)
      if (typeof reader.result === 'string') {
        console.log("✅ Setting avatar URL, length:", reader.result.length)
        setPreviewUrl(reader.result)
        onAvatarChange(reader.result)
        setUploading(false)
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated.",
          duration: 3000,
        })
      }
    }

    reader.onerror = (error) => {
      console.error("❌ FileReader error:", error)
      setUploading(false)
      toast({
        title: "Upload failed",
        description: "Failed to read image file. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    }

    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onAvatarChange, toast])

  const triggerFileInput = useCallback(() => {
    console.log("🖱️ Trigger file input clicked")
    if (fileInputRef.current) {
      console.log("🖱️ Clicking hidden input...")
      fileInputRef.current.click()
    } else {
      console.error("❌ fileInputRef is null!")
    }
  }, [])

  // Use preview if available, otherwise use currentAvatar
  const displayedAvatar = previewUrl || currentAvatar

  return (
    <div className={`flex flex-col items-center space-y-4 ${className || ''}`}>
      <div className="relative group">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage src={displayedAvatar} alt={displayName} />
          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay on hover */}
        <div
          className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
          onClick={triggerFileInput}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={triggerFileInput}
        disabled={uploading}
        size="sm"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Change Avatar"
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        JPG, PNG or GIF. Max size 1MB.<br />
        Click the avatar or button to upload.
      </p>
    </div>
  )
}
