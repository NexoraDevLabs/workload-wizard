'use client';

import { useRef, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getInitials } from './AccountHeroHeader';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ProfilePictureTabProps {
  userName: string;
  avatarUrl: string;
  subject: string;
  onRefreshed: () => void;
}

export function ProfilePictureTab({
  userName,
  avatarUrl,
  subject,
  onRefreshed,
}: ProfilePictureTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.users.generateProfilePictureUploadUrl);
  const updateOwnProfilePicture = useMutation(api.users.updateOwnProfilePicture);

  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5 MB.',
        variant: 'destructive',
      });
      return;
    }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewSrc(e.target?.result as string);
    reader.onerror = () =>
      toast({ title: 'File read error', description: 'Could not read the selected file.', variant: 'destructive' });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDiscard = () => {
    setPendingFile(null);
    setPreviewSrc('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ subject });

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': pendingFile.type },
        body: pendingFile,
      });

      if (!res.ok) throw new Error('Upload failed.');

      const { storageId } = (await res.json()) as { storageId: string };

      await updateOwnProfilePicture({
        subject,
        storageId: storageId as Id<'_storage'>,
      });

      setPendingFile(null);
      setPreviewSrc('');
      onRefreshed();

      toast({
        title: 'Profile picture updated',
        description: 'Your new profile picture has been saved.',
        variant: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefresh = () => {
    onRefreshed();
    toast({
      title: 'Profile picture refreshed',
      description: 'Fetching your latest profile picture.',
      variant: 'success',
    });
  };

  const displaySrc = previewSrc || avatarUrl;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Main upload area */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile Picture</CardTitle>
            <CardDescription>
              This is your in-app profile picture that is associated with your account. You can upload and remove it here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Current/preview */}
            <div className="flex items-center gap-5">
              <Avatar className="h-24 w-24 ring-2 ring-border shadow-sm shrink-0">
                <AvatarImage src={displaySrc} alt={`${userName} profile picture preview`} />
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {previewSrc ? 'Preview — not yet saved' : 'Current profile picture'}
                </p>
                <p>JPG, PNG, GIF or WebP &mdash; max 5 MB.</p>
                {previewSrc && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">
                    Click &ldquo;Upload picture&rdquo; below to save this image.
                  </p>
                )}
              </div>
            </div>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone: drag and drop an image here, or click to browse"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop image here' : 'Drag and drop an image, or click to browse'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, GIF or WebP &mdash; max 5 MB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleFileChange}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!pendingFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Uploading&hellip;
                  </>
                ) : (
                  <>
                    <Camera className="mr-1.5 h-3.5 w-3.5" />
                    Upload picture
                  </>
                )}
              </Button>

              {pendingFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={isUploading}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Discard selection
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isUploading}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guidance */}
      <div>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">About profile pictures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your profile picture is stored in our database and used throughout the
              WorkloadWizard app.
            </p>
            <p>
              Supported formats: <strong className="text-foreground">JPG, PNG, GIF, WebP</strong>.
              Maximum file size: <strong className="text-foreground">5 MB</strong>.
            </p>
            <p>
              After uploading, click <strong className="text-foreground">Refresh</strong> if
              your updated image does not appear immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
