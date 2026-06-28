"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { mockCalendarEvents } from "@/lib/mock-data";

const eventColors: Record<string, string> = {
  Class: "bg-[#7367f0]/20 text-[#7367f0] border-l-2 border-[#7367f0]",
  Personal: "bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-500",
  Workshop: "bg-amber-500/20 text-[#ff9f43] border-l-2 border-amber-500",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 1));
  const [open, setOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsThisMonth = mockCalendarEvents.filter(
    (e) => e.start.getMonth() === month && e.start.getFullYear() === year
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Schedule and manage gym sessions, classes, and events"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Add Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Event Title</Label><Input placeholder="e.g. Group HIIT Class" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Date</Label><Input type="date" /></div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Class">Class</SelectItem>
                        <SelectItem value="Personal">Personal Training</SelectItem>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" /></div>
                  <div className="space-y-1.5"><Label>End Time</Label><Input type="time" /></div>
                </div>
                <div className="space-y-1.5"><Label>Trainer</Label><Input placeholder="Select trainer" /></div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Add Event</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <motion.div className="xl:col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = eventsThisMonth.filter((e) => e.start.getDate() === day);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month;
                  return (
                    <motion.div
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      className={`min-h-[48px] rounded-lg p-1 cursor-pointer transition-colors ${isToday ? "bg-[#7367f0]/20 border border-[#7367f0]/40" : "hover:bg-muted/50"}`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isToday ? "text-[#7367f0]" : "text-muted-foreground"}`}>{day}</p>
                      {dayEvents.map((ev) => (
                        <div key={ev.id} className={`text-[10px] px-1 py-0.5 rounded truncate mb-0.5 ${eventColors[ev.type]}`}>
                          {ev.title}
                        </div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCalendarEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`p-3 rounded-lg text-sm ${eventColors[event.type]}`}
                  >
                    <p className="font-medium leading-tight">{event.title}</p>
                    <p className="text-xs opacity-70 mt-1">{event.trainer}</p>
                    <p className="text-xs opacity-70">
                      {event.start.toLocaleDateString()} · {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0">{event.type}</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
