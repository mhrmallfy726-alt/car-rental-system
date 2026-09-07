import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Megaphone, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { advertisementsAPI } from '../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

const typeLabels = {
  featured: 'إعلان مميز',
  discount: 'خصم خاص',
  urgent: 'عرض عاجل',
  main: 'إعلان رئيسي',
};

const typeClasses = {
  featured: 'ad-type-featured',
  discount: 'ad-type-discount',
  urgent: 'ad-type-urgent',
  main: 'ad-type-main',
};

const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:')) return value;
  return `${API_ORIGIN}/${value.replace(/^\//, '')}`;
};

const getCarTarget = (advertisement) => {
  if (advertisement.car_id) return `/cars/${advertisement.car_id}`;
  if (advertisement.link_url) return advertisement.link_url;
  return '/cars';
};

function AdvertisementCard({ advertisement, compact }) {
  const impressionSent = useRef(false);
  const title = advertisement.title || 'عرض مميز متاح الآن';
  const description = advertisement.description || 'اكتشف تفاصيل العرض واحجز سيارتك بسهولة.';
  const type = advertisement.ad_type || 'main';
  const image = resolveAssetUrl(advertisement.image_url || advertisement.car_primary_image);
  const target = getCarTarget(advertisement);
  const carName = [advertisement.car_make, advertisement.car_model].filter(Boolean).join(' ');

  useEffect(() => {
    if (impressionSent.current || !advertisement.id) return;
    impressionSent.current = true;
    advertisementsAPI.recordImpression(advertisement.id).catch(() => {});
  }, [advertisement.id]);

  const handleClick = () => {
    advertisementsAPI.recordClick(advertisement.id).catch(() => {});
  };

  const cardContent = (
    <>
      <div className="advertisement-card-media">
        {image ? (
          <img src={image} alt={title} className="advertisement-card-image" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="advertisement-card-placeholder">
            <CarFront size={compact ? 34 : 48} strokeWidth={1.4} />
            <span>عرض سيارة</span>
          </div>
        )}
        <div className="advertisement-card-shade" />
        <div className="advertisement-card-topline">
          <span className={`advertisement-type ${typeClasses[type] || 'ad-type-main'}`}>
            <Megaphone size={14} /> {typeLabels[type] || 'إعلان'}
          </span>
          {advertisement.featured && <span className="advertisement-featured-badge"><Sparkles size={13} /> مميز</span>}
        </div>
        <span className="advertisement-card-arrow" aria-hidden="true"><ArrowLeft size={18} /></span>
      </div>
      <div className="advertisement-card-content">
        <div className="advertisement-card-heading">
          <div>
            <h3>{title}</h3>
            {carName && <p className="advertisement-car-name">{carName}</p>}
          </div>
          {Number(advertisement.price || 0) > 0 && (
            <div className="advertisement-price"><strong>{Number(advertisement.price).toLocaleString()}</strong><small>ر.ي</small></div>
          )}
        </div>
        <p className="advertisement-card-description">{description}</p>
        <div className="advertisement-card-footer"><span>{advertisement.car_id ? 'شاهد السيارة والتفاصيل' : 'اكتشف العرض'}</span><ArrowLeft size={18} /></div>
      </div>
    </>
  );

  if (/^https?:\/\//i.test(target)) {
    return <a href={target} target="_blank" rel="noreferrer" className={`advertisement-card ${compact ? 'advertisement-card-compact' : ''}`} onClick={handleClick}>{cardContent}</a>;
  }

  return <Link to={target} className={`advertisement-card ${compact ? 'advertisement-card-compact' : ''}`} onClick={handleClick}>{cardContent}</Link>;
}

export default function AdvertisementBanner({ placement = 'home', carId, compact = false }) {
  const [advertisements, setAdvertisements] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadAdvertisements = async () => {
      setLoading(true);
      try {
        const response = await advertisementsAPI.getActiveAdvertisements({ placement, ...(carId ? { car_id: carId } : {}) });
        if (!cancelled) {
          setAdvertisements(response.data?.data || []);
          setActiveIndex(0);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Advertisement load error:', error);
        if (!cancelled) setAdvertisements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAdvertisements();
    return () => { cancelled = true; };
  }, [placement, carId]);

  useEffect(() => {
    if (advertisements.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % advertisements.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [advertisements.length]);

  useEffect(() => {
    if (activeIndex >= advertisements.length && advertisements.length > 0) setActiveIndex(0);
  }, [activeIndex, advertisements.length]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (loading || advertisements.length === 0 || !isOpen) return null;

  const currentAdvertisement = advertisements[activeIndex];

  return (
    <div className="advertisement-modal-backdrop" dir="rtl" role="dialog" aria-modal="true" aria-label="إعلان">
      <div className="advertisement-modal">
        <button type="button" className="advertisement-modal-close" onClick={() => setIsOpen(false)} aria-label="إغلاق الإعلان"><X size={20} /></button>
        <div className="advertisement-modal-label"><Megaphone size={14} /> إعلان</div>
        <div key={currentAdvertisement.id} className="advertisement-modal-content"><AdvertisementCard advertisement={currentAdvertisement} compact={compact} /></div>
        {advertisements.length > 1 && <div className="advertisement-modal-controls"><button type="button" aria-label="الإعلان السابق" onClick={() => setActiveIndex((current) => (current - 1 + advertisements.length) % advertisements.length)} style={sliderButtonStyle}><ArrowRight size={17} /></button><span>{activeIndex + 1} / {advertisements.length}</span><button type="button" aria-label="الإعلان التالي" onClick={() => setActiveIndex((current) => (current + 1) % advertisements.length)} style={sliderButtonStyle}><ArrowLeft size={17} /></button></div>}
      </div>
      <style>{`@keyframes advertisementModalIn { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
}

const sliderButtonStyle = {
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid #dfe5e9',
  borderRadius: 10,
  background: '#fff',
  color: '#173a52',
  cursor: 'pointer',
};
