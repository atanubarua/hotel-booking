import { Head, router, usePage } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

type Amenity = { id: number; name: string; icon: string; hotels_count: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Amenities', href: '/admin/amenities' },
];

const emptyForm = { name: '', icon: '' };

const ICON_OPTIONS = [
    'Wifi', 'Waves', 'PawPrint', 'Dumbbell', 'Sparkles', 'ParkingCircle',
    'UtensilsCrossed', 'Wind', 'Tv', 'Coffee', 'Bath', 'BedDouble',
    'Car', 'Bus', 'Plane', 'ShieldCheck', 'Flame', 'Snowflake',
    'Sun', 'Moon', 'Leaf', 'Droplets', 'Zap', 'Phone',
    'Luggage', 'ConciergeBell', 'Shirt', 'Baby', 'Accessibility', 'Bike',
];

function AmenityIcon({ name, className }: { name: string; className?: string }) {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
    return Icon ? <Icon className={className} /> : null;
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [search, setSearch] = useState('');
    const filtered = ICON_OPTIONS.filter((n) => n.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="flex flex-col gap-2">
            {value && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <AmenityIcon name={value} className="size-4" />
                    <span className="font-medium">{value}</span>
                    <button
                        type="button"
                        className="ml-auto text-muted-foreground hover:text-foreground"
                        onClick={() => onChange('')}
                    >✕</button>
                </div>
            )}
            <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                    placeholder="Search icons…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                />
            </div>
            <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto rounded-md border p-2">
                {filtered.map((name) => (
                    <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => onChange(name)}
                        className={`flex flex-col items-center gap-1 rounded p-2 text-xs transition-colors hover:bg-muted ${
                            value === name ? 'bg-primary/10 text-primary ring-1 ring-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <AmenityIcon name={name} className="size-4" />
                        <span className="truncate w-full text-center" style={{ fontSize: 9 }}>{name}</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-5 py-4 text-center text-xs text-muted-foreground">No icons match.</p>
                )}
            </div>
        </div>
    );
}

export default function AdminAmenitiesIndex() {
    const { amenities } = usePage<{ amenities: Amenity[] }>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Amenity | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Amenity | null>(null);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setModalOpen(true);
    }

    function openEdit(a: Amenity) {
        setEditing(a);
        setForm({ name: a.name, icon: a.icon });
        setErrors({});
        setModalOpen(true);
    }

    function handleSave() {
        setProcessing(true);
        const url = editing ? `/admin/amenities/${editing.id}` : '/admin/amenities';
        const method = editing ? 'put' : 'post';

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => { setModalOpen(false); setProcessing(false); },
            onError: (e) => { setErrors(e); setProcessing(false); },
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/amenities/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Amenities - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Amenities</h1>
                        <p className="text-muted-foreground text-sm">Manage hotel amenity options</p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <PlusIcon className="size-4 mr-1.5" />
                        Add Amenity
                    </Button>
                </div>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Icon (Lucide)</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hotels</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {amenities.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No amenities yet. Add one to get started.
                                    </td>
                                </tr>
                            )}
                            {amenities.map((a, i) => (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                    <td className="px-4 py-3 font-medium">{a.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <AmenityIcon name={a.icon} className="size-4 text-muted-foreground" />
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.icon}</code>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.hotels_count}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(a)}>
                                                <PencilIcon className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteTarget(a)}
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={(o) => !processing && setModalOpen(o)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Free WiFi"
                            />
                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Icon</Label>
                            <IconPicker value={form.icon} onChange={(v) => setForm((f) => ({ ...f, icon: v }))} />
                            {errors.icon && <p className="text-destructive text-sm">{errors.icon}</p>}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Amenity'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Delete amenity"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? It will be removed from all hotels.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={confirmDelete}
            />
        </AdminLayout>
    );
}
