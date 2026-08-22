import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CarFront, Megaphone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { advertisementsAPI } from '../services/api';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

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
  if (advertisement.link_url) return advertisement.link_url;
  if (advertisement.car_id) return `/cars/${advertisement.car_id}`;
  return '/cars';
};

function AdvertisementCard({ advertisement, compact }) {
  const impressionSent = useRef(false);
  const title = advertisement.title || 'عرض مميز متاح الآن';
  const description = advertisement.description || 'اكتشف تفاصيل العرض واحجز سيارتك بسهولة.';
  const type = advertisement.ad_type || 'main';
  const image = resolveAssetUrl(
    advertisement.image_url || advertisement.car_primary_image
  );
  const target = getCarTarget(advertisement);
  const carName = [advertisement.car_make, advertisement.car_model]
    .filter(Boolean)
    .join(' ');

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
          <img
            src={image}
            alt={title}
            className="advertisement-card-image"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="advertisement-card-placeholder">
            <CarFront size={compact ? 34 : 48} strokeWidth={1.4} />
            <span>عرض سيارة</span>
          </div>
        )}

        <div className="advertisement-card-shade" />

        <div className="advertisement-card-topline">
          <span className={`advertisement-type ${typeClasses[type] || 'ad-type-main'}`}>
            <Megaphone size={14} />
            {typeLabels[type] || 'إعلان'}
          </span>

          {advertisement.featured && (
            <span className="advertisement-featured-badge">
              <Sparkles size={13} /> مميز
            </span>
          )}
        </div>

        <span className="advertisement-card-arrow" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
      </div>

      <div className="advertisement-card-content">
        <div className="advertisement-card-heading">
          <div>
            <h3>{title}</h3>
            {carName && <p className="advertisement-car-name">{carName}</p>}
          </div>

          {Number(advertisement.price || 0) > 0 && (
            <div className="advertisement-price">
              <strong>{Number(advertisement.price).toLocaleString()}</strong>
              <small>ر.س</small>
            </div>
          )}
        </div>

        <p className="advertisement-card-description">{description}</p>

        <div className="advertisement-card-footer">
          <span>{advertisement.car_id ? 'شاهد السيارة والتفاصيل' : 'اكتشف العرض'}</span>
          <ArrowLeft size={18} />
        </div>
      </div>
    </>
  );

  if (/^https?:\/\//i.test(target)) {
    return (
      <a
        href={target}
        target="_blank"
        rel="noreferrer"
        className={`advertisement-card ${compact ? 'advertisement-card-compact' : ''}`}
        onClick={handleClick}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      to={target}
      className={`advertisement-card ${compact ? 'advertisement-card-compact' : ''}`}
      onClick={handleClick}
    >
      {cardContent}
    </Link>
  );
}

export default function AdvertisementBanner({ placement = 'home', carId, compact = false }) {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAdvertisements = async () => {
      setLoading(true);
      try {
        const response = await advertisementsAPI.getActiveAdvertisements({
          placement,
          ...(carId ? { car_id: carId } : {}),
        });

        if (!cancelled) {
          setAdvertisements(response.data?.data || []);
        }
      } catch (error) {
        console.error('Advertisement load error:', error);
        if (!cancelled) setAdvertisements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAdvertisements();
    return () => {
      cancelled = true;
    };
  }, [placement, carId]);

  if (loading || advertisements.length === 0) return null;

  return (
    <section className="advertisement-showcase" dir="rtl" aria-label="الإعلانات">
      <div className="advertisement-showcase-heading">
        <div>
          <span className="advertisement-eyebrow">عروض مختارة لك</span>
          <h2>اكتشف عروض السيارات</h2>
          <p>عروض موثوقة من الموردين المعتمدين، مصممة لتناسب رحلتك.</p>
        </div>
      </div>

      <div className="advertisement-grid">
        {advertisements.map((advertisement) => (
          <AdvertisementCard
            key={advertisement.id}
            advertisement={advertisement}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}
