# إعداد قاعدة البيانات على جهاز جديد

## المتطلبات

يجب تثبيت Node.js وPostgreSQL، ثم إنشاء قاعدة بيانات فارغة باسم `car_rental_db` أو استخدام الاسم الموجود في ملف `.env`.

## إعداد متغيرات البيئة

انسخ الملف:

```cmd
copy .env.example .env
```

ثم عدّل بيانات PostgreSQL داخل `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_rental_db
DB_USER=postgres
DB_PASSWORD=كلمة_مرور_PostgreSQL
JWT_SECRET=ضع_قيمة_عشوائية_طويلة_وآمنة
```

## تشغيل جميع migrations

من مجلد `backend` نفّذ:

```cmd
npm install
npm run migrate
```

يقوم الأمر بترتيب ملفات `backend/migrations`، وإنشاء جدول `schema_migrations`، وتسجيل كل ملف بعد نجاحه، وتخطي الملفات التي تم تنفيذها مسبقاً. إذا توقف التنفيذ، أصلح الخطأ ثم أعد الأمر نفسه؛ سيستأنف من الملف غير المنفذ.

## إضافة البيانات التجريبية اختيارياً

بعد نجاح migrations، يمكنك إضافة بيانات الاختبار:

```cmd
npm run seed
```

لا تنفذ `seed` على قاعدة تحتوي بيانات إنتاجية إلا بعد أخذ نسخة احتياطية، لأن بيانات الاختبار قد تتعارض مع بياناتك الحالية.

## تشغيل الباكند

```cmd
npm run dev
```

يعمل الخادم افتراضياً على:

```text
http://localhost:5000
```

## ملاحظات مهمة

لا تستخدم `node run_migration.js` لتجهيز قاعدة جديدة؛ هذا الأمر مخصص لتشغيل ملف Migration واحد عند الحاجة. التجهيز الكامل يستخدم `npm run migrate`.

يجب تنفيذ migrations قبل تشغيل `npm run seed` وقبل تشغيل `npm run dev`. لا تنسخ ملف `.env` إلى GitHub؛ انسخ `.env.example` فقط.
