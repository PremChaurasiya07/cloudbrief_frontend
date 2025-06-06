import React, { useEffect, useRef, useState } from 'react';  
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import { redirect } from 'react-router-dom';
import { title } from 'process';
import { useUserCred } from '@/context/usercred';

const getColorFromEmail = (email: string) => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function CalendarPage() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    attendees: [],
    includeMeetLink: false,
  });
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const {userid}=useUserCred();
  const userId = userid;

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from('email_auth')
      .select('gmail_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) return console.error('Email fetch error:', error);
    const gmailList = data.map((item: any) => item.gmail_id);
    setEmails(gmailList);
    setSelectedEmail(gmailList[0] || null);
  };

  const fetchEvents = async (email = selectedEmail) => {
    if (!email) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/api/auth/calender/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, gmail: email }),
      });
      const data = await response.json();
      const formattedEvents = data.events.map((event: any) => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        extendedProps: {
          description: event.description || '',
          location: event.location || '',
          attendees: event.attendees || [],
          includeMeetLink: event.conferenceData?.entryPoints?.some(p => p.entryPointType === 'video') || false,
        },
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Event fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (selectedEmail) fetchEvents(selectedEmail);
  }, [selectedEmail]);

  const resetForm = () => {
    setFormData({
      title: '',
      start: '',
      end: '',
      description: '',
      location: '',
      attendees: [],
      includeMeetLink: false,
    });
    setSelectedEvent(null);
  };

  const handleDateSelect = (selectInfo) => {
    setFormData(prev => ({ ...prev, start: selectInfo.startStr, end: selectInfo.endStr }));
    setSelectedEvent(null);  // Ensure it's a new event
    setIsOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const { title, start, end, extendedProps } = clickInfo.event;
    setFormData({
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      description: extendedProps.description || '',
      location: extendedProps.location || '',
      attendees: extendedProps.attendees || [],
      includeMeetLink: extendedProps.includeMeetLink || false,
    });
    setSelectedEvent(clickInfo.event);
    setIsOpen(true);
  };

  

  const handleEventDrop = async (dropInfo) => {
    const updatedEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title, // keep the title intact
      start: dropInfo.event.start?.toISOString(),
      end: dropInfo.event.end?.toISOString(),
    };
  
    if (!updatedEvent.id) {
      console.error('Event ID is missing.');
      return; // Early exit if there's no event ID
    }
  
    setLoading(true);
    try {
      // Make sure to include eventId in the request body
      const res = await fetch(`${import.meta.env.VITE_URL}/api/auth/calender/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          gmail: selectedEmail,
          eventId: updatedEvent.id,
          eventDetails: {
            summary: updatedEvent.title,
            startDateTime: updatedEvent.start,
            endDateTime: updatedEvent.end,
          },
        }),
        
      });
  
      if (!res.ok) throw new Error('Update failed');
      await fetchEvents(selectedEmail); // Re-fetch events to reflect changes
    } catch (err) {
      console.error('Event update error:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) return; // Avoid saving empty title
  
    const attendees = formData.attendees.filter(email => typeof email === 'string' && email.trim().length > 0);
    const hasGmail = attendees.some(email => typeof email === 'string' && email.includes('@gmail.com'));
  
    const payload = {
      user_id: userId,
      gmail: selectedEmail,
      eventDetails: {
        summary: formData.title,
        location: formData.location || '',
        description: formData.description || '',
        startDateTime: formData.start,
        endDateTime: formData.end,
        timeZone: 'Asia/Kolkata',
        attendees: attendees,
      },
      includeMeetLink: hasGmail && formData.includeMeetLink,
    };
  
    const endpoint = selectedEvent ? 'edit' : 'create'; // Use edit endpoint if event exists
    const finalPayload = selectedEvent ? { ...payload, eventId: selectedEvent.id } : payload;
  
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_URL}/api/auth/calender/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });
      if (!res.ok) throw new Error('Save failed');
      await fetchEvents(selectedEmail); // Re-fetch events to reflect changes
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_URL}/api/auth/calender/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, gmail: selectedEmail, eventId: selectedEvent.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchEvents(selectedEmail);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 w-full relative">
      <div className="flex items-center gap-2 mb-4">
        {emails.map(email => (
          <div
            key={email}
            onClick={() => setSelectedEmail(email)}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-white font-semibold',
              getColorFromEmail(email),
              email === selectedEmail ? 'ring-2 ring-offset-2 ring-gray-500' : ''
            )}
          >
            {email[0].toUpperCase()}
          </div>
        ))}
        <div
          className="w-9 h-9 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
          onClick={() => window.location.href = "http://localhost:3000/api/auth/gmail/"}
        >
          +
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-700 dark:text-gray-200" />
        </div>
      )}

      <div className="min-h-[calc(100vh-140px)] overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            start: 'prev,next today',
            center: 'title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          initialView="dayGridMonth"
          editable
          selectable
          selectMirror
          dayMaxEvents
          select={handleDateSelect} // Click to create new event
          eventClick={handleEventClick} // Click to edit event
          eventDrop={handleEventDrop} // Handle event drag-and-drop
          events={events}
          ref={calendarRef}
          height="auto"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <Label>Start</Label>
            <Input type="datetime-local" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} />
            <Label>End</Label>
            <Input type="datetime-local" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} />
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            <Label>Location</Label>
            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <Label>Attendees</Label>
            <Input value={formData.attendees.join(',')} onChange={e => setFormData({ ...formData, attendees: e.target.value.split(',') })} />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
            {selectedEvent && (
              <Button onClick={handleDeleteEvent} variant="destructive">Delete</Button>
            )}
            <Button onClick={handleSaveEvent} isLoading={loading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
