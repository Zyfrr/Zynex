import { Clock3, Folder, FolderOpen, LogOut, MessageSquare, Plus, Search, Settings, Sparkles, User, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ListRow, MenuAction, SidebarSection } from "@/components/chat/SidebarMenu";
import { SidebarPanelIcon } from "@/components/chat/SidebarPanelIcon";
import { zynexApi } from "@/lib/api";

type ChatSidebarProps = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  profileOpen: boolean;
  setProfileOpen: (value: boolean) => void;
  projectsOpen: boolean;
  setProjectsOpen: (value: boolean) => void;
  recentOpen: boolean;
  setRecentOpen: (value: boolean) => void;
  activeMenu: string | null;
  setActiveMenu: (value: string | null) => void;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  authenticated: boolean;
  onLoginClick: () => void;
  conversations?: Array<{
    id: string;
    title?: string | null;
    status: "ACTIVE" | "CANCELLED" | "ARCHIVED";
    provider: string;
    model: string;
    pinned?: boolean;
    projectId?: string | null;
    messages?: Array<{ id: string; role: "USER" | "ASSISTANT" | "SYSTEM"; content: string; createdAt: string }>;
  }>;
  projects?: Array<{ id: string; name: string }>;
  activeProjectId?: string | null;
  activeConversationId?: string | null;
  onNewChat?: () => void;
  onCreateProject?: (name: string) => void;
  onSelectProject?: (projectId: string | null) => void;
  onSelectConversation?: (conversation: {
    id: string;
    title?: string | null;
    status: "ACTIVE" | "CANCELLED" | "ARCHIVED";
    provider: string;
    model: string;
    pinned?: boolean;
    projectId?: string | null;
    messages?: Array<{ id: string; role: "USER" | "ASSISTANT" | "SYSTEM"; content: string; createdAt: string }>;
  }) => void;
  onPinConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, title: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
};

export function ChatSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  onMobileClose,
  profileOpen,
  setProfileOpen,
  projectsOpen,
  setProjectsOpen,
  recentOpen,
  setRecentOpen,
  activeMenu,
  setActiveMenu,
  user,
  authenticated,
  onLoginClick,
  conversations = [],
  projects = [],
  activeProjectId,
  activeConversationId,
  onNewChat,
  onCreateProject,
  onSelectProject,
  onSelectConversation,
  onPinConversation,
  onRenameConversation,
  onDeleteConversation
}: ChatSidebarProps) {
  const displayName = user?.name || user?.email || "ZyNex Operator";
  const firstName = getFirstName(displayName);
  const initials = getInitials(displayName);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const visibleConversations = activeProjectId ? conversations.filter((conversation) => conversation.projectId === activeProjectId) : conversations;

  useEffect(() => {
    if (!activeMenu) return;
    function closeMenu() {
      setActiveMenu(null);
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [activeMenu, setActiveMenu]);

  async function logout() {
    try {
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthLogout", { method: "POST" });
    } catch {
      // NextAuth sign-out still clears the frontend session if the API cookie is already gone.
    }
    toast.success("Code: AUTH_LOGOUT", { description: "Message: You have been logged out successfully." });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,300px)] shrink-0 flex-col border-r border-[#E8EEF7] bg-white shadow-2xl shadow-slate-950/15 transition-transform duration-300 md:relative md:z-auto md:shadow-none md:transition-[width] ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } ${
        collapsed ? "md:w-[68px]" : "md:w-[264px]"
      }`}
    >
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#E8EEF7] px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {collapsed ? (
            <div className="group relative">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setCollapsed(false)}
                className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-[#F3F5FA]"
              >
                <img
                  src="/assets/zynex-logos/zynex_favicon.svg"
                  alt="ZyNex"
                  className="absolute h-8 w-8 rounded-full border border-[#E8EEF7] object-cover opacity-100 transition group-hover:opacity-0"
                />
                <SidebarPanelIcon className="absolute h-6 w-6 text-[#4F46E5] opacity-0 transition group-hover:opacity-100" />
              </button>
              <div className="pointer-events-none absolute left-12 top-1/2 z-40 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 font-body text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100">
                Open sidebar
              </div>
            </div>
          ) : (
            <img
              src="/assets/zynex-logos/zynex_favicon.svg"
              alt="ZyNex"
              className="h-8 w-8 rounded-full border border-[#E8EEF7] object-cover"
            />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-[27px] font-bold leading-[0.88] tracking-normal text-[#111827]">
                ZyNex
              </p>
              <p className="mt-1 truncate font-body text-[11px] font-semibold text-[#6B7280]">
                Chat observability
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="group relative">
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setCollapsed(true)}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F5FA] hover:text-[#4F46E5] md:grid"
            >
              <SidebarPanelIcon className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute right-0 top-10 z-40 translate-y-1 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 font-body text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
              Close sidebar
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            aria-label="Close mobile sidebar"
            onClick={onMobileClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F5FA] hover:text-[#4F46E5] md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="shrink-0 border-b border-[#E8EEF7] px-3 py-3">
        <button
          type="button"
          onClick={onNewChat}
          className={`flex h-10 w-full items-center gap-2 rounded-xl bg-[#111827] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#242A33] ${
            collapsed ? "justify-center px-0" : "justify-start"
          }`}
        >
          <Plus size={17} />
          {!collapsed && <span>New chat</span>}
        </button>
        <button
          type="button"
          className={`mt-2 flex h-10 w-full items-center gap-2 rounded-xl border border-[#E8EEF7] bg-[#F8FAFC] px-3 text-sm font-medium text-[#4C596C] transition hover:border-[#D7DFEB] hover:bg-white ${
            collapsed ? "justify-center px-0" : "justify-start"
          }`}
        >
          <Search size={17} />
          {!collapsed && <span>Search chats</span>}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <SidebarSection
          collapsed={collapsed}
          icon={<Folder size={16} />}
          title="Projects"
          open={projectsOpen}
          onToggle={() => setProjectsOpen(!projectsOpen)}
          actionIcon={<Plus size={15} />}
          onAction={() => setProjectModalOpen(true)}
        />
        {projectsOpen && authenticated && (
          <div className="mt-1 space-y-1">
            {!collapsed && projects.length === 0 && <p className="px-3 py-2 font-body text-xs font-medium text-[#8A94A6]">No projects yet. Create a new project from the project action.</p>}
            {projects.length > 0 && (
              <ListRow
                collapsed={collapsed}
                title="All chats"
                leadingIcon={<FolderOpen size={16} />}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                active={!activeProjectId}
                menuId="project-all"
                showActions={false}
                onClick={() => onSelectProject?.(null)}
              />
            )}
            {projects.map((project) => (
              <ListRow
                key={project.id}
                collapsed={collapsed}
                title={project.name}
                leadingIcon={activeProjectId === project.id ? <FolderOpen size={16} /> : <Folder size={16} />}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                active={activeProjectId === project.id}
                menuId={`project-${project.id}`}
                showActions={false}
                onClick={() => onSelectProject?.(project.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-5">
          <SidebarSection
            collapsed={collapsed}
            icon={<Clock3 size={16} />}
            title="Recent"
            open={recentOpen}
            onToggle={() => setRecentOpen(!recentOpen)}
          />
          {recentOpen && (
            <div className="mt-1 space-y-4">
              {visibleConversations.length > 0 && (
                <div>
                  {!collapsed && (
                    <p className="px-3 pb-1 font-body text-[11px] font-semibold text-[#8A94A6]">
                      Saved conversations
                    </p>
                  )}
                  <div className="space-y-1">
                    {visibleConversations.map((conversation) => (
                      <ListRow
                        key={conversation.id}
                        collapsed={collapsed}
                        title={`${conversation.title || "Untitled conversation"}${conversation.status === "CANCELLED" ? " (cancelled)" : ""}`}
                        leadingIcon={<MessageSquare size={16} />}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        active={conversation.id === activeConversationId}
                        pinned={Boolean(conversation.pinned)}
                        menuId={`conversation-${conversation.id}`}
                        onClick={() => onSelectConversation?.(conversation)}
                        onPin={() => onPinConversation?.(conversation.id)}
                        onRename={() => {
                          setRenameTarget({ id: conversation.id, title: conversation.title || "Untitled conversation" });
                          setRenameValue(conversation.title || "Untitled conversation");
                          setActiveMenu(null);
                        }}
                        onDelete={() => onDeleteConversation?.(conversation.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!authenticated && !collapsed && (
                <p className="px-3 py-2 font-body text-xs font-medium text-[#8A94A6]">Login to see your saved conversations.</p>
              )}
              {authenticated && visibleConversations.length === 0 && !collapsed && (
                <p className="px-3 py-2 font-body text-xs font-medium text-[#8A94A6]">No conversations yet. Start a new chat.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative shrink-0 border-t border-[#E8EEF7] p-2.5">
        {authenticated && profileOpen && !collapsed && (
          <div className="absolute bottom-[70px] left-2.5 right-2.5 z-30 rounded-xl border border-[#E8EEF7] bg-white p-1.5 shadow-2xl shadow-slate-900/12">
            <MenuAction icon={<User size={15} />} label="Profile" onClick={() => { window.location.href = "/dashboard?zx=profile"; }} />
            <MenuAction icon={<Settings size={15} />} label="Settings" onClick={() => { window.location.href = "/dashboard?zx=settings"; }} />
            <MenuAction icon={<Sparkles size={15} />} label="Dashboard" onClick={() => { window.location.href = "/dashboard"; }} />
            <MenuAction icon={<LogOut size={15} />} label="Logout" danger onClick={logout} />
          </div>
        )}
        <button
          type="button"
          onClick={() => authenticated ? setProfileOpen(!profileOpen) : onLoginClick()}
          className={`flex w-full items-center gap-2 rounded-xl p-2 transition hover:bg-[#F3F5FA] ${
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#111827] font-body text-xs font-bold text-white">
            {authenticated && user?.image ? (
              <img src={user.image} alt={displayName} className="h-full w-full object-cover" />
            ) : authenticated ? (
              initials
            ) : (
              <User size={17} />
            )}
          </span>
          {!collapsed && (
            <span className="min-w-0 text-left">
              <span className="block truncate font-body text-sm font-semibold text-[#111827]">
                {authenticated ? firstName : "Login"}
              </span>
              <span className="block truncate font-body text-xs font-medium text-[#6B7280]">
                {authenticated ? "Account and settings" : "Access your workspace"}
              </span>
            </span>
          )}
        </button>
      </div>
      {projectModalOpen && !collapsed && (
        <SidebarModal title="Create project" onClose={() => setProjectModalOpen(false)}>
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            autoFocus
            placeholder="Project name"
            className="h-11 w-full rounded-xl border border-[#DDE5F0] px-3 font-body text-sm font-semibold outline-none focus:border-[#4F46E5]"
          />
          <button
            type="button"
            disabled={!projectName.trim()}
            onClick={() => {
              onCreateProject?.(projectName.trim());
              setProjectName("");
              setProjectModalOpen(false);
            }}
            className="mt-3 h-10 w-full rounded-xl bg-[#111827] font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create project
          </button>
        </SidebarModal>
      )}
      {renameTarget && !collapsed && (
        <SidebarModal title="Rename chat" onClose={() => setRenameTarget(null)}>
          <input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            autoFocus
            className="h-11 w-full rounded-xl border border-[#DDE5F0] px-3 font-body text-sm font-semibold outline-none focus:border-[#4F46E5]"
          />
          <button
            type="button"
            disabled={!renameValue.trim()}
            onClick={() => {
              onRenameConversation?.(renameTarget.id, renameValue.trim());
              setRenameTarget(null);
            }}
            className="mt-3 h-10 w-full rounded-xl bg-[#111827] font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save name
          </button>
        </SidebarModal>
      )}
    </aside>
  );
}

function SidebarModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-x-2 bottom-24 z-40 rounded-2xl border border-[#E8EEF7] bg-white p-3 shadow-2xl shadow-slate-900/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-body text-sm font-bold text-[#111827]">{title}</p>
        <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F3F5FA]">
          <X size={15} />
        </button>
      </div>
      {children}
    </div>
  );
}

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) return `${parts[0]?.[0] || "Z"}${parts[parts.length - 1]?.[0] || "N"}`.toUpperCase();

  const fallbackParts = value
    .split(/[ @._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return `${fallbackParts[0]?.[0] || "Z"}${fallbackParts[1]?.[0] || fallbackParts[0]?.[1] || "N"}`.toUpperCase();
}

function getFirstName(value: string) {
  const name = value.trim();
  if (!name) return "ZyNex";
  if (name.includes("@")) return name.split("@")[0] || "ZyNex";
  return name.split(/\s+/)[0] || "ZyNex";
}
