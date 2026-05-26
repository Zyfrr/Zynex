import {
  Archive,
  ChevronDown,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pin,
  Trash2
} from "lucide-react";
import type { ReactNode } from "react";

export function SidebarSection({
  collapsed,
  icon,
  title,
  open,
  onToggle,
  actionIcon
}: {
  collapsed: boolean;
  icon: ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  actionIcon?: ReactNode;
}) {
  if (collapsed) {
    return (
      <button className="mb-1 grid h-10 w-full place-items-center rounded-xl text-[#6B7280] hover:bg-[#F3F5FA] hover:text-[#4F46E5]">
        {icon}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between px-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-2 font-body text-sm font-bold text-[#253248]"
      >
        {icon}
        <span>{title}</span>
        <ChevronDown size={15} className={`transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {actionIcon && (
        <button className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F3F5FA] hover:text-[#4F46E5]">
          {actionIcon}
        </button>
      )}
    </div>
  );
}

export function ListRow({
  collapsed,
  title,
  leadingIcon,
  activeMenu,
  setActiveMenu,
  active = false,
  onClick,
  onPin,
  onRename,
  onDelete
}: {
  collapsed: boolean;
  title: string;
  leadingIcon: ReactNode;
  activeMenu: string | null;
  setActiveMenu: (value: string | null) => void;
  active?: boolean;
  onClick?: () => void;
  onPin?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  if (collapsed) {
    return (
      <button onClick={onClick} className="grid h-10 w-full place-items-center rounded-xl text-[#6B7280] hover:bg-[#F3F5FA] hover:text-[#4F46E5]">
        {leadingIcon}
      </button>
    );
  }

  return (
    <div className="group relative flex h-10 items-center gap-2 rounded-xl px-3 text-[#4C596C] transition hover:bg-[#F3F5FA] hover:text-[#111827]">
      <button type="button" aria-label={`Open ${title}`} onClick={onClick} className="absolute inset-0 rounded-xl" />
      <span className="shrink-0 text-[#6B7280]">{leadingIcon}</span>
      <span className="min-w-0 flex-1 truncate font-body text-[13px] font-medium">{title}</span>
      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
      <button
        type="button"
        aria-label={`Actions for ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          setActiveMenu(activeMenu === title ? null : title);
        }}
        className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#8A94A6] opacity-0 transition hover:bg-white hover:text-[#4F46E5] group-hover:opacity-100"
      >
        <MoreHorizontal size={16} />
      </button>
      {activeMenu === title && (
        <div className="absolute right-2 top-9 z-30 w-44 rounded-xl border border-[#E8EEF7] bg-white p-1.5 shadow-2xl shadow-slate-900/12">
          <MenuAction icon={<Pin size={14} />} label="Pin to top" onClick={onPin} />
          <MenuAction icon={<FolderOpen size={14} />} label="Open" onClick={onClick} />
          <MenuAction icon={<Archive size={14} />} label="Rename" onClick={onRename} />
          <MenuAction icon={<Trash2 size={14} />} label="Delete" danger onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

export function MenuAction({
  icon,
  label,
  danger = false,
  onClick
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-body text-xs font-semibold ${
        danger ? "text-red-600 hover:bg-red-50" : "text-[#4C596C] hover:bg-[#F3F5FA] hover:text-[#4F46E5]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function projectIcon(open: boolean) {
  return open ? <FolderOpen size={16} /> : <Folder size={16} />;
}
