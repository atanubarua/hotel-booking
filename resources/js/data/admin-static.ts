import type { AdminUser, AdminHotel, AdminRoom, AdminBooking } from '@/types/admin';

export const staticUsers: AdminUser[] = [
    { id: '1', name: 'John Admin', email: 'john@hotelbooking.com', role: 'admin', phone: '+1 555-0100', createdAt: '2024-01-15', status: 'active' },
    { id: '2', name: 'Sarah Partner', email: 'sarah@grandhotel.com', role: 'partner', phone: '+1 555-0101', createdAt: '2024-02-20', status: 'active' },
    { id: '3', name: 'Mike Customer', email: 'mike@email.com', role: 'customer', phone: '+1 555-0102', createdAt: '2024-03-01', status: 'active' },
    { id: '4', name: 'Emma Wilson', email: 'emma@sunsetresort.com', role: 'partner', phone: '+1 555-0103', createdAt: '2024-03-10', status: 'active' },
    { id: '5', name: 'David Brown', email: 'david@email.com', role: 'customer', phone: '+1 555-0104', createdAt: '2024-03-12', status: 'inactive' },
    { id: '6', name: 'Lisa Chen', email: 'lisa@cityinn.com', role: 'partner', phone: '+1 555-0105', createdAt: '2024-04-01', status: 'pending' },
    { id: '7', name: 'James Taylor', email: 'james@email.com', role: 'customer', phone: '+1 555-0106', createdAt: '2024-04-05', status: 'active' },
    { id: '8', name: 'Anna Admin', email: 'anna@hotelbooking.com', role: 'admin', phone: '+1 555-0107', createdAt: '2024-04-10', status: 'active' },
];

export const staticHotels: AdminHotel[] = [
    { id: '1', name: 'Grand Plaza Hotel', address: '123 Main St', city: 'New York', country: 'USA', starRating: 5, partnerName: 'Sarah Partner', roomCount: 120, status: 'active', createdAt: '2024-02-20' },
    { id: '2', name: 'Sunset Beach Resort', address: '456 Ocean Ave', city: 'Miami', country: 'USA', starRating: 4, partnerName: 'Emma Wilson', roomCount: 85, status: 'active', createdAt: '2024-03-10' },
    { id: '3', name: 'City Inn Downtown', address: '789 Business Blvd', city: 'Chicago', country: 'USA', starRating: 3, partnerName: 'Lisa Chen', roomCount: 45, status: 'active', createdAt: '2024-04-01' },
    { id: '4', name: 'Mountain View Lodge', address: '100 Alpine Rd', city: 'Denver', country: 'USA', starRating: 4, partnerName: 'Sarah Partner', roomCount: 30, status: 'inactive', createdAt: '2024-01-25' },
    { id: '5', name: 'Riverside Suites', address: '200 River Dr', city: 'Boston', country: 'USA', starRating: 4, partnerName: 'Emma Wilson', roomCount: 60, status: 'active', createdAt: '2024-03-15' },
];

export const staticRooms: AdminRoom[] = [
    { id: '1', hotelId: '1', hotelName: 'Grand Plaza Hotel', name: 'Deluxe King', type: 'Deluxe', capacity: 2, pricePerNight: 199, status: 'available', createdAt: '2024-02-20' },
    { id: '2', hotelId: '1', hotelName: 'Grand Plaza Hotel', name: 'Executive Suite', type: 'Suite', capacity: 4, pricePerNight: 399, status: 'occupied', createdAt: '2024-02-20' },
    { id: '3', hotelId: '1', hotelName: 'Grand Plaza Hotel', name: 'Standard Twin', type: 'Standard', capacity: 2, pricePerNight: 129, status: 'available', createdAt: '2024-02-21' },
    { id: '4', hotelId: '2', hotelName: 'Sunset Beach Resort', name: 'Ocean View', type: 'Deluxe', capacity: 3, pricePerNight: 249, status: 'available', createdAt: '2024-03-10' },
    { id: '5', hotelId: '2', hotelName: 'Sunset Beach Resort', name: 'Beachfront Suite', type: 'Suite', capacity: 4, pricePerNight: 449, status: 'occupied', createdAt: '2024-03-10' },
    { id: '6', hotelId: '3', hotelName: 'City Inn Downtown', name: 'Business Single', type: 'Standard', capacity: 1, pricePerNight: 99, status: 'available', createdAt: '2024-04-01' },
    { id: '7', hotelId: '3', hotelName: 'City Inn Downtown', name: 'Double Room', type: 'Standard', capacity: 2, pricePerNight: 119, status: 'maintenance', createdAt: '2024-04-01' },
];

export const staticBookings: AdminBooking[] = [
    { id: '1', guestName: 'Mike Customer', guestEmail: 'mike@email.com', hotelName: 'Grand Plaza Hotel', roomName: 'Executive Suite', checkIn: '2024-05-01', checkOut: '2024-05-05', guests: 2, totalAmount: 1596, status: 'confirmed', createdAt: '2024-04-10' },
    { id: '2', guestName: 'David Brown', guestEmail: 'david@email.com', hotelName: 'Sunset Beach Resort', roomName: 'Beachfront Suite', checkIn: '2024-04-20', checkOut: '2024-04-25', guests: 4, totalAmount: 2245, status: 'completed', createdAt: '2024-04-01' },
    { id: '3', guestName: 'James Taylor', guestEmail: 'james@email.com', hotelName: 'Grand Plaza Hotel', roomName: 'Deluxe King', checkIn: '2024-05-10', checkOut: '2024-05-12', guests: 2, totalAmount: 398, status: 'pending', createdAt: '2024-04-12' },
    { id: '4', guestName: 'Emily Davis', guestEmail: 'emily@email.com', hotelName: 'City Inn Downtown', roomName: 'Business Single', checkIn: '2024-04-15', checkOut: '2024-04-17', guests: 1, totalAmount: 198, status: 'checked_in', createdAt: '2024-04-10' },
    { id: '5', guestName: 'Robert Lee', guestEmail: 'robert@email.com', hotelName: 'Riverside Suites', roomName: 'Standard Double', checkIn: '2024-04-01', checkOut: '2024-04-03', guests: 2, totalAmount: 358, status: 'cancelled', createdAt: '2024-03-28' },
];
