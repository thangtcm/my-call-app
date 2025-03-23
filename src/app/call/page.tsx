'use client';

import { useEffect, useState } from 'react';
import { loadStringeeClient, getStringeeClient, getStringeeCall } from '../../lib/stringee';

const STRINGEE_SERVER_ADDRS = ['wss://v1.stringee.com:6899/', 'wss://v2.stringee.com:6899/'];

export default function CallPage() {
    const [client, setClient] = useState<any>(null);
    const [userId, setUserId] = useState<string>('');
    const [toUserId, setToUserId] = useState<string>('');
    const [callStatus, setCallStatus] = useState<string>('');
    const [text, setText] = useState<string>(''); // Thêm input cho text

    useEffect(() => {
        if (!userId) {
            setCallStatus('Please enter Your User ID');
            return;
        }

        loadStringeeClient()
            .then(() => {
                const stringeeClient = getStringeeClient(STRINGEE_SERVER_ADDRS);

                fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        stringeeClient.connect(data.token);
                    })
                    .catch((err) => {
                        console.error('Auth error:', err);
                        setCallStatus('Failed to authenticate: ' + err.message);
                    });

                stringeeClient.on('connect', () => {
                    console.log('Connected to Stringee');
                    setClient(stringeeClient);
                    setCallStatus('Connected');
                });

                stringeeClient.on('incomingcall', (incomingCall: any) => {
                    console.log('Incoming call from:', incomingCall.fromNumber);
                    setCallStatus('Incoming call from ' + incomingCall.fromNumber);
                    incomingCall.answer();
                });

                stringeeClient.on('callend', () => {
                    console.log('Call ended');
                    setCallStatus('Call ended');
                });

                return () => {
                    stringeeClient.disconnect();
                };
            })
            .catch((err) => {
                console.error('Failed to load Stringee SDK:', err);
                setCallStatus('Failed to load Stringee SDK: ' + err.message);
            });
    }, [userId]);

    const handleCall = async () => {
        console.log('handleCall running, calling from', userId, 'to', toUserId);
        if (!client || !toUserId || !text) {
            setCallStatus('Please enter To User ID and text');
            return;
        }

        // Tạo audio từ ElevenLabs
        const res = await fetch('/api/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fromUserId: userId, toUserId, text }),
        });
        const { audio } = await res.json();

        const call = getStringeeCall(client, userId, toUserId, false);
        call.makeCall((res: { r: number; message: string }) => {
            console.log('makeCall response:', res);
            if (res.r === 0) {
                setCallStatus('Calling ' + toUserId);
                const audioElement = new Audio(audio); // Phát trực tiếp từ Base64
                audioElement.play();
            } else {
                setCallStatus('Call failed: ' + res.message);
            }
        });

        call.on('statechange', (state: string) => {
            console.log('Call state:', state);
            setCallStatus('Call state: ' + state);
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
                    Stringee App-to-App Calling
                </h1>
                <p className="text-center text-gray-600 mb-4">Status: {callStatus}</p>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Your User ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <input
                        type="text"
                        placeholder="To User ID"
                        value={toUserId}
                        onChange={(e) => setToUserId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <input
                        type="text"
                        placeholder="Message to send"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <button
                        onClick={handleCall}
                        disabled={!client}
                        className={`w-full bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors ${!client ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        Call
                    </button>
                </div>
            </div>
        </div>
    );
}