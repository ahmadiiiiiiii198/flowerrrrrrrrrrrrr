
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const ReservationManager = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    // Load reservations from localStorage
    const savedReservations = localStorage.getItem('reservations');
    if (savedReservations) {
      try {
        setReservations(JSON.parse(savedReservations));
      } catch (e) {
        console.error('Failed to parse saved reservations');
      }
    }
  }, []);

  const handleStatusChange = (id: number, status: 'pending' | 'confirmed' | 'cancelled') => {
    const updatedReservations = reservations.map(reservation =>
      reservation.id === id ? { ...reservation, status } : reservation
    );
    
    setReservations(updatedReservations);
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    
    toast({
      title: "Reservation Updated",
      description: `Reservation has been marked as ${status}`,
    });
  };

  const handleDelete = (id: number) => {
    const updatedReservations = reservations.filter(reservation => reservation.id !== id);
    setReservations(updatedReservations);
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    
    toast({
      title: "Reservation Deleted",
      description: "Reservation has been removed from the system",
    });
  };

  const filteredReservations = filter === 'all' 
    ? reservations 
    : reservations.filter(reservation => reservation.status === filter);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-playfair font-bold text-persian-navy">Reservation Manager</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? "default" : "outline"}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? "bg-persian-gold text-persian-navy" : ""}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? "default" : "outline"}
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? "bg-persian-gold text-persian-navy" : ""}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'confirmed' ? "default" : "outline"}
            onClick={() => setFilter('confirmed')}
            className={filter === 'confirmed' ? "bg-persian-gold text-persian-navy" : ""}
          >
            Confirmed
          </Button>
          <Button
            variant={filter === 'cancelled' ? "default" : "outline"}
            onClick={() => setFilter('cancelled')}
            className={filter === 'cancelled' ? "bg-persian-gold text-persian-navy" : ""}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-8">No {filter !== 'all' ? filter : ''} reservations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className={`
              ${reservation.status === 'pending' ? 'border-l-4 border-yellow-500' : ''}
              ${reservation.status === 'confirmed' ? 'border-l-4 border-green-500' : ''}
              ${reservation.status === 'cancelled' ? 'border-l-4 border-red-500' : ''}
            `}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{reservation.name}</h3>
                    <p className="text-gray-500">{reservation.phone}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <p><strong>Date:</strong> {formatDate(reservation.date)}</p>
                    <p><strong>Time:</strong> {reservation.time}</p>
                    <p><strong>Guests:</strong> {reservation.guests}</p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                        disabled={reservation.status === 'confirmed'}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                        disabled={reservation.status === 'cancelled'}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(reservation.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                {reservation.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{reservation.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationManager;
