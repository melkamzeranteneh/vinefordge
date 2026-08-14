'use client';

import React, { useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Share2,
    Send,
    X,
    Search,
    MoreVertical,
    BrainCircuit,
    Settings2,
    Workflow,
    BookOpen,
    Box,
    BarChart3,
    TestTubes
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils';
import { TriggerNode, ActionNode } from '@/components/canvas/CustomNodes';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 250, y: 0 },
        data: { label: 'Incoming Call Initiated' },
    },
    {
        id: '1a',
        type: 'action',
        position: { x: 0, y: 100 },
        data: {
            title: 'Call Qualification',
            description: 'Identify caller intent and basic business details.',
            icon: 'workflow',
            color: 'bg-rose-500'
        },
    },
    {
        id: '1b',
        type: 'action',
        position: { x: 450, y: 250 },
        data: {
            title: 'Handle Ineligible Caller',
            description: 'Explain ineligibility and provide guidance.',
            icon: 'workflow',
            color: 'bg-rose-500'
        },
    },
];

const initialEdges = [
    { id: 'e1-1a', source: '1', target: '1a', type: 'smoothstep' },
    { id: 'e1a-1b', source: '1a', target: '1b' },
];

export default function CanvasPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const onConnect = (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds));

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Top Navbar */}
            <header className="h-14 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-primary-foreground w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-tight hidden sm:block">Vineforge</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1">
                        {['Agents', 'Workflows', 'Knowledge', 'Integrations', 'Analytics', 'Test'].map((item, i) => (
                            <button
                                key={item}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                                    i === 1 ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors">
                        <Share2 size={16} /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
                        <Send size={16} /> Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 flex min-h-0 relative">
                {/* Canvas Area */}
                <div className="flex-1 relative h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        colorMode="dark"
                    >
                        <Background color="#2b1f4d" gap={20} />
                        <Controls position="top-right" className="bg-background border-border" />
                    </ReactFlow>
                </div>

                {/* Configuration Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: 320 }}
                            animate={{ x: 0 }}
                            exit={{ x: 320 }}
                            className="w-80 h-full border-l border-border bg-background shrink-0 flex flex-col z-30 shadow-2xl shadow-purple-500/10"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h2 className="font-bold text-lg">Configuration</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
                                {/* Header Icon + Title */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-white">
                                        <Workflow size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Handle Ineligible Caller</h3>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-border">
                                    {['Purpose', 'Behavior', 'Rules', 'Resources'].map((tab, i) => (
                                        <button
                                            key={tab}
                                            className={cn(
                                                "flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors",
                                                i === 0 ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Step name</label>
                                        <input
                                            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="Handle Ineligible Caller"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">What this step is responsible for</label>
                                        <textarea
                                            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary min-h-[160px] resize-none"
                                            placeholder="Politely inform the caller that they are not eligible..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute right-4 top-4 z-40 p-2 bg-background border border-border rounded-lg shadow-lg hover:bg-muted text-muted-foreground"
                    >
                        <Settings2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
