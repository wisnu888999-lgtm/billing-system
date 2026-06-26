import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const lineAccessToken = process.env.LINE_ACCESS_TOKEN
  const lineChannelSecret = process.env.LINE_CHANNEL_SECRET // For optional signature verification

  // 1. Simple validation
  const events = req.body?.events
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid payload structure' })
  }

  try {
    for (const event of events) {
      const replyToken = event.replyToken
      if (!replyToken) continue

      const source = event.source || {}
      const sourceType = source.type // 'user', 'group', 'room'
      const userId = source.userId
      const groupId = source.groupId
      const roomId = source.roomId

      let replyText = ''

      // Handle message events
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = event.message.text.trim()

        if (text === '/groupid') {
          if (sourceType === 'group' && groupId) {
            replyText = `📋 Group ID ของกลุ่มนี้คือ:\n${groupId}`
          } else if (sourceType === 'room' && roomId) {
            replyText = `📋 Room ID ของห้องนี้คือ:\n${roomId}`
          } else {
            replyText = `⚠️ ไม่พบข้อมูลกลุ่มไลน์ (คุณอาจกำลังแชทส่วนตัวกับบอท)\nUser ID ของคุณคือ:\n${userId}`
          }
        } else if (text === '/myid') {
          replyText = `👤 User ID ของคุณคือ:\n${userId}`
        }
      } 
      // Handle join events (when bot joins a group/room)
      else if (event.type === 'join') {
        if (sourceType === 'group' && groupId) {
          replyText = `👋 สวัสดีครับทุกคน! บอท Phurada ยินดีให้บริการครับ\n\nGroup ID สำหรับกลุ่มนี้คือ:\n${groupId}\n\nสามารถคัดลอกรหัสนี้ไปใส่ใน LINE_TARGET_ID เพื่อรับการแจ้งเตือนบิลได้เลยครับ 🧾`
        } else if (sourceType === 'room' && roomId) {
          replyText = `👋 สวัสดีครับ! Room ID สำหรับห้องนี้คือ:\n${roomId}`
        }
      }

      // If we have a reply, send it back to LINE
      if (replyText && lineAccessToken) {
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [
              {
                type: 'text',
                text: replyText
              }
            ]
          })
        })
      }
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error handling webhook event:', err)
    return res.status(500).json({ error: 'Internal server error', details: err.message })
  }
}
