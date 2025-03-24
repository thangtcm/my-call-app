import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";
const callState = new Map<string, number>(); // Đếm số lượt hội thoại

async function sendToDiscord(message: string, data: any = {}) {
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `${message}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
            }),
        });
    } catch (error) {
        console.error("Failed to send Discord log:", error);
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const callId = body.call_id;
    const userSpeech = body.speech?.results?.[0]?.text || "";

    if (!callId) {
        await sendToDiscord("⚠️ Lỗi: Không có `callId`", body);
        return NextResponse.json([{ action: "talk", text: "Có lỗi xảy ra." }]);
    }

    if (!userSpeech) {
        await sendToDiscord("⚠️ Không nhận được giọng nói", { callId, rawData: body });

        return NextResponse.json([
            {
                action: "talk",
                text: "Xin lỗi, tôi không nghe rõ. Bạn có thể nói lại không?",
                voice: "hn_female_thutrang_phrase_48k-hsmm",
            },
            {
                action: "input",
                eventUrl: "https://my-call-app.vercel.app/api/converse",
                type: ["speech"],
                speech: {
                    endOnSilence: 1.5,
                    language: "vi-VN",
                },
            },
        ]);
    }
    await sendToDiscord("🗣️ Khách hàng nói:", { callId, text: userSpeech });

    // Giới hạn số lần hội thoại để tránh vòng lặp
    const count = callState.get(callId) || 0;
    if (count >= 3) {
        callState.delete(callId);
        await sendToDiscord("🔚 Kết thúc hội thoại sau 3 lượt", { callId });
        return NextResponse.json([{ action: "talk", text: "Xin cảm ơn, chúc bạn một ngày tốt lành!" }]);
    }

    callState.set(callId, count + 1);

    return NextResponse.json([{ action: "listen", text: "Vui lòng tiếp tục." }]);
}
