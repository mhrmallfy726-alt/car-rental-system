require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🗑️ Clearing existing data...');
    // Order matters because of foreign keys
    await client.query('TRUNCATE TABLE complaint_messages, complaints, reviews, payments, reservations, car_features, car_images, favorite_cars, notifications, saved_cards, cars, users, categories, locations CASCADE');

    console.log('🌱 Starting fresh seed with realistic data...');
    const hash = await bcrypt.hash('123456', 12);

    // ── Locations ───────────────────────────────────────────
    console.log('📍 Seeding locations...');
    const locRes = await client.query(`
      INSERT INTO locations (city, address, is_active) VALUES
      ('صنعاء', 'شارع حدة، بجانب مركز الكميم', true),
      ('عدن', 'خور مكسر، شارع الستين', true),
      ('تعز', 'شارع جمال، وسط المدينة', true),
      ('إب', 'الدائري الغربي، مفرق جبلة', true),
      ('الحديدة', 'شارع الميناء، حي الشهداء', true),
      ('المكلا', 'شارع الستين، حي السلام', true)
      RETURNING id, city
    `);
    const locs = locRes.rows;
    const locMap = {};
    locs.forEach(l => locMap[l.city] = l.id);

    // ── Categories ──────────────────────────────────────────
    console.log('🚗 Seeding categories...');
    const catRes = await client.query(`
      INSERT INTO categories (name, description, image_url) VALUES
      ('Economy', 'سيارات اقتصادية موفرة للوقود للقيادة اليومية', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80'),
      ('Sedan', 'سيارات صالون مريحة وعملية للعائلات الصغيرة', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=400&q=80'),
      ('SUV', 'سيارات دفع رباعي قوية للمناطق الوعرة والرحلات', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'),
      ('Luxury', 'سيارات فاخرة للمناسبات الخاصة ورجال الأعمال', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'),
      ('Sports', 'سيارات رياضية سريعة وعصرية', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf048?auto=format&fit=crop&w=400&q=80'),
      ('Van', 'حافلات صغيرة لنقل المجموعات والعائلات الكبيرة', 'https://images.unsplash.com/photo-1531920335384-3f6632013fe2?auto=format&fit=crop&w=400&q=80')
      RETURNING id, name
    `);
    const cats = catRes.rows;
    const catMap = {};
    cats.forEach(c => catMap[c.name] = c.id);

    // ── Users ─────────────────────────────────────────────
    console.log('👤 Seeding users (Admin, Suppliers, Customers)...');
    
    // Admin
    await client.query(`
      INSERT INTO users (name, email, password, role, is_verified, email_verified)
      VALUES ('مدير النظام', 'admin@carrental.com', '${hash}', 'admin', true, true)
      ON CONFLICT (email) DO NOTHING
    `);

    // Suppliers
    const supplierRes = await client.query(`
      INSERT INTO users (name, email, password, role, phone, is_verified, email_verified, brand_logo, brand_description, bank_name, iban) VALUES
      ('شركة النخبة لتأجير السيارات', 'elite@supplier.com', '${hash}', 'supplier', '01234567', true, true, 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&h=100&q=80', 'نحن نقدم أفضل السيارات الفاخرة والحديثة في اليمن مع خدمة عملاء متميزة على مدار الساعة.', 'بنك التضامن الإسلامي', 'YE123456789012345678901234'),
      ('مكتب الراحة لخدمات السيارات', 'raha@supplier.com', '${hash}', 'supplier', '01445566', true, true, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&h=100&q=80', 'خيارات اقتصادية وعائلية تناسب ميزانيتك. راحتكم هي هدفنا الأساسي.', 'بنك الكريمي الإسلامي', 'YE098765432109876543210987'),
      ('المحضار لتجارة وتأجير السيارات', 'almihdar@supplier.com', '${hash}', 'supplier', '05334422', true, true, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=100&h=100&q=80', 'خبرة طويلة في سوق السيارات اليمني. نوفر سيارات دفع رباعي قوية للمناطق الجبلية.', 'بنك اليمن والكويت', 'YE112233445566778899001122')
      RETURNING id, name
    `);
    const suppliers = supplierRes.rows;

    // Customers
    const customerRes = await client.query(`
      INSERT INTO users (name, email, password, role, phone, is_verified, email_verified, avatar) VALUES
      ('صالح عبدالكريم القاضي', 'saleh@customer.com', '${hash}', 'customer', '770001112', true, true, 'https://i.pravatar.cc/150?u=saleh'),
      ('أروى محمد باوزير', 'arwa@customer.com', '${hash}', 'customer', '710002223', true, true, 'https://i.pravatar.cc/150?u=arwa'),
      ('سامر هاني الصبري', 'samer@customer.com', '${hash}', 'customer', '730003334', true, true, 'https://i.pravatar.cc/150?u=samer'),
      ('منى حسن الشايف', 'mona@customer.com', '${hash}', 'customer', '700004445', false, true, 'https://i.pravatar.cc/150?u=mona')
      RETURNING id, name
    `);
    const customers = customerRes.rows;

    // ── Cars ──────────────────────────────────────────────
    console.log('🚘 Seeding cars and images...');
    const carsToInsert = [
      {
        supplier_id: suppliers[0].id, cat: 'Luxury', loc: 'صنعاء', make: 'Mercedes-Benz', model: 'S-Class', year: 2023, color: 'أسود الملكي',
        plate: '1-10020', seats: 5, price: 250, desc: 'أفخم سيارة سيدان في العالم، مثالية لرجال الأعمال والمناسبات الخاصة.',
        imgs: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['مكيف هواء', 'نظام GPS', 'مقاعد جلدية', 'نظام صوتي Burmester', 'تدليك للمقاعد']
      },
      {
        supplier_id: suppliers[0].id, cat: 'SUV', loc: 'صنعاء', make: 'Toyota', model: 'Land Cruiser', year: 2022, color: 'أبيض لؤلؤي',
        plate: '1-55443', seats: 7, price: 180, desc: 'ملك الطرق الوعرة، مريحة جداً للسفر بين المحافظات اليمنية.',
        imgs: [
          'https://images.unsplash.com/photo-1594568284297-7c64464062b1?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['دفع رباعي', 'ثلاجة داخلية', 'شاشات خلفية', 'تكييف مركزي']
      },
      {
        supplier_id: suppliers[1].id, cat: 'Economy', loc: 'عدن', make: 'Hyundai', model: 'Elantra', year: 2021, color: 'فضي',
        plate: '2-99887', seats: 5, price: 45, desc: 'سيارة اقتصادية ممتازة للاستخدام اليومي داخل مدينة عدن.',
        imgs: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['موفرة للوقود', 'بلوتوث', 'كاميرا خلفية']
      },
      {
        supplier_id: suppliers[2].id, cat: 'SUV', loc: 'المكلا', make: 'Lexus', model: 'LX570', year: 2021, color: 'ذهبي',
        plate: '5-33221', seats: 7, price: 220, desc: 'الفخامة والقوة في سيارة واحدة. مناسبة جداً للأجواء الساحلية.',
        imgs: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['نظام ملاحة متطور', 'فتحة سقف', 'تبريد وتدفئة مقاعد']
      },
      {
        supplier_id: suppliers[1].id, cat: 'Sedan', loc: 'تعز', make: 'Honda', model: 'Accord', year: 2022, color: 'أزرق غامق',
        plate: '3-44556', seats: 5, price: 70, desc: 'ثبات وقوة على الطريق مع مقصورة واسعة ومريحة.',
        imgs: [
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['نظام المساعدة في القيادة', 'تشغيل عن بعد', 'دخول ذكي']
      }
    ];

    for (const car of carsToInsert) {
      const carRes = await client.query(`
        INSERT INTO cars (supplier_id, category_id, location_id, make, model, year, color, license_plate, seats, price_per_day, description, status, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'available', true)
        RETURNING id
      `, [car.supplier_id, catMap[car.cat], locMap[car.loc], car.make, car.model, car.year, car.color, car.plate, car.seats, car.price, car.desc]);
      
      const carId = carRes.rows[0].id;

      // Images
      for (let i = 0; i < car.imgs.length; i++) {
        await client.query(`
          INSERT INTO car_images (car_id, image_url, is_primary)
          VALUES ($1, $2, $3)
        `, [carId, car.imgs[i], i === 0]);
      }

      // Features
      for (const feat of car.features) {
        await client.query(`
          INSERT INTO car_features (car_id, feature)
          VALUES ($1, $2)
        `, [carId, feat]);
      }
    }

    // ── Reservations ──────────────────────────────────────
    console.log('📅 Seeding realistic reservations...');
    // Get car IDs
    const cars = (await client.query('SELECT id, supplier_id, price_per_day FROM cars')).rows;
    
    // Past reservations (completed)
    await client.query(`
      INSERT INTO reservations (customer_id, car_id, supplier_id, start_date, end_date, total_days, price_per_day, total_price, status, pickup_location, dropoff_location, approved_at, completed_at)
      VALUES 
      ($1, $2, $3, '2026-04-01', '2026-04-05', 4, 250, 1000, 'completed', 'صنعاء - المطار', 'صنعاء - المطار', NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
      ($4, $5, $6, '2026-04-10', '2026-04-15', 5, 45, 225, 'completed', 'عدن - المعلا', 'عدن - المعلا', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days')
    `, [customers[0].id, cars[0].id, cars[0].supplier_id, customers[1].id, cars[2].id, cars[2].supplier_id]);

    // Current reservation (active)
    await client.query(`
      INSERT INTO reservations (customer_id, car_id, supplier_id, start_date, end_date, total_days, price_per_day, total_price, status, pickup_location, dropoff_location, approved_at)
      VALUES 
      ($1, $2, $3, '2026-05-01', '2026-05-10', 9, 180, 1620, 'active', 'صنعاء - التحرير', 'صنعاء - التحرير', NOW() - INTERVAL '6 days')
    `, [customers[0].id, cars[1].id, cars[1].supplier_id]);

    // Future reservations (pending)
    await client.query(`
      INSERT INTO reservations (customer_id, car_id, supplier_id, start_date, end_date, total_days, price_per_day, total_price, status, pickup_location, dropoff_location)
      VALUES 
      ($1, $2, $3, '2026-06-01', '2026-06-03', 2, 70, 140, 'pending', 'تعز - شارع جمال', 'تعز - شارع جمال')
    `, [customers[2].id, cars[4].id, cars[4].supplier_id]);

    // ── Reviews ───────────────────────────────────────────
    console.log('⭐ Seeding reviews...');
    const completedRes = (await client.query("SELECT id, customer_id, car_id, supplier_id FROM reservations WHERE status = 'completed'")).rows;
    if (completedRes.length > 0) {
      await client.query(`
        INSERT INTO reviews (reservation_id, reviewer_id, car_id, supplier_id, car_rating, supplier_rating, comment)
        VALUES 
        ($1, $2, $3, $4, 5, 5, 'السيارة كانت في حالة ممتازة ونظيفة جداً. تعامل الشركة كان في غاية الرقي.'),
        ($5, $6, $7, $8, 4, 5, 'خدمة جيدة جداً والسيارة مريحة واقتصادية في استهلاك الوقود.')
      `, [
        completedRes[0].id, completedRes[0].customer_id, completedRes[0].car_id, completedRes[0].supplier_id,
        completedRes[1].id, completedRes[1].customer_id, completedRes[1].car_id, completedRes[1].supplier_id
      ]);
    }

    console.log('✅ Database seeded successfully with realistic data!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
