import React from 'react';
import { Plus, LayoutGrid, Clock, MoreVertical, Search, BrainCircuit, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { sileo } from 'sileo';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const boards = [
        { id: '1', name: 'Product Roadmap 2024', nodes: 24, lastEdit: '2h ago' },
        { id: '2', name: 'Marketing Strategy', nodes: 12, lastEdit: 'Yesterday' },
        { id: '3', name: 'New Feature Brainstorm', nodes: 8, lastEdit: '3 days ago' },
    ];

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            sileo.error({ title: 'Logout Failed', description: error.message });
        } else {
            sileo.success({ title: 'Logged out' });
            navigate('/');
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Sidebar Nav (Simplified) */}
            <div className="flex flex-1">
                <aside className="w-64 border-r border-border bg-card/30 p-6 flex flex-col gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-primary-foreground w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Vineforge</span>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                        <button className="flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <LayoutGrid size={18} /> Boards
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-all">
                            <Clock size={18} /> Recent
                        </button>
                    </nav>

                    <div className="pt-6 border-t border-border flex flex-col gap-4">
                        <div className="px-4">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Account</p>
                            <p className="text-sm font-medium truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                        >
                            <LogOut size={18} /> Log out
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-10">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">My Boards</h1>
                            <p className="text-muted-foreground">Manage and organize your brainstorming sessions.</p>
                        </div>
                        <button
                            onClick={() => navigate('/canvas/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} /> New Board
                        </button>
                    </header>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                placeholder="Search boards..."
                                className="w-full pl-11 pr-4 py-2 bg-muted/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map(board => (
                            <div
                                key={board.id}
                                onClick={() => navigate(`/canvas/${board.id}`)}
                                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer relative"
                            >
                                <button className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={16} />
                                </button>
                                <div className="w-12 h-12 bg-muted rounded-lg mb-6 flex items-center justify-center italic text-xs font-bold text-muted-foreground">
                                    IMG
                                </div>
                                <h3 className="text-lg font-bold mb-1">{board.name}</h3>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span>{board.nodes} nodes</span>
                                    <span>•</span>
                                    <span>{board.lastEdit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
