// =============================================
// مساعد موحد لمسارات صور السيارات
// يحوّل أي مسار (نسبي أو كامل) إلى URL صحيح
// =============================================

const BASE_URL = 'http://localhost:5000';

/**
 * تحويل مسار الصورة إلى URL كامل
 * @param {string|null} imagePath - المسار من قاعدة البيانات
 * @param {string} fallback - صورة بديلة إذا لم تُوجد صورة
 */
export function getImageUrl(imagePath, fallback = 'https://via.placeholder.com/300x200?text=No+Image') {
  if (!imagePath) return fallback;
  if (imagePath.startsWith('http')) return imagePath;
  
  // توحيد المسارات (تحويل \ إلى / لنظام ويندوز وإزالة السلاش المتكرر)
  const clean = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${BASE_URL}/${clean}`;
}

/**
 * صورة السيارة الرئيسية (للقوائم والبطاقات)
 */
export function getCarImage(car, fallback = 'https://via.placeholder.com/300x200?text=No+Image') {
  return getImageUrl(car?.primary_image || car?.car_image || null, fallback);
}

/**
 * صورة شعار المورد
 */
export function getBrandLogo(user, fallback = 'https://via.placeholder.com/80?text=Logo') {
  return getImageUrl(user?.brand_logo || null, fallback);
}

/**
 * صورة الملف الشخصي للمستخدم
 */
export function getAvatarUrl(user, fallback = null) {
  if (!user?.avatar) return fallback || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0a58ca&color=fff`;
  return getImageUrl(user.avatar, fallback);
}
