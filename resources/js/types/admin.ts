export type UserRole = 'admin' | 'partner' | 'customer';

export type HotelImageType = {
    id: number;
    path: string;
    order: number;
};

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    createdAt: string;
    status: 'active' | 'inactive' | 'pending';
    hotels?: {
        id: string;
        name: string;
    }[];
};

export type AdminHotel = {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    starRating: number;
    phone: string;
    email: string;
    description: string | null;
    partnerName: string;
    partnerEmail: string;
    roomCount: number;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    serial: number;
    images: HotelImageType[];
};

export type AdminRoom = {
    id: string;
    hotelId: string;
    hotelName: string;
    name: string;
    type: 'Standard' | 'Deluxe' | 'Suite';
    capacity: number;
    pricePerNight: number;
    status: 'available' | 'occupied' | 'maintenance';
    createdAt: string;
    images: HotelImageType[];
};

export type PartnerHotel = {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    star_rating: number;
    phone: string;
    email: string;
    description: string | null;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    images: HotelImageType[];
};

export type PartnerRoom = {
    id: number;
    hotel_id: number;
    hotel?: PartnerHotel;
    name: string;
    type: 'Standard' | 'Deluxe' | 'Suite';
    capacity: number;
    price_per_night: number;
    effective_price?: number;
    active_price_rule?: string | null;
    status: 'available' | 'occupied' | 'maintenance';
    created_at: string;
    serial: number;
    images: HotelImageType[];
    price_rules?: {
        name: string;
        start_date: string;
        end_date: string;
        adjustment_type: 'fixed' | 'percent' | 'amount';
        adjustment_value: string;
        priority: number;
        is_active: boolean;
    }[];
};

export type PaginatedHotels = {
    data: AdminHotel[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PaginatedPartnerHotels = {
    data: PartnerHotel[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PaginatedRooms = {
    data: PartnerRoom[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PaginatedAdminRooms = {
    data: (PartnerRoom & { hotel_name: string })[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out';

export type AdminBooking = {
    id: string;
    guestName: string;
    guestEmail: string;
    hotelName: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    status: BookingStatus;
    createdAt: string;
};
