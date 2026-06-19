import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/contexts/SocketContext";
import { MessageSquare, Users, User, LayoutDashboard, LogOut, Sun, Moon, Shield, Circle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BACKEND_URL } from "@/lib/apiClient";

function NavItem({ to, icon: Icon, label, testid, onClick }) {
    return (
        <NavLink
            to={to}
            data-testid={testid}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-200 ${
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
            }
        >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
}

export default function AppLayout() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const { connected } = useSocket();
    const nav = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isAdmin = user && ["admin", "super_admin"].includes(user.role);

    if (!user) return null;

    // ── Detect if a specific chat is open on mobile ───────────────────────
    // Route is /chat/:chatId — if pathname has a segment after /chat/ a chat is open.
    // useLocation() works everywhere regardless of route nesting.
    const pathParts = location.pathname.split("/").filter(Boolean);
    // e.g. ["chat", "abc-123"]  → chatId = "abc-123"
    //      ["chat"]             → no chatId
    const chatOpenOnMobile = pathParts[0] === "chat" && pathParts.length >= 2;

    const SidebarContent = ({ onNavigate }) => (
        <>
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-accent/10 border border-accent/40 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-accent" strokeWidth={2.2} />
                    </div>
                    <div>
                        <div className="font-heading font-black text-sm leading-none">DRDO SECURE</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">LAN COMMS</div>
                    </div>
                </div>
                <Button
                    data-testid="drawer-close-btn"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:hidden"
                    onClick={() => setDrawerOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
                <NavItem to="/chat" icon={MessageSquare} label="Chats" testid="nav-chats" onClick={onNavigate} />
                <NavItem to="/directory" icon={Users} label="Directory" testid="nav-directory" onClick={onNavigate} />
                <NavItem to="/profile" icon={User} label="Profile" testid="nav-profile" onClick={onNavigate} />
                {isAdmin && <NavItem to="/admin" icon={LayoutDashboard} label="Admin" testid="nav-admin" onClick={onNavigate} />}
            </nav>
            <div className="p-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                        <Circle className={`h-2 w-2 ${connected ? "fill-success text-success animate-pulse-dot" : "fill-muted-foreground text-muted-foreground"}`} />
                        <span className="text-muted-foreground">{connected ? "LIVE" : "OFFLINE"}</span>
                    </div>
                    <Button data-testid="theme-toggle-btn" variant="ghost" size="icon" className="h-7 w-7" onClick={toggle}>
                        {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    </Button>
                </div>
                <div
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => { nav("/profile"); onNavigate?.(); }}
                >
                    <Avatar className="h-8 w-8 border border-border">
                        {user.profile_picture && <AvatarImage src={`${BACKEND_URL}${user.profile_picture}`} />}
                        <AvatarFallback className="text-xs font-mono bg-muted">
                            {user.full_name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{user.full_name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">{user.employee_id}</div>
                    </div>
                    <Button
                        data-testid="logout-btn"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); logout(); }}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex bg-background overflow-hidden" style={{ height: "100dvh" }}>

            {/* ── Desktop sidebar — always visible on md+ ── */}
            <aside className="hidden md:flex w-60 border-r border-border bg-card flex-col shrink-0">
                <SidebarContent />
            </aside>

            {/* ── Mobile drawer overlay ── */}
            {drawerOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 flex"
                    onClick={() => setDrawerOpen(false)}
                >
                    <aside
                        className="w-64 max-w-[80vw] border-r border-border bg-card flex flex-col h-full animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
                    </aside>
                    <div className="flex-1 bg-black/50" />
                </div>
            )}

            {/* ── Main content area ── */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                {/*
                  Mobile top bar:
                  - Hidden when a chat is open (ChatPage shows its own header with back arrow)
                  - Visible on the chat list screen
                  - Never shown on desktop (md:hidden)
                */}
                {!chatOpenOnMobile && (
                    <div className="md:hidden shrink-0 h-12 border-b border-border bg-card flex items-center justify-between px-3 z-10">
                        <div className="flex items-center gap-2">
                            <Button
                                data-testid="drawer-toggle-btn"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-accent" />
                                <div className="font-heading font-black text-xs">DRDO SECURE</div>
                            </div>
                        </div>
                        <Circle className={`h-2 w-2 ${connected ? "fill-success text-success" : "fill-muted-foreground text-muted-foreground"}`} />
                    </div>
                )}

                {/*
                  Outlet wrapper:
                  - When chat open on mobile: no top padding, full height for ChatPage
                  - Chat list on mobile: no extra padding needed (top bar is in-flow above)
                  - Desktop: no top padding ever (sidebar handles layout)
                */}
                <main
                    className="flex-1 min-w-0 flex flex-col overflow-hidden"
                    data-testid="main-content"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}