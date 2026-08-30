const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');

router.use(protect, authorize('supplier'));

const YEMEN_CITIES = ['أبين','الضالع','عدن','البيضاء','الحديدة','الجوف','المهرة','المحويت','عمران','ذمار','حضرموت','حجة','إب','لحج','مأرب','ريمة','صعدة','صنعاء','أمانة العاصمة','شبوة','سقطرى','تعز'];
const normalize = (value = '') => String(value).trim().replace(/\s+/g, ' ');

async function assertLocationInYemenCity(city, latitude, longitude) {
  const lat = Number(latitude); const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new AppError('يجب تحديد موقع المعرض من الخريطة', 400);
  if (lat < 12 || lat > 19 || lon < 42 || lon > 55) throw new AppError('الموقع المحدد ليس داخل اليمن', 400);

  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return;

  const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
  url.searchParams.set('lat', lat); url.searchParams.set('lon', lon);
  url.searchParams.set('lang', 'ar'); url.searchParams.set('format', 'json'); url.searchParams.set('apiKey', key);
  const response = await fetch(url);
  if (!response.ok) throw new AppError('تعذر التحقق من موقع المعرض على الخريطة', 502);
  const place = (await response.json()).results?.[0];
  if (!place || String(place.country_code || '').toLowerCase() !== 'ye') throw new AppError('الموقع المحدد خارج اليمن', 400);

  const aliases = {
    'صنعاء':['صنعاء','Sana\'a','Sanaa'],'أمانة العاصمة':['أمانة العاصمة','Sana\'a City','Sanaa City'],
    'الحديدة':['الحديدة','Hodeidah','Al Hudaydah'],'إب':['إب','Ibb'],'تعز':['تعز','Taiz','Ta\'izz'],
    'عدن':['عدن','Aden'],'حضرموت':['حضرموت','Hadramout','Hadramawt'],'المهرة':['المهرة','Al Mahrah','Mahrah'],
    'شبوة':['شبوة','Shabwah'],'مأرب':['مأرب','Marib'],'الجوف':['الجوف','Al Jawf'],'صعدة':['صعدة','Saada'],
    'حجة':['حجة','Hajjah'],'عمران':['عمران','Amran'],'ذمار':['ذمار','Dhamar'],'ريمة':['ريمة','Raymah'],
    'المحويت':['المحويت','Al Mahwit'],'البيضاء':['البيضاء','Al Bayda'],'الضالع':['الضالع','Dhale','Ad Dali'],
    'لحج':['لحج','Lahij','Lahj'],'أبين':['أبين','Abyan'],'سقطرى':['سقطرى','Socotra']
  };
  const expected = aliases[city] || [city];
  const haystack = [place.city, place.state, place.county, place.name].filter(Boolean).map(normalize);
  const matches = haystack.some(value => expected.some(alias => value.includes(normalize(alias)) || normalize(alias).includes(value)));
  if (!matches) throw new AppError(`الموقع المحدد خارج ${city}`, 400);
}

router.get('/cities', asyncHandler(async (req, res) => {
  res.json({ success: true, data: YEMEN_CITIES.map(city => ({ value: city, label: city })) });
}));

router.get('/pricing', asyncHandler(async (req, res) => {
  const result = await query('SELECT monthly_price, annual_price, currency, enabled FROM showroom_subscription_settings WHERE id = 1');
  res.json({ success: true, data: result.rows[0] || { monthly_price: 10, annual_price: 100, currency: 'YER', enabled: true } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT l.id, l.showroom_name AS name, l.city, l.country, l.address, l.latitude, l.longitude,
           l.is_active, l.subscription_status, l.subscription_plan, l.subscription_started_at, l.subscription_expires_at,
           COUNT(c.id)::int AS car_count,
           (SELECT json_build_object('id',ss.id,'plan',ss.plan,'amount',ss.amount,'currency',ss.currency,'status',ss.status,'starts_at',ss.starts_at,'expires_at',ss.expires_at)
            FROM showroom_subscriptions ss WHERE ss.showroom_id=l.id ORDER BY ss.created_at DESC LIMIT 1) AS subscription
    FROM locations l LEFT JOIN cars c ON c.location_id=l.id AND c.supplier_id=$1
    WHERE l.supplier_id=$1 GROUP BY l.id ORDER BY LOWER(COALESCE(l.showroom_name,l.city)),l.created_at
  `, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
  const result = await query(`SELECT l.*, l.showroom_name AS name, COUNT(c.id)::int AS car_count FROM locations l
    LEFT JOIN cars c ON c.location_id=l.id AND c.supplier_id=$1 WHERE l.id=$2 AND l.supplier_id=$1 GROUP BY l.id`, [req.user.id, req.params.id]);
  if (!result.rows.length) return next(new AppError('المعرض غير موجود',404));
  res.json({ success:true, data:result.rows[0] });
}));

router.post('/', asyncHandler(async (req, res, next) => {
  const { name, city, address, latitude, longitude, plan='monthly' } = req.body;
  const cleanName=normalize(name), cleanCity=normalize(city);
  if (!cleanName) return next(new AppError('اسم المعرض مطلوب',400));
  if (!YEMEN_CITIES.includes(cleanCity)) return next(new AppError('اختر مدينة يمنية صحيحة',400));
  if (!['monthly','annual'].includes(plan)) return next(new AppError('نوع الاشتراك غير صحيح',400));
  const pricingResult=await query('SELECT monthly_price,annual_price,currency,enabled FROM showroom_subscription_settings WHERE id=1');
  const pricing=pricingResult.rows[0] || {monthly_price:10,annual_price:100,currency:'YER',enabled:true};
  if (!pricing.enabled) return next(new AppError('إضافة المعارض متوقفة حالياً من الإدارة',403));
  await assertLocationInYemenCity(cleanCity,latitude,longitude);
  const duplicate=await query('SELECT id FROM locations WHERE supplier_id=$1 AND LOWER(TRIM(showroom_name))=LOWER(TRIM($2))',[req.user.id,cleanName]);
  if (duplicate.rows.length) return next(new AppError('لديك معرض بنفس الاسم بالفعل',409));

  const amount=Number(plan==='annual'?pricing.annual_price:pricing.monthly_price);
  const client=await getClient();
  try {
    await client.query('BEGIN');
    const location=await client.query(`INSERT INTO locations
      (supplier_id,showroom_name,city,country,address,latitude,longitude,is_active,subscription_status,subscription_plan)
      VALUES($1,$2,$3,'Yemen',$4,$5,$6,FALSE,'pending_payment',$7)
      RETURNING id,showroom_name AS name,city,country,address,latitude,longitude,is_active,subscription_status,subscription_plan`,
      [req.user.id,cleanName,cleanCity,address||null,latitude,longitude,plan]);
    const subscription=await client.query(`INSERT INTO showroom_subscriptions
      (showroom_id,supplier_id,plan,amount,currency,price_snapshot) VALUES($1,$2,$3,$4,$5,$6::jsonb)
      RETURNING id,plan,amount,currency,status`,
      [location.rows[0].id,req.user.id,plan,amount,pricing.currency,JSON.stringify({monthly_price:pricing.monthly_price,annual_price:pricing.annual_price,captured_at:new Date().toISOString()})]);
    await client.query('COMMIT');
    res.status(201).json({success:true,data:{showroom:location.rows[0],subscription:subscription.rows[0]},message:'تم إنشاء طلب المعرض، أكمل رسوم الاشتراك لتفعيله'});
  } catch(error) { await client.query('ROLLBACK'); if(error.code==='23505') return next(new AppError('اسم المعرض مستخدم بالفعل',409)); throw error; }
  finally { client.release(); }
}));

router.put('/:id', asyncHandler(async (req,res,next)=>{
  const current=await query('SELECT * FROM locations WHERE id=$1 AND supplier_id=$2',[req.params.id,req.user.id]);
  if(!current.rows.length) return next(new AppError('المعرض غير موجود',404));
  const showroom=current.rows[0];
  const city=req.body.city===undefined?showroom.city:normalize(req.body.city);
  const name=req.body.name===undefined?showroom.showroom_name:normalize(req.body.name);
  const lat=req.body.latitude===undefined?showroom.latitude:req.body.latitude;
  const lon=req.body.longitude===undefined?showroom.longitude:req.body.longitude;
  if(!YEMEN_CITIES.includes(city)) return next(new AppError('اختر مدينة يمنية صحيحة',400));
  await assertLocationInYemenCity(city,lat,lon);
  const result=await query(`UPDATE locations SET showroom_name=$1,city=$2,address=$3,latitude=$4,longitude=$5,updated_at=NOW()
    WHERE id=$6 AND supplier_id=$7 RETURNING id,showroom_name AS name,city,country,address,latitude,longitude,is_active,subscription_status,subscription_plan`,
    [name,city,req.body.address===undefined?showroom.address:req.body.address,lat,lon,req.params.id,req.user.id]);
  res.json({success:true,data:result.rows[0],message:'تم تحديث بيانات المعرض'});
}));

router.delete('/:id', asyncHandler(async(req,res,next)=>{
  const result=await query(`UPDATE locations SET is_active=FALSE,subscription_status='suspended',updated_at=NOW() WHERE id=$1 AND supplier_id=$2 RETURNING id`,[req.params.id,req.user.id]);
  if(!result.rows.length) return next(new AppError('المعرض غير موجود',404));
  res.json({success:true,message:'تم تعطيل المعرض بدون حذف سياراته'});
}));

module.exports=router;
