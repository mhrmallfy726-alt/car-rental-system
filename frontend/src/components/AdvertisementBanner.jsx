import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Megaphone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { advertisementsAPI } from '../services/api';

const navy = '#173a52';
const gold = '#d4af37';

const resolveImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `http://localhost:5000/${value.replace(/^\//, '')}`;
};

export default function AdvertisementBanner({ placement = 'home', carId, compact = false }) {
  const [advertisement, setAdvertisement] = useState(null);
  const [loading, setLoading] = useState(true);
  const impressionIds = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    advertisementsAPI.getActive({ placement, car_id: carId }).then((response) => {
      if (!cancelled) setAdvertisement(response.data?.data?.[0] || null);
    }).catch(() => {
      if (!cancelled) setAdvertisement(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [placement, carId]);

  useEffect(() => {
    if (!advertisement?.id || impressionIds.current.has(advertisement.id)) return;
    impressionIds.current.add(advertisement.id);
    advertisementsAPI.recordImpression(advertisement.id).catch(() => {});
  }, [advertisement]);

  if (loading || !advertisement) return null;

  const image = resolveImageUrl(advertisement.image_url || advertisement.car_primary_image);
  const target = advertisement.link_url || (advertisement.car_id ? `/cars/${advertisement.car_id}` : '/cars');
  const title = advertisement.title || 'عرض مميز متاح الآن';
  const description = advertisement.description || 'اكتشف التفاصيل واحجز الخيار الأنسب لرحلتك.';

  return (
    <section dir="rtl" aria-label="إعلان ممول" style={{ width: '100%', margin: compact ? '16px 0' : '28px 0' }}>
      <div style={{ position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.2fr) minmax(180px, 0.8fr)', alignItems: 'stretch', minHeight: compact ? 150 : 220, borderRadius: 22, background: `linear-gradient(130deg, ${navy} 0%, #245a73 58%, ${gold} 180%)`, border: `1px solid ${gold}88`, boxShadow: '0 18px 42px rgba(23,58,82,0.18)' }}>
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -150, left: -60 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: compact ? '24px 24px 20px' : '30px 34px', color: '#fff' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#fce8a1', fontSize: 12, fontWeight: 800, marginBottom: 10 }}><Megaphone size={15} /> إعلان مميز</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: compact ? 20 : 28, lineHeight: 1.3, fontWeight: 900 }}>{title}</h2>
          <p style={{ margin: '9px 0 18px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.7, fontSize: compact ? 13 : 15 }}>{description}</p>
          <Link to={target} onClick={() => advertisementsAPI.recordClick(advertisement.id).catch(() => {})} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 11, color: navy, background: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>اكتشف العرض <ArrowLeft size={16} /></Link>
        </div>
        {!compact && image && (
          <div style={{ position: 'relative', minHeight: 220, padding: 12 }}>
            <img src={image} alt="صورة الإعلان" style={{ width: '100%', height: '100%', minHeight: 196, objectFit: 'cover', borderRadius: 16, display: 'block', border: '1px solid rgba(255,255,255,0.25)' }} />
            <div style={{ position: 'absolute', right: 24, bottom: 24, width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: '50%', color: gold, background: '#fff', boxShadow: '0 8px 18px rgba(0,0,0,0.18)' }}><Sparkles size={17} /></div>
          </div>
        )}
      </div>
    </section>
  );
}
