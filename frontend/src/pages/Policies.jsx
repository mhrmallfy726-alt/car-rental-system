import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Handshake, LockKeyhole, ShieldCheck } from 'lucide-react';

const sections = {
  terms: {
    eyebrow: 'للمستخدمين والعملاء',
    title: 'الشروط والأحكام العامة',
    intro: 'تنظم هذه الشروط استخدام منصة Rental CR والبحث عن السيارات والتواصل مع الموردين وإرسال طلبات الحجز.',
    items: [
      ['الحساب والبيانات', 'يلتزم المستخدم بإدخال بيانات صحيحة ومحدثة، والمحافظة على سرية بيانات الدخول، وعدم استخدام حساب شخص آخر.'],
      ['البحث والحجز', 'يعتمد توفر السيارة على الموقع والفترة والحالة والاعتماد. لا يصبح الطلب حجزًا مؤكدًا إلا بعد معالجة الطلب وإظهار حالته في الحساب.'],
      ['الإلغاء والتعديل', 'تخضع عمليات الإلغاء والتعديل لسياسة الحجز الظاهرة في صفحة السيارة وللحالة الزمنية للطلب وإجراءات المورد المعتمدة.'],
      ['الاستخدام المسؤول', 'يمنع استخدام المنصة للإساءة أو تقديم بيانات مضللة أو رفع ملفات مخالفة أو محاولة تجاوز الصلاحيات.'],
    ],
  },
  supplier: {
    eyebrow: 'للموردين والمعارض',
    title: 'سياسة انضمام الموردين',
    intro: 'توضح هذه السياسة متطلبات تسجيل المورد وإدارة السيارات والفروع والطلبات داخل منصة Rental CR.',
    items: [
      ['طلب الانضمام', 'يقدم المورد بيانات المالك والمعرض والمدينة والعنوان ورقم الهاتف والبريد الإلكتروني، ويرفع الشعار والسجل التجاري وهوية المالك عند طلبها.'],
      ['المراجعة والاعتماد', 'يبقى طلب المورد قيد المراجعة إلى أن يتحقق مدير النظام من البيانات والوثائق. لا تظهر السيارات للعملاء قبل اعتماد المورد والسيارة وفق صلاحيات النظام.'],
      ['دقة بيانات السيارات', 'يلتزم المورد بإدخال السعر والحالة والموقع والوصف والصور بصورة صحيحة، وتحديث التوفر فور تغير حالة السيارة أو وجود حجز مؤكد.'],
      ['الحجوزات والتواصل', 'يتابع المورد الطلبات من لوحته ويرد عليها في المدد المحددة، ويتحمل مسؤولية تجهيز السيارة وتوضيح شروط التسليم والاستلام للعميل.'],
    ],
  },
  rental: {
    eyebrow: 'قبل تأكيد الحجز',
    title: 'سياسة الحجوزات والتسليم والاستلام',
    intro: 'تشرح هذه السياسة التزامات العميل والمورد عند إنشاء الحجز وتوثيق حالة السيارة قبل التسليم وبعد الإرجاع.',
    items: [
      ['بيانات الرحلة', 'يحدد العميل موقع الاستلام وتاريخ ووقت الاستلام والإرجاع بصورة صحيحة، ويجب أن يكون وقت الإرجاع لاحقًا لوقت الاستلام.'],
      ['توثيق الحالة', 'يجوز توثيق حالة السيارة بالصور والعداد والوقود عند التسليم والإرجاع، ويجب الإبلاغ عن الضرر أو الملاحظة ضمن المدة المحددة.'],
      ['الشكاوى والنزاعات', 'يمكن رفع شكوى مرتبطة بالحجز، وتراجع الإدارة الأدلة والرسائل والصور والبيانات قبل إصدار قرار وفق الإجراءات المعتمدة.'],
      ['الموافقة', 'يلزم قبول هذه السياسة قبل إنشاء الحجز، ويسجل النظام إصدار السياسة المقبول مع بيانات الحجز للمراجعة والشفافية.'],
    ],
  },
  privacy: {
    eyebrow: 'حماية البيانات',
    title: 'سياسة الخصوصية',
    intro: 'توضح هذه السياسة أنواع البيانات التي تستخدمها Rental CR والهدف من استخدامها وحقوق أصحابها.',
    items: [
      ['البيانات التي نجمعها', 'قد تشمل بيانات الحساب ووسائل التواصل وبيانات الحجز وبيانات السيارة والوثائق التي يرفعها المورد عند طلب الانضمام.'],
      ['الغرض من الاستخدام', 'تستخدم البيانات لتشغيل البحث والحجز والمراسلة والإشعارات والتحقق من الصلاحيات ومعالجة الشكاوى والنزاعات.'],
      ['الحماية والوصول', 'تطبق المنصة صلاحيات حسب الدور، ولا تعرض البيانات الخاصة إلا للمستخدمين المصرح لهم وفق وظيفة الحساب وإجراءات الإدارة.'],
      ['الاحتفاظ والمراجعة', 'تحتفظ المنصة بالبيانات اللازمة للتشغيل والتدقيق وفق سياسة المنصة والالتزامات النظامية، ويجوز تحديث هذه السياسة عند إضافة خدمات جديدة.'],
    ],
  },
};

export default function Policies({ defaultType = 'terms' }) {
  const { hash } = useLocation();
  const type = hash.replace('#', '') || defaultType;
  const policy = sections[type] || sections.terms;
  const tabs = [
    ['terms', 'الشروط العامة', FileText],
    ['supplier', 'سياسة المورد', Handshake],
    ['rental', 'سياسة الحجز', ShieldCheck],
    ['privacy', 'الخصوصية', LockKeyhole],
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f8f8] px-4 py-10 text-[#173a52] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-[#d7e4e4] bg-white px-4 py-2 text-sm font-bold text-[#173a52] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]">
            <ArrowRight size={17} /> العودة للرئيسية
          </Link>
          <span className="rounded-full bg-[#e3f3ef] px-4 py-2 text-xs font-extrabold text-[#087f68]">Rental CR · مركز السياسات</span>
        </div>
        <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#173a52] via-[#0f5260] to-[#087f68] p-7 text-white shadow-[0_20px_60px_rgba(23,58,82,.18)] sm:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3 text-[#bde9df]"><ShieldCheck size={24} /><span className="text-sm font-bold">وضوح وثقة في كل عملية تأجير</span></div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">سياسات Rental CR</h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/80 sm:text-base">اقرأ السياسة المناسبة قبل التسجيل أو الانضمام كمورد أو تأكيد الحجز. صممت هذه الصفحات لتوضيح الحقوق والمسؤوليات بطريقة سهلة وواضحة.</p>
          </div>
        </section>
        <div className="mt-7 grid gap-7 lg:grid-cols-[250px_1fr]">
          <nav className="h-fit rounded-3xl border border-[#dce8e7] bg-white p-3 shadow-sm">
            <p className="px-3 pb-3 pt-2 text-xs font-black uppercase tracking-wider text-[#78909c]">اختر السياسة</p>
            <div className="grid gap-2">
              {tabs.map(([key, label, Icon]) => <Link key={key} to={`/policies#${key}`} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${type === key ? 'bg-[#087f68] text-white shadow-lg shadow-[#087f68]/20' : 'text-[#48606a] hover:bg-[#edf7f5] hover:text-[#087f68]'}`}><Icon size={18} />{label}</Link>)}
            </div>
          </nav>
          <article className="rounded-3xl border border-[#dce8e7] bg-white p-6 shadow-sm sm:p-10">
            <div className="mb-8 border-b border-[#e7eeee] pb-7"><span className="text-xs font-black text-[#b24e40]">{policy.eyebrow}</span><h2 className="mt-2 text-2xl font-black text-[#173a52] sm:text-3xl">{policy.title}</h2><p className="mt-4 leading-8 text-[#64777e]">{policy.intro}</p><p className="mt-3 text-xs font-bold text-[#9aa9ad]">آخر تحديث: سبتمبر 2026 · الإصدار 1.0</p></div>
            <div className="grid gap-4">{policy.items.map(([title, body]) => <section key={title} className="rounded-2xl border border-[#edf1f1] bg-[#fbfdfd] p-5"><h3 className="flex items-center gap-2 font-black text-[#173a52]"><CheckCircle2 size={18} className="text-[#087f68]" />{title}</h3><p className="mt-3 text-sm leading-8 text-[#5e7077]">{body}</p></section>)}</div>
            <div className="mt-8 rounded-2xl bg-[#fff7ed] p-5 text-sm leading-8 text-[#8a5a22]"><strong>تنبيه:</strong> استخدام المنصة أو إرسال طلب الانضمام أو تأكيد الحجز يعني قراءة السياسة المناسبة والموافقة على الالتزام بها.</div>
          </article>
        </div>
      </div>
    </main>
  );
}

export { sections };
