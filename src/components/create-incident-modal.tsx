
'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Incident } from '@/app/incidents/page';

interface CreateIncidentModalProps {
    children: ReactNode;
    onCreate: (newIncident: Omit<Incident, 'id' | 'lastActivity' | 'status'>) => void;
}

export function CreateIncidentModal({ children, onCreate }: CreateIncidentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!title || !description) return;
        onCreate({
            title,
            assignee: assignee || 'Unassigned',
            description,
            alerts: 0,
            relatedAlerts: []
        });
        setIsOpen(false);
        setTitle('');
        setAssignee('');
        setDescription('');
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Incident</DialogTitle>
                    <DialogDescription>
                        Manually create a new incident to begin an investigation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Anomalous outbound traffic from DB-01" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assignee" className="text-right">
                            Assignee
                        </Label>
                        <Input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="col-span-3" placeholder="e.g., j.doe (optional)" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Initial summary of the incident..."/>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>Create Incident</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
