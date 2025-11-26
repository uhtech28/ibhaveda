"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  displayName: string
  className?: string
}

export function AvatarUpload({ currentAvatar, onAvatarChange, displayName, className }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please choose an image under 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please choose an image file")
      return
    }

    try {
      setUploading(true)

      // In a real app, you would upload to a cloud storage service like Cloudinary
      // For now, we'll simulate the upload and return a blob URL for demo purposes
      setTimeout(() => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onAvatarChange(reader.result)
          }
        }
        reader.readAsDataURL(file)
        setUploading(false)
      }, 1500)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className || ''}`}>
      <div className="relative group">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatar} alt={displayName} />
          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={triggerFileInput}
            disabled={uploading}
            className="bg-white/90 hover:bg-white text-black border-0 h-10 w-10 p-0 rounded-full"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <Button variant="outline" onClick={triggerFileInput} disabled={uploading} size="sm">
        {uploading ? "Uploading..." : "Change Avatar"}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        JPG, PNG or GIF. Max size 5MB.<br />
        Click the avatar or use the button to upload.
      </p>
    </div>
  )
}
