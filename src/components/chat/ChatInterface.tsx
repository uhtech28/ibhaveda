"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Added import
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    MessageCircle,
    Users,
    ChevronLeft,
    MoreHorizontal,
    Search,
    Plus,
    Phone,
    Video,
    Settings,
    Image as ImageIcon,
    Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ChannelSettingsDialog } from "./ChannelSettingsDialog";

const View = {
    COMMUNITIES: "communities",
    CHANNELS: "channels",
    CHAT: "chat",
} as const;

type ViewType = typeof View[keyof typeof View];

interface Community {
    _id: Id<"ideas">;
    name: string;
    description?: string;
}

interface Channel {
    _id: Id<"conversations">;
    name: string;
    lastMessageAt?: number;
}

interface Message {
    _id: Id<"messages">;
    content: string;
    senderName?: string;
    senderAvatar?: string;
    createdAt: number;
    senderId: Id<"users">;
}

export function ChatInterface() {
    const [currentView, setCurrentView] = useState<ViewType>(View.COMMUNITIES);
    const [selectedCommunity, setSelectedCommunity] = useState<{ _id: Id<"ideas">, name: string } | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<{ _id: Id<"conversations">, name: string } | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const { toast } = useToast();

    const communities = useQuery(api.communities.getUserCommunities);
    const channels = useQuery(api.communities.getChannels, selectedCommunity ? { ideaId: selectedCommunity._id } : "skip");
    const messages = useQuery(api.communities.getMessages, selectedChannel ? { conversationId: selectedChannel._id } : "skip");
    const sendMessage = useMutation(api.communities.sendMessage);
    const createChannel = useMutation(api.communities.createChannel);

    // Auto-scroll to bottom of chat
    const scrollRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleCommunityClick = (community: { _id: Id<"ideas">, name: string }) => {
        setSelectedCommunity(community);
        setCurrentView(View.CHANNELS);
    };

    const handleChannelClick = (channel: { _id: Id<"conversations">, name: string }) => {
        setSelectedChannel(channel);
        setCurrentView(View.CHAT);
    };

    const handleBack = () => {
        if (currentView === View.CHAT) {
            setCurrentView(View.CHANNELS);
            setSelectedChannel(null);
        } else if (currentView === View.CHANNELS) {
            setCurrentView(View.COMMUNITIES);
            setSelectedCommunity(null);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputMessage.trim() || !selectedChannel) return;

        try {
            await sendMessage({
                conversationId: selectedChannel._id,
                content: inputMessage,
            });
            setInputMessage("");
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    // --- Views ---

    // 1. Communities View
    const renderCommunities = () => (
        <div className="flex flex-col h-full bg-background w-full max-w-full overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 w-full">
                <h2 className="text-xl font-bold truncate">Communities</h2>
                <Button size="icon" variant="ghost" className="shrink-0"><Plus className="w-5 h-5" /></Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                            <span>Your Communities</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{communities?.length || 0}</span>
                        </div>

                        {communities === undefined ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : communities.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>You haven't joined any communities yet.</p>
                            </div>
                        ) : (
                            communities.map((comm: Community) => (
                                <div
                                    key={comm._id}
                                    onClick={() => handleCommunityClick(comm)}
                                    className="flex items-center gap-4 p-3 bg-card hover:bg-accent/50 rounded-xl cursor-pointer transition-colors border border-border/40 shadow-sm w-full max-w-full overflow-hidden"
                                >
                                    <Avatar className="w-12 h-12 border-2 border-background shrink-0">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comm.name}`} />
                                        <AvatarFallback>{comm.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{comm.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{comm.description}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <Button size="sm" variant="secondary" className="h-7 text-xs">Open</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );

    // 2. Channels View (Community Details)
    const renderChannels = () => (
        <div className="flex flex-col h-full bg-background w-full max-w-full overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 w-full">
                <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2 h-8 w-8 shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedCommunity?.name}`} />
                        <AvatarFallback>{selectedCommunity?.name[0]}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-bold truncate">{selectedCommunity?.name}</h2>
                </div>
                <Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5" /></Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Header / Banner area could go here */}

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Channels</h3>

                        {channels === undefined ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />)}
                            </div>
                        ) : channels.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground text-sm">No channels found.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={async () => {
                                        if (!selectedCommunity) return;
                                        await createChannel({ ideaId: selectedCommunity._id, name: "General" });
                                        await createChannel({ ideaId: selectedCommunity._id, name: "Announcements" });
                                    }}
                                >
                                    Create Defaults
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {channels.map((channel: Channel) => (
                                    <div
                                        key={channel._id}
                                        onClick={() => handleChannelClick(channel)}
                                        className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{channel.name}</h4>
                                            <p className="text-xs text-muted-foreground">Active {formatDistanceToNow(channel.lastMessageAt || Date.now())} ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );

    // 3. Chat View
    const renderChat = () => (
        <div className="flex flex-col h-full bg-background absolute inset-0 z-20 w-full max-w-full overflow-hidden">
            <div className="px-4 py-2 flex items-center gap-2 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 w-full">
                <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2 h-8 w-8 shrink-0">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1 flex flex-col min-w-0">
                    <h2 className="text-base font-bold leading-none truncate">{selectedChannel?.name}</h2>
                    <span className="text-xs text-muted-foreground truncate">{selectedCommunity?.name}</span>
                </div>
                <div className="flex gap-1">
                    {selectedCommunity && selectedChannel && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages === undefined ? (
                        <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg: Message, i: number) => {
                            const isMe = false; // TODO: Compare msg.senderId with current user
                            // We need current user ID. Can get from useQuery(api.users.me) or passed prop

                            return (
                                <div key={msg._id} className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                                    {!isMe && (
                                        <Avatar className="w-8 h-8 mt-1">
                                            <AvatarImage src={msg.senderAvatar} />
                                            <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                                        {!isMe && <span className="text-xs text-muted-foreground ml-1">{msg.senderName}</span>}
                                        <div className={`p-3 rounded-2xl text-sm ${isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground px-1">{formatDistanceToNow(msg.createdAt)} ago</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <Button type="button" size="icon" variant="ghost" onClick={() => toast({ description: "Attachments coming soon!" })} className="h-9 w-9 rounded-full shrink-0 mb-0.5">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 relative">
                        <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Message..."
                            className="w-full rounded-3xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-offset-0 min-h-[38px] max-h-[120px] py-2.5 px-4 resize-none scrollbar-hide text-sm"
                            rows={1}
                        />
                    </div>
                    {inputMessage.trim() ? (
                        <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0 transition-all mb-0.5">
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    ) : (
                        <div className="flex gap-1 shrink-0 mb-0.5">
                            <Button type="button" size="icon" variant="ghost" onClick={() => toast({ description: "Image upload coming soon!" })} className="h-9 w-9 rounded-full"><ImageIcon className="w-5 h-5 text-muted-foreground" /></Button>
                        </div>
                    )}
                </form>
            </div>

            {showSettings && selectedChannel && selectedCommunity && (
                <ChannelSettingsDialog
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    conversationId={selectedChannel._id}
                    ideaId={selectedCommunity._id}
                    onChannelDeleted={handleBack}
                />
            )}
        </div>
    );

    return (
        <div className="h-full relative overflow-hidden bg-background">
            {currentView === View.COMMUNITIES && renderCommunities()}
            {currentView === View.CHANNELS && renderChannels()}
            {currentView === View.CHAT && renderChat()}
        </div>
    );
}

// Wrapper for global access via Sheet
export function GlobalChatSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <MessageCircle className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background hidden group-hover:block" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0 gap-0 border-l border-border/40 shadow-2xl overflow-hidden sm:max-w-md">
                <SheetTitle className="sr-only">Global Chat</SheetTitle>
                <ChatInterface />
            </SheetContent>
        </Sheet>
    );
}

