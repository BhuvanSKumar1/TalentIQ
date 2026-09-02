import { motion } from 'framer-motion';
import { Briefcase, Users, Calendar, X } from 'lucide-react';
import { Drawer, DrawerHeader, DrawerTitle, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const demoNotifications = [
  {
    id: '1',
    type: 'application',
    icon: Users,
    title: 'New Application',
    message: 'Elena Rodriguez applied for Junior React Developer',
    time: '5 min ago',
    read: false,
    color: 'text-brand-400',
  },
  {
    id: '2',
    type: 'interview',
    icon: Calendar,
    title: 'Interview Scheduled',
    message: 'Interview with Priyanka Desai for Senior Full-Stack Engineer',
    time: '1 hour ago',
    read: false,
    color: 'text-info-500',
  },
  {
    id: '3',
    type: 'job',
    icon: Briefcase,
    title: 'Job Published',
    message: 'DevOps Engineer position has been published',
    time: '3 hours ago',
    read: true,
    color: 'text-success-500',
  },
  {
    id: '4',
    type: 'candidate',
    icon: Users,
    title: 'Candidate Shortlisted',
    message: 'Rahul Patel has been shortlisted for Senior Full-Stack Engineer',
    time: 'Yesterday',
    read: true,
    color: 'text-warning-500',
  },
];

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  return (
    <Drawer open={open} onClose={onClose} side="right">
      <DrawerHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DrawerTitle>Notifications</DrawerTitle>
          <Badge variant="default">3 new</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </DrawerHeader>
      <DrawerContent>
        <div className="space-y-1">
          {demoNotifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-surface-200',
                !notif.read && 'bg-surface-200/50'
              )}
            >
              <div className={cn('mt-0.5 shrink-0', notif.color)}>
                <notif.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-surface-950 truncate">{notif.title}</p>
                  {!notif.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-surface-600 line-clamp-2">{notif.message}</p>
                <p className="text-2xs text-surface-500 mt-1">{notif.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
