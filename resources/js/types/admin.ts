export type UserRole = 'admin' | 'partner' | 'customer';

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    createdAt: string;
    status: 'active' | 'inactive' | 'pending';
};

export type AdminHotel = {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    starRating: number;
    partnerName: string;
    roomCount: number;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
};

export type AdminRoom = {
    id: string;
    hotelId: string;
    hotelName: string;
    name: string;
    type: string;
    capacity: number;
    pricePerNight: number;
    status: 'available' | 'occupied' | 'maintenance';
    createdAt: string;
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
