# 📦 สรุปโค้ดระบบจัดการสินค้า (Full CRUD & Management)

ไฟล์นี้สรุปโค้ดทั้งหมดที่จำเป็นสำหรับระบบจัดการสินค้า (Products) ครบทั้งระบบ: เพิ่ม, ลบ, แก้ไข, กรองข้อมูล, อัปโหลดรูปภาพพร้อมบีบอัด และสถิติยอดขาย

---

## 1. โครงสร้าง Database (Supabase Tables)

### ตาราง `products`
| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| `id` | uuid | Primary Key (Default: gen_random_uuid()) |
| `name` | text | ชื่อสินค้า (เช่น "ปูอัดซอง เล็ก 60g") |
| `animal_type` | text | ประเภท (เช่น "ปู", "กุ้ง") |
| `size` | text | ขนาด (เช่น "เล็ก", "ใหญ่") |
| `weight_g` | numeric | น้ำหนักเป็นกรัม |
| `unit` | text | หน่วยนับ (เช่น "ซอง", "กระปุก") |
| `price` | numeric | ราคาขาย |
| `cost` | numeric | ต้นทุน |
| `stock_qty` | integer | จำนวนสต๊อกคงเหลือ |
| `image_url` | text | URL รูปที่บีบอัดแล้ว (400x400) |
| `original_image_url` | text | URL รูปต้นฉบับ |

### ตารางสนับสนุน
- `activity_logs`: เก็บประวัติการ เพิ่ม/ลบ/แก้ไข
- `stock_movements`: เก็บประวัติการเข้า-ออกของสต๊อก
- `invoice_items` & `invoices`: ใช้สำหรับคำนวณสถิติยอดขาย 🔥

---

## 2. DB Functions (lib/db.js)

รวมฟังก์ชันที่ต้องใช้ติดต่อกับ Supabase

```javascript
import { supabase } from './supabase'

// 1. ดึงข้อมูลสินค้าทั้งหมด
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name')
  return data || []
}

// 2. ดึงข้อมูลสินค้าชิ้นเดียว
export async function getProduct(id) {
  const { data } = await supabase.from('products').select('*').eq('id', id).single()
  return data
}

// 3. เพิ่มสินค้าใหม่
export async function createProduct(product) {
  const { data } = await supabase.from('products').insert(product).select().single()
  return data
}

// 4. อัปเดตสินค้า
export async function updateProduct(id, updates) {
  const { data } = await supabase.from('products').update(updates).eq('id', id).select().single()
  return data
}

// 5. ลบสินค้า
export async function deleteProduct(id) {
  return await supabase.from('products').delete().eq('id', id)
}

// 6. อัปโหลดรูปภาพไปยัง Storage
export async function uploadProductImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const { data, error } = await supabase.storage.from('product-images').upload(fileName, file)
  if (error) return null
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
  return urlData.publicUrl
}

// 7. บันทึกประวัติกิจกรรม
export async function logActivity(userId, action, detail = '') {
  await supabase.from('activity_logs').insert({ user_id: userId, action, detail })
}

// 8. ดึงสถิติยอดขาย (Badge 🔥)
export async function getProductSalesStats() {
  // ดึงข้อมูลยอดขายปีนี้เทียบปีที่แล้วจากตาราง invoice_items
  // ... (ดูตรรกะเต็มได้ในไฟล์หลัก) ...
}
```

---

## 3. Image Processing Utility

ฟังก์ชันบีบอัดรูปและ Crop เป็นจัตุรัสก่อนอัปโหลด

```javascript
function compressImage(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
```

---

## 4. Component: ProductList (หน้าแสดงรายการ)

**ฟีเจอร์เด่น:**
- **Inline Edit:** คลิกที่ราคาหรือสต๊อกเพื่อแก้ไขได้ทันทีโดยไม่ต้องเปิดหน้าใหม่
- **Filter & Sort:** คัดกรองตามประเภท/ขนาด และเรียงลำดับตาม ยอดขาย/ราคา/สต๊อก
- **Selection Mode:** เลือกหลายรายการเพื่อลบพร้อมกัน
- **Optimistic Updates:** อัปเดตเลขบนหน้าจอทันทีที่กด Save (ไม่ต้องรอโหลดใหม่)

```jsx
// ส่วนสำคัญของการแก้ไขราคา/สต๊อกแบบรวดเร็ว (Inline)
async function saveStock(product, newQty) {
  setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_qty: newQty } : p)) // อัปเดตหน้าจอก่อนเลย
  await updateProduct(product.id, { stock_qty: newQty })
  await logActivity(userId, 'แก้ไขสต๊อก', `${product.name}: → ${newQty}`)
}
```

---

## 5. Component: ProductForm (หน้าเพิ่ม/แก้ไข)

**ฟีเจอร์เด่น:**
- **Dual Image Upload:** บันทึกทั้งรูปบีบอัด (แสดงผลเร็ว) และรูปต้นฉบับ
- **Searchable Suggestions:** แนะนำ "ประเภท" และ "ขนาด" ที่เคยมีในระบบเพื่อความรวดเร็ว
- **Validation:** ตรวจสอบข้อมูลบังคับก่อนบันทึก

---

## 6. ลำดับการทำงาน (Workflow สำหรับ AI)

1. **การโหลดข้อมูล:** ใช้ `Promise.all` ดึงสินค้าและสถิติยอดขายพร้อมกัน
2. **การเพิ่มสินค้า:**
   - รับไฟล์รูป → บีบอัด → อัปโหลด → ได้ URL
   - บันทึกข้อมูลลงตาราง `products`
   - บันทึกกิจกรรมลง `activity_logs`
3. **การแก้ไขสต๊อก (Inline):**
   - รับค่าใหม่ → อัปเดตตาราง `products` → เพิ่ม record ใน `stock_movements`
4. **การคำนวณ Badge 🔥:**
   - เทียบยอดขาย `qty` จาก `invoice_items` ของปีปัจจุบันกับปีที่แล้ว
   - ถ้าเพิ่มขึ้น ให้แสดง `% การเติบโต`

---

## 💡 คำแนะนำเพิ่มเติมสำหรับเว็บใหม่

- **UI:** ใช้ `grid-cols-2` บนมือถือ และเพิ่มขึ้นตามขนาดหน้าจอ เพื่อให้ดูสวยงาม
- **UX:** เพิ่ม `active:scale-95` ที่ปุ่มเพื่อให้ความรู้สึกตอบสนองที่ดี
- **Performance:** รูปที่บีบอัดเป็น 400x400 จะช่วยให้หน้า Load สินค้าจำนวนมากได้เร็วมาก
