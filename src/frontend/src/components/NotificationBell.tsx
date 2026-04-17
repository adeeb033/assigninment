/**
 * NotificationBell — bell icon with unread count badge + dropdown list.
 * Uses shadcn/ui DropdownMenu.
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  Clock,
  Trash2,
  Zap,
} from "lucide-react";
import { useApp, useUnreadNotificationCount } from "../context/AppContext";
import type { AppNotification, NotificationType } from "../types";

// ─── Type icon map ─────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  "start-soon": <Clock className="w-3.5 h-3.5 text-urgency-medium shrink-0" />,
  overdue: (
    <AlertTriangle className="w-3.5 h-3.5 text-urgency-critical shrink-0" />
  ),
  "due-tomorrow": (
    <Calendar className="w-3.5 h-3.5 text-urgency-high shrink-0" />
  ),
  "daily-plan": <Zap className="w-3.5 h-3.5 text-primary shrink-0" />,
};

// ─── Individual notification row ──────────────────────────────────────────────

function NotifRow({ notif }: { notif: AppNotification }) {
  const { dispatch } = useApp();

  return (
    <button
      type="button"
      className={`w-full text-left px-3 py-2.5 flex gap-2.5 rounded-md transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        notif.seen ? "opacity-60" : ""
      }`}
      onClick={() =>
        dispatch({ type: "MARK_SEEN_NOTIFICATION", payload: notif.id })
      }
      data-ocid="notification.item"
      aria-label={notif.message}
    >
      {/* Unseen dot */}
      <span className="relative mt-1 shrink-0">
        {TYPE_ICONS[notif.type]}
        {!notif.seen && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-snug break-words">
          {notif.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notif.scheduledAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </button>
  );
}

// ─── Bell button + dropdown ────────────────────────────────────────────────────

export function NotificationBell() {
  const { state, dispatch } = useApp();
  const unreadCount = useUnreadNotificationCount();

  const recent = state.notifications.slice(0, 10);
  const displayCount = unreadCount > 9 ? "9+" : unreadCount.toString();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          data-ocid="notification.bell_button"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none"
              aria-hidden="true"
            >
              {displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 overflow-hidden"
        data-ocid="notification.dropdown_menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-sm font-semibold font-display text-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
              onClick={() => dispatch({ type: "DISMISS_ALL_NOTIFICATIONS" })}
              data-ocid="notification.mark_all_read_button"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div
          className="max-h-72 overflow-y-auto py-1 px-1"
          data-ocid="notification.list"
        >
          {recent.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-muted-foreground"
              data-ocid="notification.empty_state"
            >
              <Bell className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            recent.map((notif) => <NotifRow key={notif.id} notif={notif} />)
          )}
        </div>

        {/* Footer */}
        {recent.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground hover:text-destructive justify-center gap-1.5"
              onClick={() => dispatch({ type: "DISMISS_ALL_NOTIFICATIONS" })}
              data-ocid="notification.clear_all_button"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
