
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, Menu, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useParams } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { supabase } from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import { useUserCred } from '@/context/usercred';
import { decryptMessage } from '../lib/security';

// Extend the Contact interface to include a profile image URL
interface Contact {
    id: string;
    chat_id:string;
    name: string;
    isGroup: boolean;
    timestamp: string;
    profileImageUrl?: string; // New: Optional profile image URL
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    isSenderMatch: boolean;
    sender: string;
}

type ConnectionStatus = 'inactive' | 'connecting' | 'qr_pending' | 'connected' | 'disconnected' | 'expired' | 'error' | 'logged_out';

const WS_SERVER_URL = 'ws://localhost:8081';
const API_BASE_URL = 'http://localhost:3000/api/auth';

const Conversation = () => {
    const { platform } = useParams<{ platform: string }>();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [mobileOpen, setMobileOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);
    const selectedContactRef = useRef(selectedContact);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('inactive');
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState<string>('');
    const [currentPlatformId, setCurrentPlatformId] = useState<string | null>(null);

    const { userid } = useUserCred();
    console.log(userid)
    const USER_ID = userid; 

    const getPlatformEmoji = (platform: string | undefined) => {
        switch (platform) {
            case 'whatsapp': return '💬';
            case 'gmail': return '📧';
            case 'twitter': return '🐦';
            case 'linkedin': return '👔';
            default: return '📱';
        }
    };

    useEffect(() => {
        selectedContactRef.current = selectedContact;
    }, [selectedContact]);

    const setupWebSocket = useCallback(() => {
        if (platform !== 'whatsapp' || !USER_ID) {
            console.log("Not WhatsApp platform or USER_ID missing. Skipping WebSocket setup.");
            if (ws.current) ws.current.close();
            ws.current = null;
            return;
        }

        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) && ws.current.url.includes(`userId=${USER_ID}`)) {
            console.log("WebSocket already open or connecting for this user. Reusing existing connection.");
            if (ws.current.readyState === WebSocket.OPEN) {
                console.log("Requesting status via WS for existing connection.");
                ws.current.send(JSON.stringify({ type: 'request_status' }));
            }
            return;
        }

        if (ws.current) {
            console.log("Closing existing (old/invalid) WebSocket before opening new one.");
            ws.current.close(1000, 'Re-establishing connection');
            ws.current = null;
        }

        console.log(`Attempting to establish new WebSocket connection to: ${WS_SERVER_URL}?userId=${USER_ID}`);
        const newWs = new WebSocket(`${WS_SERVER_URL}?userId=${USER_ID}`);
        ws.current = newWs;

        newWs.onopen = () => {
            console.log('WebSocket connection opened successfully.');
            setConnectionStatus('connecting');
            setConnectionMessage('WebSocket connected. Checking WhatsApp session status...');
            newWs.send(JSON.stringify({ type: 'request_status' }));
        };

        newWs.onmessage = (event) => {
            try {
                const parsedMessage = JSON.parse(event.data);
                console.log("parsed",parsedMessage)
                const type = parsedMessage.type;
                const payload = parsedMessage.payload;
                console.log('Received WebSocket message:', { type, payload });

                if (!payload) {
                    console.warn(`WebSocket message of type '${type}' received without a payload.`, parsedMessage);
                    return;
                }

                switch (type) {
                    case 'status':
                        setConnectionStatus(payload.status);
                        setConnectionMessage(payload.message || null);
                        if (payload.status === 'connected') {
                            setQrCodeData(null);
                            setCurrentPlatformId(payload.platformId);
                            fetchContacts();
                        } else if (payload.status === 'qr_pending') {
                            if (payload.qr) {
                                setQrCodeData(payload.qr);
                            }
                            setCurrentPlatformId(null);
                        } else {
                            setQrCodeData(null);
                            setCurrentPlatformId(null);
                            setContacts([]);
                            setSelectedContact(null);
                            setMessages([]);
                        }
                        break;
                    case 'qr':
                        console.log('WS: Received QR message. Payload:', payload);
                        if (payload.qrCode) {
                            console.log('WS: Setting QR code data:', payload.qrCode);
                            setQrCodeData(payload.qrCode);
                            setConnectionStatus('qr_pending');
                            setConnectionMessage('Scan the QR code to connect WhatsApp.');
                            setCurrentPlatformId(null);
                            setContacts([]);
                            setSelectedContact(null);
                            setMessages([]);
                        } else {
                            console.warn("Received 'qr' message but 'payload.qrCode' is missing or empty.", payload);
                        }
                        break;
                    case 'new_message':
                        // Use the ref to get the *current* selected contact without re-creating setupWebSocket
                        const currentSelectedContact = selectedContactRef.current; // You'd need to define selectedContactRef
                        if (currentSelectedContact && (payload.recipientJid === currentSelectedContact.id || payload.senderJid === currentSelectedContact.id)) {
                            setMessages((prev) => {
                                const newMessage: Message = {
                                    id: payload.id,
                                    content: payload.content,
                                    created_at: payload.created_at,
                                    isSenderMatch: payload.metadata.from_me,
                                    sender: payload.sender || payload.senderJid,
                                    
                                };
                                return [...prev, newMessage];
                            });
                        }
                        fetchContacts(); // Still good to refresh contacts for last message previews
                        break;
                    case 'message_update':
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.id ? { ...msg, content: payload.content } : msg
                            )
                        );
                        break;
                    case 'error':
                        console.error('WebSocket error from server:', payload.message || 'Unknown error');
                        setConnectionStatus('error');
                        setConnectionMessage(`Error: ${payload.message || 'An unknown error occurred.'}`);
                        setQrCodeData(null);
                        setCurrentPlatformId(null);
                        break;
                    default:
                        console.warn('Unknown WebSocket message type:', type, parsedMessage);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        newWs.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('error');
            setConnectionMessage('WebSocket connection error. Attempting to reconnect...');
            setCurrentPlatformId(null);
            newWs.close();
        };

        newWs.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            if (event.code !== 1000) {
                setConnectionStatus('disconnected');
                setConnectionMessage('WebSocket connection closed. Attempting to reconnect in 3 seconds...');
                setCurrentPlatformId(null);
                setQrCodeData(null);
                setTimeout(() => {
                    if (platform === 'whatsapp' && USER_ID) {
                        console.log("Attempting WebSocket auto-reconnect...");
                        setupWebSocket();
                    }
                }, 3000);
            } else {
                console.log("WebSocket closed normally.");
            }
        };
    }, [platform]);

    useEffect(() => {
        setupWebSocket();
        return () => {
            console.log('Component unmounting. Cleaning up WebSocket connection.');
            if (ws.current) {
                ws.current.close(1000, 'Component unmounted');
                ws.current = null;
            }
        };
    }, [setupWebSocket]);

    // Effect to fetch messages and profile picture when selectedContact changes
    useEffect(() => {
        if (selectedContact && platform === 'whatsapp') {
            fetchMessages(USER_ID,selectedContact.chat_id, selectedContact.name,selectedContact.isGroup);
            // fetchProfilePicture(selectedContact.chat_id); // Fetch profile picture for selected contact
        } else if (platform === 'whatsapp' && connectionStatus !== 'connected') {
            setMessages([]);
        }
    }, [selectedContact, platform, connectionStatus]);

    const connectWhatsApp = () => {
        if (platform !== 'whatsapp' || !USER_ID) {
            console.warn("Not WhatsApp platform or USER_ID missing. Cannot initiate connection.");
            return;
        }
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not OPEN. Cannot initiate Baileys connect. Current state:", ws.current?.readyState);
            setConnectionStatus('connecting');
            setConnectionMessage('Establishing WebSocket connection first...');
            if (ws.current?.readyState === WebSocket.CLOSED || !ws.current) {
                setupWebSocket();
            }
            const retryInterval = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    clearInterval(retryInterval);
                    console.log("WebSocket now OPEN, retrying connectWhatsApp...");
                    ws.current.send(JSON.stringify({ type: 'connect_whatsapp', payload: { userId: USER_ID } }));
                    setConnectionStatus('connecting');
                    setConnectionMessage('Requesting WhatsApp connection...');
                    setQrCodeData(null);
                }
            }, 1000);
            return;
        }
        ws.current.send(JSON.stringify({ type: 'connect_whatsapp', payload: { userId: USER_ID } }));
        setConnectionStatus('connecting');
        setConnectionMessage('Requesting WhatsApp connection...');
        setQrCodeData(null);
        console.log('WhatsApp connection request sent via WebSocket.');
    };

    const logoutWhatsApp = () => {
        if (platform !== 'whatsapp' || !USER_ID) return;
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not open, cannot send logout command.");
            setConnectionMessage('WebSocket not connected. Cannot log out.');
            return;
        }
        console.log('Sending logout command via WebSocket...');
        ws.current.send(JSON.stringify({ type: 'logout_whatsapp', payload: { userId: USER_ID } }));
        setConnectionStatus('disconnected');
        setConnectionMessage('Logging out...');
        setQrCodeData(null);
        setCurrentPlatformId(null);
        setContacts([]);
        setSelectedContact(null);
        setMessages([]);
    };

    const fetchContacts = useCallback(async () => {
        const {data:current_user_status,error:err} = await supabase.from('app_user_platformid').select('session_status').eq('user_id', USER_ID).maybeSingle();
        if(err){
            console.error("Error fetching user status:", err);
            setContacts([]);
            setContactsLoading(false);
            return;
        }
        if (
            platform === 'whatsapp' && ( !current_user_status || current_user_status.session_status !== 'connected')
        ) {
            console.log("Skipping contact fetch: WhatsApp not connected or no user ID in Supabase.");
            setContacts([]);
            setContactsLoading(false);
            return;
        }

        try {
            setContactsLoading(true);
            const endpoint = `${API_BASE_URL}/baileys/getcontacts`;
            const response = await fetch(endpoint,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: USER_ID }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Contact[] = await response.json();
            setContacts(data);

            if (data.length > 0 && (!selectedContact || !data.some(c => c.id === selectedContact.id))) {
                setSelectedContact(data[0]);
            } else if (data.length === 0) {
                setSelectedContact(null);
            }
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setContacts([]);
            setSelectedContact(null);
        } finally {
            setContactsLoading(false);
        }
    }, [platform, connectionStatus, selectedContact]);

    const fetchMessages = async (USER_ID:string,chat_id: string, name: string,isgroup:boolean) => {
        
        setMessages([])
        if (!USER_ID || platform !== 'whatsapp') {
            console.log("Skipping message fetch: Not connected to WhatsApp or no user ID.");
            setMessages([]);
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_URL}/api/auth/baileys/getcontacts/fetch_chats`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userid:USER_ID,chat_id, name,isgroup }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            
            const modifiedMessages: Message[] = Array.isArray(data.messages) ? data.messages.map((message: any) => {
                // console.log("Original message from API:", message); // <<< ADD THIS
                return {
                    id: message.chat_id || `api-msg-<span class="math-inline">\{Date\.now\(\)\}\-</span>{Math.random().toString(36).substr(2, 5)}`,
                    content: message.content,
                    created_at: message.created_at,
                    isSenderMatch: message.metadata.from_me, // This is where it's set
                    sender: message.sender,
                };
            }) : [];
            setMessages(modifiedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setMessages([]);
        }
    };

    // New: Function to fetch profile picture for a given contactId
    const fetchProfilePicture = async (contactId: string) => {
        if (platform !== 'whatsapp' || !USER_ID) {
            console.log("Skipping profile picture fetch: Not WhatsApp platform or USER_ID missing.");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_URL}/api/auth/baileys/getprofile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: USER_ID, jid: contactId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.profileImageUrl) {
                    // Update the specific contact in the contacts state with the profile picture URL
                    setContacts(prevContacts =>
                        prevContacts.map(contact =>
                            contact.id === contactId
                                ? { ...contact, profileImageUrl: data.profileImageUrl }
                                : contact
                        )
                    );
                    // Also update the selectedContact if it's the one we just fetched
                    setSelectedContact(prevSelected =>
                        prevSelected && prevSelected.id === contactId
                            ? { ...prevSelected, profileImageUrl: data.profileImageUrl }
                            : prevSelected
                    );
                } else {
                    console.warn(`No profile image URL found for ${contactId}`);
                }
            } else {
                console.warn(`Failed to fetch profile picture for ${contactId}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedContact || platform !== 'whatsapp' || connectionStatus !== 'connected' || !USER_ID) {
            console.warn("Cannot send message: conditions not met.", { newMessage, selectedContact, platform, connectionStatus, USER_ID });
            if (!newMessage.trim()) {
                alert('Message cannot be empty.');
            } else if (!selectedContact) {
                alert('Please select a contact to send a message.');
            } else if (platform !== 'whatsapp' || connectionStatus !== 'connected') {
                alert('WhatsApp is not connected. Please connect to send messages.');
            }
            return;
        }
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMessage: Message = {
            id: tempId,
            content: newMessage.trim(),
            created_at: new Date().toISOString(),
            isSenderMatch: true,
            sender: currentPlatformId || 'You',
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage('');
        try {
            const response = await fetch(`${import.meta.env.VITE_URL}/api/auth/baileys/sendmessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: USER_ID,
                    recipientId: selectedContact.id,
                    messageContent: optimisticMessage.content,
                }),
            });

            if (!response.ok) {
                setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
                const errorData = await response.json();
                throw new Error(`Failed to send message: ${errorData.message || response.statusText}`);
            }
            console.log('Message sent successfully. Waiting for WS confirmation...');
        } catch (err: any) {
            console.error('Error sending message:', err);
            alert(`Error: ${err.message || 'Failed to send message.'}`);
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleContactSelect = (contact: Contact) => {
        setSelectedContact(contact);
        if (isMobile) setMobileOpen(false);
    };

    const formatContactName = (contact: Contact) => {
        return contact.name || contact.id.split('@')[0];
    };

    const Loader = () => (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm">Loading...</p>
        </div>
    );

    const renderWhatsAppConnectionState = () => {
        if (platform !== 'whatsapp') return null;
        let statusText: string = connectionMessage || 'Unknown status.';
        let statusClass: string = "text-muted-foreground";
        let showConnectButton: boolean = false;
        let showQr: boolean = false;
        let showLogoutButton: boolean = false;

        switch (connectionStatus) {
            case 'inactive':
            case 'disconnected':
            case 'expired':
            case 'error':
            case 'logged_out':
                statusText = connectionMessage || 'WhatsApp session not active. Click Connect to begin.';
                statusClass = "text-red-500";
                showConnectButton = true;
                break;
            case 'connecting':
                statusText = connectionMessage || 'Connecting to WhatsApp...';
                statusClass = "text-yellow-500 animate-pulse";
                break;
            case 'qr_pending':
                statusText = connectionMessage || 'Scan QR Code to connect.';
                statusClass = "text-blue-500";
                showQr = true;
                break;
            case 'connected':
                statusText = connectionMessage || 'WhatsApp Connected!';
                statusClass = "text-green-500";
                showLogoutButton = true;
                break;
        }

        return (
            <div className={`p-4 text-center ${statusClass}`}>
                <p className="font-semibold">{statusText}</p>
                {showQr && qrCodeData && (
                    <div className="flex justify-center my-4">
                        <QRCodeCanvas value={qrCodeData} size={256} level="M" includeMargin={true}/>
                    </div>
                )}
                {showConnectButton && (
                    <Button onClick={connectWhatsApp} className="mt-4" disabled={connectionStatus === 'connecting'}>
                        Connect WhatsApp
                    </Button>
                )}
                {/* {showLogoutButton && (
                    <Button onClick={logoutWhatsApp} className="mt-4 bg-red-500 hover:bg-red-600">
                        Logout WhatsApp
                    </Button>
                )} */}
                {connectionStatus === 'connected' && currentPlatformId && (
                    <p className="text-xs mt-2">Connected as: {currentPlatformId.split('@')[0]}</p>
                )}
            </div>
        );
    };

    const renderChatContent = () => {
        if (platform === 'whatsapp' && connectionStatus !== 'connected') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                    <p className="text-lg mb-4">
                        {connectionStatus === 'connecting'
                            ? 'Attempting to connect to WhatsApp...'
                            : 'Please connect your WhatsApp account to view and send messages.'}
                    </p>
                    {renderWhatsAppConnectionState()}
                </div>
            );
        } else if (selectedContact) {
            return (
                <div className="space-y-4">
                    {messages.length > 0 ? messages.slice(-80).map((message) => (
    <div
        key={message.id}
        className={`flex ${message.isSenderMatch ? 'justify-end' : 'justify-start'}`}
    >
        <div
            className={`rounded-lg p-3 max-w-[80%] ${
                message.isSenderMatch
                    ? 'bg-green-300/30 text-right'
                    : 'bg-muted/10 text-left'
            }`}
        >
            {selectedContact.isGroup && message.sender && (
                <p className="font-semibold text-xs text-muted-foreground">
                    {message.sender}
                </p>
            )}
            <p>{message.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
                {new Date(message.created_at).toLocaleString()}
            </p>
        </div>
    </div>
)) : (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4 mt-52">
        {/* <p>No messages for this contact yet. Start a conversation!</p> */}
        <Loader></Loader>
    </div>
)}

                    <div ref={messagesEndRef} />
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                    <p>Select a contact to view messages.</p>
                    {contactsLoading && <Loader />}
                    {!contactsLoading && contacts.length === 0 && connectionStatus === 'connected' && platform === 'whatsapp' && (
                        <p className="mt-2 text-sm">No contacts found. Send a message from WhatsApp to see new chats here.</p>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="flex h-screen w-[96.4vw] fixed top-0 left-14">
            {/* Sidebar */}
            {!isMobile && (
                <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
                    <div className="p-4 border-b">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <div style={{ textAlign: 'center',marginTop:'10px' }}>
                                {connectionStatus === 'connected' && platform === 'whatsapp' && (
                                    <Button onClick={logoutWhatsApp} size='sm' className="mt-4 ml-[5vw] rounded-3xl w-[3.5vw] h-[3.5vh] bg-red-500 text-xs hover:bg-red-600" >
                                        Logout
                                    </Button>
                                )}
                                {connectionStatus === 'connected' && currentPlatformId && (
                                    <p className="text-xs mt-2 pl-[4.5vw]"> {currentPlatformId.split('@')[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-2xl">{getPlatformEmoji(platform)}</span>
                            <h2 className="font-semibold capitalize">{platform}</h2>
                        </div>
                        {/* {platform === 'whatsapp' && (
                            <div className="mt-4 border p-2 rounded-md bg-background/50">
                                {renderWhatsAppConnectionState()}
                            </div>
                        )} */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
                        {contactsLoading ? (
                            <Loader />
                        ) : (
                            contacts.length > 0 ? (
                                contacts.map((contact) => (
                                    <div key={contact.id}>
                                        <div
                                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                                selectedContact?.id === contact.id
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'hover:bg-muted/10'
                                            }`}
                                            onClick={() => handleContactSelect(contact)}
                                        >
                                            {/* Profile image in contact list */}
                                            {contact.profileImageUrl ? (
                                                <img
                                                    src={contact.profileImageUrl}
                                                    alt="Profile"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary text-sm font-bold">
                                                    {formatContactName(contact).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 truncate">
                                                {formatContactName(contact)}
                                            </div>
                                        </div>
                                        <Separator className="my-1" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground mt-4 text-sm">
                                    {platform === 'whatsapp' && connectionStatus !== 'connected'
                                        ? 'WhatsApp not connected or connecting...'
                                        : 'No contacts found.'}
                                </p>
                            )
                        )}
                    </div>
                </div>
            )}
            {isMobile && (
                <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
                    <div className="absolute top-4 left-4 z-10">
                        <DrawerTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </DrawerTrigger>
                    </div>
                    <DrawerContent side="left" className="w-[80%] max-w-sm h-full">
                        <div className="p-4 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">{getPlatformEmoji(platform)}</span>
                                <h2 className="font-semibold capitalize">{platform}</h2>
                            </div>
                            {platform === 'whatsapp' && (
                                <div className="mb-4 border p-2 rounded-md bg-background/50">
                                    {renderWhatsAppConnectionState()}
                                </div>
                            )}
                            {contactsLoading ? (
                                <Loader />
                            ) : (
                                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
                                    {contacts.length > 0 ? (
                                        contacts.map((contact) => (
                                            <div key={contact.id}>
                                                <div
                                                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                                        selectedContact?.id === contact.id
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'hover:bg-muted/10'
                                                    }`}
                                                    onClick={() => handleContactSelect(contact)}
                                                >
                                                    {/* Profile image in mobile contact list */}
                                                    {contact.profileImageUrl ? (
                                                        <img
                                                            src={contact.profileImageUrl}
                                                            alt="Profile"
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary text-sm font-bold">
                                                            {formatContactName(contact).charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 truncate">
                                                        {formatContactName(contact)}
                                                    </div>
                                                </div>
                                                <Separator className="my-1" />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground mt-4 text-sm">
                                            {platform === 'whatsapp' && connectionStatus !== 'connected'
                                                ? 'WhatsApp not connected or connecting...'
                                                : 'No contacts found.'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center p-4 border-b h-16">
                            <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => setMobileOpen(true)}>
                                <Menu className="h-5 w-5" />
                            </Button>
                            {/* Profile image in chat header */}
                            {selectedContact.profileImageUrl ? (
                                <img
                                    src={selectedContact.profileImageUrl}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover mr-2"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary text-lg font-bold mr-2">
                                    {formatContactName(selectedContact).charAt(0).toUpperCase()}
                                </div>
                            )}
                            <h3 className="font-semibold">{formatContactName(selectedContact)}</h3>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
                            {renderChatContent()}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t bg-background">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                    disabled={platform === 'whatsapp' && connectionStatus !== 'connected'}
                                />
                                <Button onClick={handleSendMessage} disabled={platform === 'whatsapp' && connectionStatus !== 'connected'}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                            {platform === 'whatsapp' && connectionStatus !== 'connected' && (
                                <p className="text-sm text-red-500 mt-2 text-center">
                                    You can only send messages when WhatsApp is connected.
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                        {platform === 'whatsapp' && connectionStatus !== 'connected' ? (
                            <>
                                <p className="text-lg mb-4">
                                    {connectionStatus === 'connecting'
                                        ? 'Attempting to connect to WhatsApp...'
                                        : 'Please connect your WhatsApp account to view and send messages.'}
                                </p>
                                {renderWhatsAppConnectionState()}
                            </>
                        ) : (
                            <p className="text-lg">Select a contact to start messaging.</p>
                        )}
                        {contactsLoading && <Loader />}
                        {!contactsLoading && contacts.length === 0 && connectionStatus === 'connected' && platform === 'whatsapp' && (
                            <p className="mt-2 text-sm">No contacts found. Send a message from WhatsApp to see new chats here.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Conversation;