import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, Calendar, X, CheckCheck } from 'lucide-react';
import { Drawer, DrawerHeader, DrawerTitle, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: 'application' | 'interview' | 'job' | 'candidate';
  icon: any;
  title: string;
  message: string;
  time: string;
  read: boolean;
  color: string;
  href: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'application',
    icon: Users,
    title: 'New Application Received',
    message: 'Priya Sharma applied for Senior Full-Stack Engineer with a 94% match score',
    time: '5 min ago',
    read: false,
    color: 'text-brand-400',
    href: '/candidates/cand-1',
  },
  {
    id: '2',
    type: 'interview',
    icon: Calendar,
    title: 'Technical Round Confirmed',
    message: 'Interview with Marcus Chen for Lead Machine Learning Engineer tomorrow at 3:00 PM',
    time: '1 hour ago',
    read: false,
    color: 'text-info-500',
    href: '/interviews',
  },
  {
    id: '3',
    type: 'job',
    icon: Briefcase,
    title: 'High Semantic Match Detected',
    message: '3 candidates exceeded 90% match threshold for Senior DevOps role',
    time: '3 hours ago',
    read: false,
    color: 'text-success-500',
    href: '/matching',
  },
  {
    id: '4',
    type: 'candidate',
    icon: Users,
    title: 'Candidate Profile Shortlisted',
    message: 'David Kim moved to Shortlist stage for Frontend Design Engineer',
    time: 'Yesterday',
    read: true,
    color: 'text-warning-500',
    href: '/candidates/cand-4',
  },
];

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    onClose();
    navigate(item.href);
  };

  return (
    <Drawer open={open} onClose={onClose} side="right">
      <DrawerHeader className="flex items-center justify-between border-b border-surface-300 pb-3">
        <div className="flex items-center gap-2">
          <DrawerTitle>Notifications</DrawerTitle>
          {unreadCount > 0 && <Badge variant="default">{unreadCount} new</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-xs text-surface-600 hover:text-surface-950 h-8 gap-1 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>
      <DrawerContent className="p-2 sm:p-4">
        <div className="space-y-1.5">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleClick(notif)}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-surface-200/80 border border-transparent',
                !notif.read ? 'bg-surface-100 border-surface-300/60' : 'opacity-80'
              )}
            >
              <div className={cn('mt-0.5 shrink-0 p-1.5 rounded-lg bg-surface-200', notif.color)}>
                <notif.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-sm font-medium text-surface-950 truncate">{notif.title}</p>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 ring-4 ring-brand-500/20" />
                  )}
                </div>
                <p className="text-xs text-surface-600 line-clamp-2">{notif.message}</p>
                <p className="text-2xs text-surface-500 mt-1.5">{notif.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
