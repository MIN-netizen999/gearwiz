// ============================================================
// Vercel Serverless Function — Anthropic API 프록시
// 파일 위치: /api/chat.js
//
// 역할: 브라우저 → 이 함수 → Anthropic API
//       API 키가 서버에만 존재해 외부에 절대 노출되지 않습니다.
//
// 환경변수 설정 (Vercel 대시보드에서):
//   ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
// ============================================================

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수에서 API 키 읽기 (절대 코드에 직접 넣지 마세요)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.' });
  }

  try {
    // 브라우저에서 받은 요청을 Anthropic API로 그대로 전달
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Anthropic 오류 응답도 그대로 전달
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // CORS 헤더 — 본인 Vercel 도메인에서만 허용하려면 * 대신 도메인 명시
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(data);

  } catch (err) {
    console.error('[GearWiz API Error]', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', detail: err.message });
  }
}
