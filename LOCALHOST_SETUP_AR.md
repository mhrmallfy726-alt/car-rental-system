# تشغيل نظام تأجير السيارات محليًا (Frontend + Backend)

هذا الدليل يشغّل المشروع على جهازك بحيث تكون الواجهة على `http://localhost:3000` والـ API على `http://localhost:5000`، مع قاعدة بيانات PostgreSQL محلية.

## ما الذي تحتاجه؟

- Node.js 22 أو أحدث وnpm.
- PostgreSQL 14 أو أحدث، يعمل على المنفذ `5432`.
- اتصال بالإنترنت لتنزيل حزم npm أول مرة.

## 1) إنشاء قاعدة البيانات

أنشئ قاعدة فارغة باسم `car_rental_db` من pgAdmin، أو نفّذ الأمر التالي من حساب PostgreSQL:

```sql
CREATE DATABASE car_rental_db;
```

تأكد أن خدمة PostgreSQL تعمل، وأنك تعرف اسم المستخدم وكلمة المرور. في كثير من الأجهزة يكون المستخدم `postgres`.

## 2) إعداد Backend

من مجلد المشروع:

**Windows PowerShell:**

```powershell
Copy-Item backend/.env.example backend/.env
```

**macOS / Linux:**

```bash
cp backend/.env.example backend/.env
```

افتح `backend/.env` وحدّث `DB_PASSWORD` لتكون كلمة مرور PostgreSQL المحلية عندك. لا ترفع هذا الملف إلى GitHub.

ثبّت الحزم وشغّل ترحيلات قاعدة البيانات:

```bash
cd backend
npm ci
npm run migrate
```

إذا انتهت الترحيلات بنجاح، شغّل الخادم:

```bash
npm run dev
```

يستمع الخادم على `http://localhost:5000`. اختبره بفتح:

- `http://localhost:5000/health`
- `http://localhost:5000/api/health`

يجب أن يظهر رد JSON يفيد بأن API يعمل.

## 3) إعداد Frontend

اترك نافذة الـ Backend مفتوحة، وافتح نافذة Terminal ثانية في مجلد المشروع.

**Windows PowerShell:**

```powershell
Copy-Item frontend/.env.example frontend/.env
```

**macOS / Linux:**

```bash
cp frontend/.env.example frontend/.env
```

العناوين الموجودة افتراضيًا في المثال هي localhost؛ لا تستبدلها برابط Railway أو Vercel أثناء التطوير المحلي.

```bash
cd frontend
npm ci
npm run dev
```

افتح `http://localhost:3000` في المتصفح. عند الانتهاء، أوقف كل خادم باستخدام `Ctrl+C`.

## 4) تحديث قاعدة البيانات لاحقًا

بعد سحب تعديلات جديدة تتضمن migrations، أوقف الخادم ثم نفّذ:

```bash
cd backend
npm run migrate
```

أمر `npm run dev` يستدعي الترحيلات تلقائيًا أيضًا، لكن تشغيلها يدويًا يساعد في رؤية أخطاء قاعدة البيانات بوضوح.

## الخدمات الاختيارية وحدود التشغيل المحلي

يمكن فتح الواجهة وتشغيل الخادم محليًا دون هذه الخدمات، لكن بعض الوظائف تحتاج مفاتيح إعداد حقيقية:

- التخزين السحابي للصور/المستندات: بيانات Supabase Storage؛ دونها يستخدم التطوير المحلي مجلد `backend/uploads`.
- رسائل التحقق OTP والبريد: مزود البريد مثل Brevo.
- الدفع الإلكتروني: مفاتيح Stripe؛ استخدم وضع الاختبار ولا تضع مفاتيح إنتاجية في المشروع.
- WhatsApp: بيانات Meta WhatsApp Cloud API.
- البحث عن المواقع/الخرائط: مفتاح Geoapify.

عند تشغيل التطوير دون مفاتيح Supabase، تحفظ الملفات الجديدة محليًا تحت `backend/uploads` وتُخدم عبر `/uploads`. أضف Supabase فقط إذا أردت التخزين السحابي. أما البريد والدفع وWhatsApp والبحث الجغرافي فتحتاج إعدادات مزودها لتعمل.

## استكشاف الأخطاء

- **تعذر الاتصال بقاعدة البيانات:** تأكد من تشغيل PostgreSQL، والمنفذ `5432`، وصحة `DB_HOST` و`DB_NAME` و`DB_USER` و`DB_PASSWORD` في `backend/.env`.
- **المنفذ مستخدم:** أغلق التطبيق الآخر الذي يستخدم `3000` أو `5000`، ثم أعد التشغيل.
- **الواجهة تعمل لكن الطلبات تفشل:** تأكد أن Backend يعمل وأن `frontend/.env` يحتوي `VITE_API_URL=http://localhost:5000`.
- **تسجيل الحساب لا يكتمل:** قد يتطلب رمز التحقق تهيئة مزود البريد في Backend.
- **تغير ملف `.env` ولم يظهر أثره:** أوقف Vite بـ `Ctrl+C` ثم أعد `npm run dev`.
- **تغييرات schema لم تنطبق:** أوقف Backend ثم أعد `npm run migrate`.

## تنبيه أمني عن ملفات الرفع

المستودع الأصلي يتضمن ملفات داخل `backend/uploads` tracked في Git، ومنها صور وملفات PDF. راجعها قبل مشاركة المستودع أو جعله عامًا؛ قد تتضمن بيانات مستخدمين. لا تضع أي ملفات سرية أو مستندات هوية ضمن Git، ولا ترفع ملفات `.env`.
