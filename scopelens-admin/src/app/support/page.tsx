"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Ticket {
    id: number;
    subject: string;
    user: string;
    priority: "High" | "Medium" | "Low";
    status: "Open" | "In Progress" | "Resolved";
    created: string;
    description: string;
    responses: { from: string; message: string; time: string }[];
}

const initialTickets: Ticket[] = [
    {
        id: 1, subject: "API rate limit issue", user: "emily@university.edu", priority: "High", status: "Open", created: "2 hours ago",
        description: "We're getting 429 errors when trying to scan documents in bulk. Our subscription should allow 500 scans/month but we're hitting limits after just 50.",
        responses: []
    },
    {
        id: 2, subject: "Bug in PDF parsing", user: "mjohnson@college.edu", priority: "Medium", status: "In Progress", created: "1 day ago",
        description: "Some PDFs with embedded images are not being parsed correctly. The AI detection score shows 0% even for clearly AI-generated content.",
        responses: [
            { from: "Support", message: "We've identified the issue with image-heavy PDFs. Our team is working on a fix.", time: "12 hours ago" }
        ]
    },
    {
        id: 3, subject: "Feature request: Bulk upload", user: "swilliams@school.edu", priority: "Low", status: "Open", created: "2 days ago",
        description: "It would be great to upload multiple files at once instead of one at a time. We have hundreds of essays to scan.",
        responses: []
    },
    {
        id: 4, subject: "Billing inquiry", user: "dlee@institute.edu", priority: "Medium", status: "Resolved", created: "3 days ago",
        description: "I was charged twice for my Pro subscription this month.",
        responses: [
            { from: "Support", message: "Found the duplicate charge. Refund has been initiated.", time: "2 days ago" },
            { from: "User", message: "Received the refund. Thank you!", time: "1 day ago" }
        ]
    },
];

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState("");

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        open: tickets.filter(t => t.status === "Open").length,
        inProgress: tickets.filter(t => t.status === "In Progress").length,
        resolved: tickets.filter(t => t.status === "Resolved").length,
    };

    const handleViewTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setReplyText("");
    };

    const handleSendReply = () => {
        if (!selectedTicket || !replyText.trim()) return;

        const updatedTicket: Ticket = {
            ...selectedTicket,
            status: "In Progress",
            responses: [
                ...selectedTicket.responses,
                { from: "Support", message: replyText, time: "Just now" }
            ]
        };

        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        setReplyText("");
    };

    const handleChangeStatus = (newStatus: Ticket["status"]) => {
        if (!selectedTicket) return;
        const updatedTicket = { ...selectedTicket, status: newStatus };
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
    };

    const handleExport = () => {
        const csv = [
            ["ID", "Subject", "User", "Priority", "Status", "Created"].join(","),
            ...tickets.map(t => [t.id, `"${t.subject}"`, t.user, t.priority, t.status, t.created].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "support-tickets.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Support & Feedback</h1>
                    <p className="text-muted-foreground">Manage support tickets and user feedback</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <span className="material-symbols-outlined mr-2">download</span>
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">Open Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">Resolved This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">Avg Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4h</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
                    <Input
                        placeholder="Search tickets..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {["All", "Open", "In Progress", "Resolved"].map(status => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        onClick={() => setStatusFilter(status)}
                    >
                        {status}
                    </Button>
                ))}
            </div>

            {/* Tickets */}
            <Card>
                <CardHeader>
                    <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTickets.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-muted-foreground">support_agent</span>
                                    <div>
                                        <div className="font-medium">{ticket.subject}</div>
                                        <div className="text-xs text-muted-foreground">{ticket.user} · {ticket.created}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={
                                        ticket.priority === "High" ? "destructive" :
                                            ticket.priority === "Medium" ? "secondary" : "outline"
                                    }>
                                        {ticket.priority}
                                    </Badge>
                                    <Badge variant={
                                        ticket.status === "Open" ? "destructive" :
                                            ticket.status === "In Progress" ? "secondary" : "outline"
                                    }>
                                        {ticket.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                                        <span className="material-symbols-outlined">visibility</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{selectedTicket.subject}</CardTitle>
                                    <CardDescription>{selectedTicket.user} · {selectedTicket.created}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={
                                        selectedTicket.priority === "High" ? "destructive" :
                                            selectedTicket.priority === "Medium" ? "secondary" : "outline"
                                    }>
                                        {selectedTicket.priority}
                                    </Badge>
                                    <select
                                        className="px-2 py-1 rounded-md border bg-background text-sm"
                                        value={selectedTicket.status}
                                        onChange={(e) => handleChangeStatus(e.target.value as Ticket["status"])}
                                    >
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Resolved</option>
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-4">
                            {/* Original message */}
                            <div className="p-4 rounded-lg bg-muted">
                                <div className="text-xs text-muted-foreground mb-2">Original Message</div>
                                <p className="text-sm">{selectedTicket.description}</p>
                            </div>

                            {/* Responses */}
                            {selectedTicket.responses.map((response, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-lg ${response.from === "Support" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
                                >
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {response.from} · {response.time}
                                    </div>
                                    <p className="text-sm">{response.message}</p>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 border-t pt-4">
                            <div className="flex gap-2 w-full">
                                <Input
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                                />
                                <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                                    <span className="material-symbols-outlined">send</span>
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setSelectedTicket(null)} className="w-full">
                                Close
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
