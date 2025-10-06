
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

const getSeverityColor = (log: string) => {
    if (log.includes('[CRITICAL]')) return 'bg-red-500';
    if (log.includes('[WARNING]')) return 'bg-yellow-500';
    if (log.includes('[INFO]')) return 'bg-blue-500';
    if (log.includes('[system]')) return 'bg-gray-500';
    return 'bg-gray-400';
};

const getSeverityTextColor = (log: string) => {
    if (log.includes('[CRITICAL]')) return 'text-red-500';
    if (log.includes('[WARNING]')) return 'text-yellow-500';
    if (log.includes('[INFO]')) return 'text-blue-500';
     if (log.includes('[system]')) return 'text-gray-400';
    return 'text-gray-300';
}

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const eventSource = new EventSource('/api/logs/stream');
        eventSource.onmessage = (event) => {
            setLogs((prevLogs) => [event.data, ...prevLogs.slice(0, 199)]); // Keep last 200 logs
        };

        eventSource.onerror = () => {
            // Don't log an error, just close the connection.
            // The browser will automatically try to reconnect.
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="grid gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Live Security Logs</h1>
                <p className="text-muted-foreground">
                    A real-time stream of events from across the environment.
                </p>
            </div>

            <Card className="flex flex-col flex-grow">
                <CardHeader>
                    <CardTitle>Log Stream</CardTitle>
                    <CardDescription>Displaying the latest 200 events.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-0">
                    <ScrollArea className="h-[70vh] flex-grow" ref={scrollAreaRef}>
                        <div className="p-4 font-mono text-xs space-y-2">
                             <AnimatePresence initial={false}>
                                {logs.map((log, index) => (
                                     <motion.div
                                        key={`${log}-${index}`} // Key must be unique
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className={`h-2 w-2 rounded-full ${getSeverityColor(log)}`}></span>
                                        <span className={`flex-shrink-0 ${getSeverityTextColor(log)}`}>{log.substring(0, 24)}</span>
                                        <span className="flex-grow truncate text-foreground/80">{log.substring(25)}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                             {logs.length === 0 && (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Connecting to log stream...
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
