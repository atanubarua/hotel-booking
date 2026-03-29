import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, ImageIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Hotels', href: '/admin/hotels' },
    { title: 'Manage Images', href: '#' },
];

type HotelImageType = {
    id: number;
    path: string;
    order: number;
};

type HotelData = {
    id: number;
    name: string;
    city: string;
    country: string;
    images: HotelImageType[];
};

export default function AdminHotelImages() {
    const { hotel } = usePage<{ hotel: HotelData }>().props;
    const [images, setImages] = useState<HotelImageType[]>(hotel.images || []);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<{ file: File; url: string }[]>([]);
    const [deleteIds, setDeleteIds] = useState<number[]>([]);
    const [reorder, setReorder] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [hoveredDeleteId, setHoveredDeleteId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const fileList = e.target.files;
        if (!fileList) return;

        const files = Array.from(fileList);
        const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));

        setNewPreviews((prev) => [...prev, ...previews]);
        setNewFiles((prev) => [...prev, ...files]);

        // Reset the input
        e.target.value = '';
    }

    function removeNewPreview(index: number) {
        setNewPreviews((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            setNewFiles(updated.map((p) => p.file));
            return updated;
        });
    }

    function markForDeletion(id: number) {
        setDeleteIds((prev) => [...prev, id]);
        setImages((prev) => prev.filter((img) => img.id !== id));
    }

    function cancelDelete(id: number) {
        setDeleteIds((prev) => prev.filter((i) => i !== id));
        // Restore the image from original list
        const originalImage = hotel.images.find((img) => img.id === id);
        if (originalImage) {
            setImages((prev) => [...prev, originalImage].sort((a, b) => a.order - b.order));
        }
    }

    function moveImage(fromIndex: number, toIndex: number) {
        const updated = [...images];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setImages(updated);

        // Update reorder array
        setReorder(updated.map((img) => img.id));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();

        // Add new files
        newFiles.forEach((file) => {
            formData.append('images[]', file);
        });

        // Add images to delete
        deleteIds.forEach((id) => {
            formData.append('delete_images[]', String(id));
        });

        // Add reorder
        if (reorder.length > 0) {
            reorder.forEach((id) => {
                formData.append('reorder[]', String(id));
            });
        }

        router.post(`/admin/hotels/${hotel.id}/images`, formData, {
            onSuccess: () => {
                toast.success('Images updated successfully!');
                // Reset new files after successful upload
                setNewFiles([]);
                setNewPreviews([]);
                setDeleteIds([]);
                setReorder([]);
            },
            onError: () => {
                toast.error('Failed to update images. Please check validation or size limits.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${hotel.name} Images - Admin`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/hotels">
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Manage Images - {hotel.name}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {hotel.city}, {hotel.country}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6 max-w-5xl mx-auto">
                    {/* Current Images */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium flex items-center gap-2">
                                <ImageIcon className="size-5" />
                                Current Images ({images.length})
                            </h2>
                        </div>

                        {images.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <ImageIcon className="size-12 mx-auto mb-3 opacity-50" />
                                <p>No images uploaded yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((img, index) => {
                                    const isMarkedForDeletion = deleteIds.includes(img.id);
                                    const imageUrl = img.path.startsWith('http') ? img.path : `/storage/${img.path}`;
                                    return (
                                        <div
                                            key={img.id}
                                            className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                                isMarkedForDeletion
                                                    ? 'border-destructive opacity-50'
                                                    : 'border-border hover:border-primary'
                                            }`}
                                            onClick={() => setPreviewImage(imageUrl)}
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={`Hotel image ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                                                }}
                                            />

                                            {/* Overlay with actions */}
                                            <div
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                                            >
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                                                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                                                        title="Move left"
                                                    >
                                                        <span className="text-lg">←</span>
                                                    </button>
                                                )}
                                                {index < images.length - 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }}
                                                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                                                        title="Move right"
                                                    >
                                                        <span className="text-lg">→</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Delete button - only show on hover */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isMarkedForDeletion
                                                        ? cancelDelete(img.id)
                                                        : setDeleteConfirmId(img.id);
                                                }}
                                                onMouseEnter={() => setHoveredDeleteId(img.id)}
                                                onMouseLeave={() => setHoveredDeleteId(null)}
                                                className={`absolute top-2 right-2 size-8 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center ${
                                                    isMarkedForDeletion
                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                        : hoveredDeleteId === img.id
                                                          ? 'bg-red-500 text-white hover:bg-red-600'
                                                          : 'bg-gray-500 text-white hover:bg-gray-600'
                                                }`}
                                                title={isMarkedForDeletion ? 'Cancel delete' : 'Delete image'}
                                            >
                                                {isMarkedForDeletion ? (
                                                    <span className="text-lg">↩</span>
                                                ) : (
                                                    <Trash2Icon className="size-4" />
                                                )}
                                            </button>

                                            {/* Order badge */}
                                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                                                #{img.order + 1}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upload New Images */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <PlusIcon className="size-5" />
                            Upload New Images
                        </h2>

                        {/* New image previews */}
                        {newPreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                                {newPreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview.url}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewPreview(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <input
                                type="file"
                                id="new-images"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                multiple
                                className="hidden"
                                onChange={handleFilesSelected}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('new-images')?.click()}
                            >
                                <PlusIcon className="size-4 mr-2" />
                                Select Images
                            </Button>
                            <p className="mt-2 text-xs text-muted-foreground">
                                JPEG, PNG, WebP – max 5 MB each
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/hotels">Cancel</Link>
                        </Button>
                    </div>
                </form>

                <ConfirmDialog
                    open={deleteConfirmId !== null}
                    onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                    title="Delete image"
                    description="Are you sure you want to delete this image? This action cannot be undone."
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={() => {
                        if (deleteConfirmId !== null) {
                            markForDeletion(deleteConfirmId);
                            setDeleteConfirmId(null);
                        }
                    }}
                />

                {/* Image Preview Modal */}
                <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none">
                        <DialogTitle className="sr-only">Image Preview</DialogTitle>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                                title="Close"
                            >
                                <XIcon className="size-5" />
                            </button>
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Hotel preview"
                                    className="max-w-full max-h-[85vh] rounded-lg object-contain"
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
