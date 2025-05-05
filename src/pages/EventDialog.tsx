import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  formData,
  setFormData,
}) {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAttendeesChange = (e) => {
    const emails = e.target.value.split(',').map((email) => email.trim());
    setFormData({ ...formData, attendees: emails });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{formData.title ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Title</Label>
            <Input name="title" value={formData.title} onChange={handleChange} />
          </div>
          <div>
            <Label>Description (required)</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div>
            <Label>Location</Label>
            <Input name="location" value={formData.location} onChange={handleChange} />
          </div>
          <div>
            <Label>Start</Label>
            <Input type="datetime-local" name="start" value={formData.start} onChange={handleChange} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="datetime-local" name="end" value={formData.end} onChange={handleChange} />
          </div>
          <div>
            <Label>Attendees (comma-separated emails)</Label>
            <Input
              name="attendees"
              value={formData.attendees.join(', ')}
              onChange={handleAttendeesChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="meet-link"
              checked={formData.includeMeetLink}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, includeMeetLink: !!checked })
              }
            />
            <Label htmlFor="meet-link">Add Google Meet link</Label>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!formData.title || !formData.description}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
