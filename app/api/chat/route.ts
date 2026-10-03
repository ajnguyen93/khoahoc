import { systemInstruction } from "@/lib/qna";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

interface ChatTurn {
  from: "bot" | "user";
  text: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Chưa cấu hình GEMINI_API_KEY trong .env.local" },
      { status: 500 },
    );
  }

  const { messages } = (await request.json()) as { messages?: ChatTurn[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Thiếu nội dung tin nhắn" }, { status: 400 });
  }

  // Gemini yêu cầu lượt đầu là "user", nên bỏ lời chào của bot ở đầu hội thoại.
  const turns = messages.slice(-20);
  const firstUser = turns.findIndex((m) => m.from === "user");
  const contents = turns.slice(Math.max(firstUser, 0)).map((m) => ({
    role: m.from === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { temperature: 0.2 },
    }),
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  // Gemini thỉnh thoảng quá tải (503) hoặc giới hạn tốc độ (429): thử lại vài lần.
  let res = await fetch(url, init);
  for (let attempt = 1; attempt <= 3 && (res.status === 503 || res.status === 429); attempt++) {
    await new Promise((r) => setTimeout(r, attempt * 1500));
    res = await fetch(url, init);
  }

  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return Response.json({ error: "Gemini không phản hồi được" }, { status: 502 });
  }

  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  return Response.json({ reply: text?.trim() || "Mình chưa trả lời được, bạn thử lại nhé." });
}
