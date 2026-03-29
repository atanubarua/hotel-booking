import { Link } from '@inertiajs/react';
import { ArrowLeftIcon, CalendarRangeIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { FormEvent } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import type { ExistingImage } from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { PartnerHotel } from '@/types/admin';

export type PriceRuleForm = {
    name: string;
    start_date: string;
    end_date: string;
    adjustment_type: 'fixed' | 'percent' | 'amount';
    adjustment_value: string;
    priority: string;
    is_active: boolean;
};

export type RoomFormData = {
    hotel_id: string;
    name: string;
    type: string;
    capacity: string;
    price_per_night: string;
    status: string;
    images: File[];
    delete_images: number[];
    price_rules: PriceRuleForm[];
};

type RoomFormErrors = Record<string, string | undefined>;

type RoomFormBinding = {
    data: RoomFormData;
    errors: RoomFormErrors;
    processing: boolean;
    setData: {
        (data: RoomFormData): void;
        <K extends keyof RoomFormData>(key: K, value: RoomFormData[K]): void;
    };
};

type AdminRoomFormProps = {
    title: string;
    description: string;
    hotels: Pick<PartnerHotel, 'id' | 'name'>[];
    form: RoomFormBinding;
    existingImages?: ExistingImage[];
    onDeleteExisting?: (id: number) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    submitLabel: string;
    backHref?: string;
    currentEffectivePrice?: number | null;
    activePriceRule?: string | null;
};

const emptyRule = (): PriceRuleForm => ({
    name: '',
    start_date: '',
    end_date: '',
    adjustment_type: 'percent',
    adjustment_value: '',
    priority: '1',
    is_active: true,
});

export function AdminRoomForm({
    title,
    description,
    hotels,
    form,
    existingImages = [],
    onDeleteExisting,
    onSubmit,
    submitLabel,
    backHref = '/admin/rooms',
    currentEffectivePrice,
    activePriceRule,
}: AdminRoomFormProps) {
    const updateRule = <K extends keyof PriceRuleForm>(index: number, key: K, value: PriceRuleForm[K]) => {
        const nextRules = [...form.data.price_rules];
        nextRules[index] = { ...nextRules[index], [key]: value };
        form.setData('price_rules', nextRules);
    };

    const addRule = () => form.setData('price_rules', [...form.data.price_rules, emptyRule()]);

    const removeRule = (index: number) =>
        form.setData(
            'price_rules',
            form.data.price_rules.filter((_, currentIndex) => currentIndex !== index),
        );

    const errorForRule = (index: number, field: keyof PriceRuleForm) =>
        form.errors[`price_rules.${index}.${field}`];

    return (
        <div className="flex h-full flex-1 flex-col gap-6 p-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={backHref}>
                        <ArrowLeftIcon className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="flex max-w-5xl flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Room Information</CardTitle>
                        <CardDescription>Set the room details and base nightly rate.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <Label htmlFor="hotel_id">Hotel</Label>
                            <Select value={form.data.hotel_id} onValueChange={(value) => form.setData('hotel_id', value)}>
                                <SelectTrigger id="hotel_id">
                                    <SelectValue placeholder="Select hotel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hotels.map((hotel) => (
                                        <SelectItem key={hotel.id} value={String(hotel.id)}>
                                            {hotel.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.hotel_id && <p className="text-destructive text-sm">{form.errors.hotel_id}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Room Name</Label>
                            <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Deluxe King" />
                            {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="type">Type</Label>
                            <Select value={form.data.type} onValueChange={(value) => form.setData('type', value)}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                                    <SelectItem value="Suite">Suite</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.type && <p className="text-destructive text-sm">{form.errors.type}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input id="capacity" type="number" min={1} value={form.data.capacity} onChange={(event) => form.setData('capacity', event.target.value)} />
                            {form.errors.capacity && <p className="text-destructive text-sm">{form.errors.capacity}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="price_per_night">Base Price per Night (Tk)</Label>
                            <Input
                                id="price_per_night"
                                type="number"
                                min={0}
                                step={0.01}
                                value={form.data.price_per_night}
                                onChange={(event) => form.setData('price_per_night', event.target.value)}
                                placeholder="0.00"
                            />
                            {form.errors.price_per_night && <p className="text-destructive text-sm">{form.errors.price_per_night}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="status">Status</Label>
                            <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.status && <p className="text-destructive text-sm">{form.errors.status}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarRangeIcon className="size-4" />
                            Seasonal Pricing
                        </CardTitle>
                        <CardDescription>
                            Add date-based pricing rules for peak seasons, holidays, or low-demand periods.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                            <div className="font-medium">Base price: Tk {Number(form.data.price_per_night || 0).toFixed(2)}</div>
                            {typeof currentEffectivePrice === 'number' && (
                                <div className="text-muted-foreground mt-1">
                                    Current effective price: Tk {currentEffectivePrice.toFixed(2)}
                                    {activePriceRule ? ` via ${activePriceRule}` : ''}
                                </div>
                            )}
                        </div>

                        {form.data.price_rules.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                No seasonal rules yet. The room will use its base price until you add one.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {form.data.price_rules.map((rule, index) => (
                                    <div key={index} className="rounded-xl border p-4">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div className="font-medium">Rule {index + 1}</div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(index)}>
                                                <Trash2Icon className="mr-2 size-4" />
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1">
                                                <Label>Rule Name</Label>
                                                <Input value={rule.name} onChange={(event) => updateRule(index, 'name', event.target.value)} placeholder="Eid peak pricing" />
                                                {errorForRule(index, 'name') && <p className="text-destructive text-sm">{errorForRule(index, 'name')}</p>}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label>Start Date</Label>
                                                <Input type="date" value={rule.start_date} onChange={(event) => updateRule(index, 'start_date', event.target.value)} />
                                                {errorForRule(index, 'start_date') && <p className="text-destructive text-sm">{errorForRule(index, 'start_date')}</p>}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label>End Date</Label>
                                                <Input type="date" value={rule.end_date} onChange={(event) => updateRule(index, 'end_date', event.target.value)} />
                                                {errorForRule(index, 'end_date') && <p className="text-destructive text-sm">{errorForRule(index, 'end_date')}</p>}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label>Rule Type</Label>
                                                <Select value={rule.adjustment_type} onValueChange={(value: PriceRuleForm['adjustment_type']) => updateRule(index, 'adjustment_type', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percent">Percent change</SelectItem>
                                                        <SelectItem value="amount">Add / subtract amount</SelectItem>
                                                        <SelectItem value="fixed">Fixed final price</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errorForRule(index, 'adjustment_type') && <p className="text-destructive text-sm">{errorForRule(index, 'adjustment_type')}</p>}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label>
                                                    {rule.adjustment_type === 'percent'
                                                        ? 'Percent'
                                                        : rule.adjustment_type === 'amount'
                                                          ? 'Amount (Tk)'
                                                          : 'Fixed Price (Tk)'}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step={0.01}
                                                    value={rule.adjustment_value}
                                                    onChange={(event) => updateRule(index, 'adjustment_value', event.target.value)}
                                                    placeholder={rule.adjustment_type === 'percent' ? '20 or -35' : '0.00'}
                                                />
                                                {errorForRule(index, 'adjustment_value') && <p className="text-destructive text-sm">{errorForRule(index, 'adjustment_value')}</p>}
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <Label>Priority</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={999}
                                                    value={rule.priority}
                                                    onChange={(event) => updateRule(index, 'priority', event.target.value)}
                                                />
                                                {errorForRule(index, 'priority') && <p className="text-destructive text-sm">{errorForRule(index, 'priority')}</p>}
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        <label className="flex items-center gap-3 text-sm font-medium">
                                            <Checkbox checked={rule.is_active} onCheckedChange={(checked) => updateRule(index, 'is_active', checked === true)} />
                                            Rule is active
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button type="button" variant="outline" onClick={addRule}>
                            <PlusIcon className="mr-2 size-4" />
                            Add Seasonal Rule
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                        <CardDescription>Add up to 10 room images.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ImageUploader
                            existingImages={existingImages}
                            onDeleteExisting={onDeleteExisting}
                            onFilesChange={(files) => form.setData('images', files)}
                            maxFiles={10}
                        />
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving...' : submitLabel}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={backHref}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
