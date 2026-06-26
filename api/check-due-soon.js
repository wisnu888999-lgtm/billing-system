import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Retrieve environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const lineAccessToken = process.env.LINE_ACCESS_TOKEN
  const lineTargetId = process.env.LINE_TARGET_ID

  if (!supabaseUrl || !supabaseAnonKey || !lineAccessToken || !lineTargetId) {
    return res.status(500).json({ error: 'Missing environment variables in server runtime' })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Query pending invoices with customer information
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .eq('status', 'pending')

    if (error) {
      console.error('Supabase query error:', error)
      return res.status(500).json({ error: error.message })
    }

    // 2. Determine current date in Bangkok timezone
    const today = new Date()
    const todayStr = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })
    const todayDate = new Date(todayStr + 'T00:00:00+07:00')

    const alertsNearDue = []
    const alertsOverdue = []

    for (const inv of invoices) {
      if (!inv.due_date) continue

      const due = new Date(inv.due_date + 'T00:00:00+07:00')
      const diffTime = due.getTime() - todayDate.getTime()
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (days >= 0 && days < 7) {
        const alertText = days === 0 ? 'ครบกำหนดวันนี้ 🚨' : `เหลืออีก ${days} วัน`
        alertsNearDue.push({
          customer: inv.customers?.name || 'ไม่ระบุชื่อ',
          invNumber: inv.invoice_number,
          total: inv.total,
          alertText
        })
      } else if (days < 0) {
        const alertText = `เกินกำหนด ${Math.abs(days)} วัน ⚠️`
        alertsOverdue.push({
          customer: inv.customers?.name || 'ไม่ระบุชื่อ',
          invNumber: inv.invoice_number,
          total: inv.total,
          alertText
        })
      }
    }

    // 3. If no alert matches today's criteria, exit early
    if (alertsNearDue.length === 0 && alertsOverdue.length === 0) {
      return res.status(200).json({ message: 'No due-soon or overdue invoices found today.' })
    }

    // 4. Construct consolidated line message
    let message = `🚨 แจ้งเตือนบิลค้างชำระ (Phurada)\n`
    
    if (alertsNearDue.length > 0) {
      message += `\n📅 [ใกล้ครบกำหนดชำระ - น้อยกว่า 7 วัน]\n`
      alertsNearDue.forEach((a, i) => {
        message += `${i + 1}. ลูกค้า: คุณ ${a.customer}\n`
        message += `   📄 เลขที่บิล: ${a.invNumber}\n`
        message += `   💰 ยอดรวม: ฿${new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(a.total)}\n`
        message += `   🔔 สถานะ: ${a.alertText}\n\n`
      })
    }

    if (alertsOverdue.length > 0) {
      message += `\n⚠️ [เลยกำหนดชำระเงิน]\n`
      alertsOverdue.forEach((a, i) => {
        message += `${i + 1}. ลูกค้า: คุณ ${a.customer}\n`
        message += `   📄 เลขที่บิล: ${a.invNumber}\n`
        message += `   💰 ยอดรวม: ฿${new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(a.total)}\n`
        message += `   🔔 สถานะ: ${a.alertText}\n\n`
      })
    }

    message += `กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียดครับ 🧾\n`
    message += `https://phurada.vercel.app`

    // 5. Send HTTP POST request to LINE API
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify({
        to: lineTargetId,
        messages: [
          {
            type: 'text',
            text: message.trim()
          }
        ]
      })
    })

    const lineResult = await lineResponse.json()
    console.log('LINE API response:', lineResult)

    return res.status(200).json({ 
      success: true, 
      nearDueCount: alertsNearDue.length, 
      overdueCount: alertsOverdue.length, 
      lineResult 
    })
  } catch (err) {
    console.error('Unhandled serverless execution error:', err)
    return res.status(500).json({ error: 'Serverless execution error', details: err.message })
  }
}
