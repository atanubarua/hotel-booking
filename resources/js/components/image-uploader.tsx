import { useRef, useState } from 'react';
import { ImagePlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type ExistingImage = {
    id: number;
    path: string;
    order: number;
};

type ImageUploaderProps = {
    existingImages?: ExistingImage[];
    onDeleteExisting?: (id: number) => void;
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
};

export function ImageUploader({
    existingImages = [],
    onDeleteExisting,
    onFilesChange,
    maxFiles = 10,
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newPreviews, setNewPreviews] = useState<{ file: File; url: string }[]>([]);

    const handleFilesSelected = (fileList: FileList | null) => {
        if (!fileList) return;
        const files = Array.from(fileList);
        const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
        setNewPreviews((prev) => [...prev, ...previews]);
        const allFiles = [...newPreviews.map((p) => p.file), ...files];
        onFilesChange(allFiles);
    };

    const removeNewPreview = (index: number) => {
        setNewPreviews((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            onFilesChange(updated.map((p) => p.file));
            return updated;
        });
    };

    return (
        <div className="flex flex-col gap-3">
            <Label>Images</Label>

            {/* Existing images */}
            {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {existingImages.map((img) => {
                        const imageUrl = img.path.startsWith('http') ? img.path : `/storage/${img.path}`;
                        return (
                            <div key={img.id} className="group relative">
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <img
                                        src={imageUrl}
                                        alt="Hotel image"
                                        className="h-24 w-24 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/400x400?text=Error';
                                        }}
                                    />
                                </a>
                                {onDeleteExisting && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteExisting(img.id)}
                                        className="absolute -right-2 -top-2 hidden size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
                                    >
                                        <Trash2Icon className="size-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {newPreviews.map((preview, index) => (
                        <div key={index} className="group relative">
                            <img
                                src={preview.url}
                                alt="Preview"
                                className="h-24 w-24 rounded-lg object-cover border border-dashed"
                            />
                            <button
                                type="button"
                                onClick={() => removeNewPreview(index)}
                                className="absolute -right-2 -top-2 hidden size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
                            >
                                <Trash2Icon className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={(existingImages.length + newPreviews.length) >= maxFiles}
                >
                    <ImagePlusIcon className="mr-2 size-4" />
                    Upload Images
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                    JPEG, PNG, WebP – max 5 MB each. Up to {maxFiles} images.
                </p>
            </div>
        </div>
    );
}
