import {
  type CompNode, type CompType, type Layout, type LayoutKind, type TemplateDoc, type ThemeCfg,
  COMP_LABELS, defaultAnim, defaultStyle, uid,
} from './types';

/* ============================================================
   مصانع المكوّنات — القيم الافتراضية لكل نوع
   ============================================================ */

type PropsFactory = () => Record<string, any>;

export const COMP_DEFAULTS: Record<CompType, PropsFactory> = {
  topbar: () => ({
    brand: 'ستوديو', brandIcon: 'Sparkles',
    links: [
      { id: uid(), label: 'الرئيسية', icon: 'House', active: true },
      { id: uid(), label: 'الخدمات', icon: 'Layers' },
      { id: uid(), label: 'الأعمال', icon: 'Briefcase' },
      { id: uid(), label: 'تواصل', icon: 'Mail' },
    ],
    showSearch: true, showActions: true, sticky: true, variant: 'solid', height: 64,
  }),
  sidebar: () => ({
    items: [
      { id: uid(), label: 'لوحة التحكم', icon: 'LayoutDashboard', active: true },
      { id: uid(), label: 'المشاريع', icon: 'Folder', badge: '12' },
      { id: uid(), label: 'الفريق', icon: 'Users' },
      { id: uid(), label: 'التقارير', icon: 'BarChart3' },
      { id: uid(), label: 'الرسائل', icon: 'Mail', badge: '3' },
      { id: uid(), label: 'الإعدادات', icon: 'Settings' },
    ],
    position: 'right', width: 250, collapsible: true, itemShape: 'rounded',
    variant: 'solid', showUser: true, showLogo: true,
  }),
  bottombar: () => ({
    items: [
      { id: uid(), label: 'الرئيسية', icon: 'House', active: true },
      { id: uid(), label: 'بحث', icon: 'Search' },
      { id: uid(), label: 'إضافة', icon: 'PlusCircle' },
      { id: uid(), label: 'تنبيهات', icon: 'Bell', badge: '5' },
      { id: uid(), label: 'حسابي', icon: 'User' },
    ],
    floating: true, showLabels: true, activeStyle: 'pill',
  }),
  hero: () => ({
    title: 'ابنِ تجربتك الرقمية بأسلوبك الخاص',
    subtitle: 'صمم واجهات عصرية جذابة خلال دقائق — بدون كتابة سطر واحد من الكود، مع تحكم كامل بكل تفصيلة.',
    cta1: { label: 'ابدأ الآن مجاناً', icon: 'Rocket', show: true },
    cta2: { label: 'شاهد العرض', icon: 'PlayCircle', show: true },
    bgStyle: 'gradient', pattern: 'dots', align: 'center', minHeight: 420, badge: '✦ جديد — الإصدار 2.0',
  }),
  stats: () => ({
    items: [
      { id: uid(), label: 'مستخدم نشط', value: '24,580', icon: 'Users', desc: '+12% هذا الشهر' },
      { id: uid(), label: 'مشروع مكتمل', value: '1,420', icon: 'FolderCheck', desc: '+8% هذا الشهر' },
      { id: uid(), label: 'رضا العملاء', value: '98%', icon: 'HeartHandshake', desc: 'تقييم ممتاز' },
      { id: uid(), label: 'الإيرادات', value: '$92K', icon: 'Wallet', desc: '+23% ربعياً' },
    ],
    columns: 4, cardStyle: 'surface', showIcons: true,
  }),
  cards: () => ({
    items: [
      { id: uid(), label: 'تصميم مرن', icon: 'Palette', desc: 'غيّر الألوان والحواف والخطوط لحظياً وشاهد النتيجة مباشرة.', badge: 'شائع', value: '' },
      { id: uid(), label: 'مكوّنات جاهزة', icon: 'Blocks', desc: 'أكثر من 20 مكوّناً احترافياً يمكن إضافتها لأي قالب بسحبة واحدة.', badge: '', value: '' },
      { id: uid(), label: 'حركات انسيابية', icon: 'Zap', desc: 'تحكم كامل بالحركات والتوقيت لكل عنصر على حدة.', badge: 'جديد', value: '' },
    ],
    columns: 3, showThumb: true, showAction: true, actionLabel: 'اعرف المزيد', hoverEffect: 'lift',
  }),
  form: () => ({
    title: 'أنشئ حسابك',
    subtitle: 'انضم إلى آلاف المصممين حول العالم',
    fields: [
      { id: uid(), kind: 'text', label: 'الاسم الكامل', placeholder: 'محمد أحمد', required: true, icon: 'User' },
      { id: uid(), kind: 'email', label: 'البريد الإلكتروني', placeholder: 'name@example.com', required: true, icon: 'Mail' },
      { id: uid(), kind: 'password', label: 'كلمة المرور', placeholder: '••••••••', required: true, icon: 'Lock' },
      { id: uid(), kind: 'select', label: 'نوع الحساب', options: ['شخصي', 'أعمال', 'مؤسسة'], icon: 'Briefcase' },
      { id: uid(), kind: 'checkbox', label: 'أوافق على الشروط والأحكام' },
    ],
    submitLabel: 'إنشاء الحساب', submitIcon: 'ArrowLeft', columns: 1, labelPosition: 'top',
    cardStyle: 'surface', showTitle: true,
  }),
  table: () => ({
    title: 'أحدث الطلبات',
    columns: ['العميل', 'المنتج', 'المبلغ', 'الحالة', 'التاريخ'],
    rows: [
      ['سارة خالد', 'باقة احترافية', '$120', 'مكتمل', '2026/09/28'],
      ['أحمد سالم', 'باقة أعمال', '$340', 'قيد التنفيذ', '2026/09/27'],
      ['ليلى حسن', 'باقة مبتدئ', '$29', 'مكتمل', '2026/09/26'],
      ['عمر فؤاد', 'باقة مؤسسة', '$999', 'معلق', '2026/09/25'],
      ['نور الدين', 'باقة احترافية', '$120', 'مكتمل', '2026/09/24'],
    ],
    striped: true, hoverable: true, showTitle: true, showHeader: true, rounded: true,
  }),
  tabs: () => ({
    items: [
      { id: uid(), label: 'نظرة عامة', icon: 'Eye', desc: 'ملخص سريع لأهم المؤشرات والأداء العام خلال الأسبوع.' },
      { id: uid(), label: 'التحليلات', icon: 'BarChart3', desc: 'تفاصيل الزيارات والتفاعل ومصادر الجمهور.' },
      { id: uid(), label: 'الإعدادات', icon: 'Settings', desc: 'تخصيص التفضيلات والإشعارات والصلاحيات.' },
    ],
    tabStyle: 'pill', fullWidth: false,
  }),
  pricing: () => ({
    title: 'باقات تناسب الجميع',
    subtitle: 'اختر الخطة المناسبة لك وابدأ خلال دقائق',
    plans: [
      { id: uid(), name: 'المبتدئ', price: '0', period: 'للأبد', features: ['3 قوالب', 'ثيمات أساسية', 'تصدير HTML'], icon: 'Leaf', featured: false, cta: 'ابدأ مجاناً' },
      { id: uid(), name: 'المحترف', price: '19', period: 'شهرياً', features: ['قوالب غير محدودة', 'كل الثيمات', 'تصدير React', 'حركات متقدمة', 'دعم أولوية'], icon: 'Rocket', featured: true, cta: 'اشترك الآن' },
      { id: uid(), name: 'المؤسسات', price: '49', period: 'شهرياً', features: ['كل مزايا المحترف', 'فريق متعدد', 'API كامل', 'دعم مخصص 24/7'], icon: 'Building2', featured: false, cta: 'تواصل معنا' },
    ],
    columns: 3, showTitle: true,
  }),
  testimonials: () => ({
    title: 'ماذا يقول عملاؤنا',
    items: [
      { id: uid(), label: 'ريم العتيبي', value: 'مديرة تسويق', desc: 'أفضل أداة جربتها لبناء القوالب — وفّرت علينا أسابيع من العمل.', badge: '5' },
      { id: uid(), label: 'خالد منصور', value: 'مطور واجهات', desc: 'التصدير إلى React نظيف ومنظم، أدمجه في مشاريعي مباشرة.', badge: '5' },
      { id: uid(), label: 'هدى الشمري', value: 'صاحبة متجر', desc: 'صممت متجراً كاملاً بثيم مخصص في أقل من ساعة!', badge: '4' },
    ],
    columns: 3, style: 'card', showTitle: true,
  }),
  gallery: () => ({
    title: 'من أعمالنا',
    items: [
      { id: uid(), label: 'هوية بصرية', icon: 'Palette' },
      { id: uid(), label: 'تطبيق جوال', icon: 'Smartphone' },
      { id: uid(), label: 'متجر إلكتروني', icon: 'Store' },
      { id: uid(), label: 'لوحة تحكم', icon: 'LayoutDashboard' },
      { id: uid(), label: 'موقع تعريفي', icon: 'Globe' },
      { id: uid(), label: 'نظام حجوزات', icon: 'CalendarDays' },
    ],
    columns: 3, aspect: 'square', hoverEffect: 'zoom', showTitle: true,
  }),
  list: () => ({
    title: 'المهام الأخيرة',
    items: [
      { id: uid(), label: 'مراجعة تصميم الصفحة الرئيسية', icon: 'Eye', badge: 'اليوم', desc: 'بواسطة فريق التصميم' },
      { id: uid(), label: 'تحديث واجهة الدفع', icon: 'CreditCard', badge: 'غداً', desc: 'أولوية عالية' },
      { id: uid(), label: 'إضافة لغة جديدة', icon: 'Languages', badge: 'هذا الأسبوع', desc: 'الإنجليزية' },
      { id: uid(), label: 'اختبار الأداء على الجوال', icon: 'Gauge', badge: 'مكتمل', desc: 'نتيجة 98/100' },
    ],
    divided: true, showIcons: true, showBadges: true, showTitle: true, itemShape: 'rounded',
  }),
  cta: () => ({
    title: 'جاهز لإطلاق مشروعك القادم؟',
    subtitle: 'انضم الآن واحصل على أول قالب مجاناً — بدون بطاقة ائتمانية.',
    button: { label: 'ابدأ مجاناً', icon: 'ArrowLeft', show: true },
    secondary: { label: 'تحدث معنا', icon: 'MessageCircle', show: false },
    bgStyle: 'gradient',
  }),
  footer: () => ({
    brand: 'ستوديو', brandIcon: 'Sparkles',
    about: 'منصة متكاملة لتصميم قوالب وثيمات React احترافية بسهولة تامة.',
    columns: [
      { id: uid(), label: 'المنتج', icon: '', items: ['المزايا', 'الثيمات', 'الأسعار', 'التحديثات'] },
      { id: uid(), label: 'الشركة', icon: '', items: ['من نحن', 'المدونة', 'الوظائف', 'تواصل معنا'] },
      { id: uid(), label: 'الدعم', icon: '', items: ['مركز المساعدة', 'الوثائق', 'حالة النظام', 'الخصوصية'] },
    ],
    socials: [
      { id: uid(), label: 'تويتر', icon: 'Twitter' },
      { id: uid(), label: 'github', icon: 'Github' },
      { id: uid(), label: 'لينكدإن', icon: 'Linkedin' },
      { id: uid(), label: 'يوتيوب', icon: 'Youtube' },
    ],
    copyright: '© 2026 ستوديو القوالب — جميع الحقوق محفوظة',
    showSocials: true, showColumns: true,
  }),
  search: () => ({
    placeholder: 'ابحث عن أي شيء…',
    buttonLabel: 'بحث', buttonIcon: 'Search', showButton: true,
    suggestions: ['قوالب', 'ثيمات داكنة', 'متاجر', 'لوحات تحكم'], showSuggestions: true, size: 'lg',
  }),
  profile: () => ({
    name: 'ريما الحربي', role: 'مصممة منتجات أولى',
    avatarIcon: 'UserRound', initials: 'RH',
    bio: 'شغوفة بتصميم تجارب رقمية بسيطة وجميلة. أكثر من 8 سنوات في بناء المنتجات.',
    stats: [
      { id: uid(), label: 'مشروع', value: '128' },
      { id: uid(), label: 'متابع', value: '12K' },
      { id: uid(), label: 'تقييم', value: '4.9' },
    ],
    actions: [
      { id: uid(), label: 'متابعة', icon: 'UserPlus' },
      { id: uid(), label: 'مراسلة', icon: 'MessageCircle' },
    ],
    cover: 'gradient', layout: 'centered',
  }),
  alert: () => ({
    kind: 'info', text: 'تم حفظ القالب بنجاح — يمكنك تصديره في أي وقت.',
    icon: 'Info', closable: true, showIcon: true, title: 'تنبيه',
  }),
  buttons: () => ({
    items: [
      { id: uid(), label: 'زر أساسي', icon: 'Sparkles', badge: 'solid' },
      { id: uid(), label: 'زر ثانوي', icon: 'Bookmark', badge: 'outline' },
      { id: uid(), label: 'زر ناعم', icon: 'Zap', badge: 'soft' },
      { id: uid(), label: 'زر متدرج', icon: 'Rocket', badge: 'gradient' },
    ],
    size: 'md', shape: 'theme', row: true,
  }),
  text: () => ({
    heading: 'عنوان القسم',
    body: 'هذا نص تعريفي للقسم يمكن تعديله بالكامل. استخدمه لتقديم محتوى أو شرح ميزة أو سرد قصة علامتك التجارية بأسلوب جذاب.',
    headingSize: 'lg', showHeading: true, align: 'start', twoColumns: false,
  }),
};

/** أنواع الأعمدة الخاصة بالمكوّن (للقوائم القابلة للتحرير) */
export function makeNode(type: CompType, overrides?: Partial<CompNode>): CompNode {
  return {
    id: uid(),
    type,
    title: COMP_LABELS[type],
    props: COMP_DEFAULTS[type](),
    style: defaultStyle(),
    anim: defaultAnim(),
    ...overrides,
  };
}

/* ============================================================
   بُناة التخطيطات الستة
   ============================================================ */

function chrome(kind: LayoutKind): Pick<Layout, 'topbar' | 'sidebar' | 'bottombar'> {
  const base = { topbar: makeNode('topbar'), sidebar: null, bottombar: null };
  switch (kind) {
    case 'dashboard':
      return { ...base, sidebar: makeNode('sidebar') };
    case 'mobile': {
      const tb = makeNode('topbar');
      tb.props.links = tb.props.links.slice(0, 2);
      tb.props.showSearch = false;
      return { ...base, topbar: tb, bottombar: makeNode('bottombar') };
    }
    case 'portfolio': {
      const sb = makeNode('sidebar');
      sb.props.items = [
        { id: uid(), label: 'نبذة', icon: 'UserRound', active: true },
        { id: uid(), label: 'المهارات', icon: 'Wrench' },
        { id: uid(), label: 'الأعمال', icon: 'Images' },
        { id: uid(), label: 'المدونة', icon: 'NotebookPen' },
        { id: uid(), label: 'تواصل', icon: 'Send' },
      ];
      return { ...base, topbar: null, sidebar: sb };
    }
    default:
      return base;
  }
}

export function buildLayout(kind: LayoutKind): Layout {
  const sections: CompNode[] = [];
  const push = (n: CompNode, anim?: string, i?: number) => {
    if (anim) { n.anim = { ...n.anim, type: anim, trigger: 'load', delay: i ? i * 90 : 0 }; }
    sections.push(n);
  };
  switch (kind) {
    case 'dashboard':
      push(makeNode('stats'), 'fade-up', 0);
      push(makeNode('cards'), 'fade-up', 1);
      push(makeNode('table'), 'fade-up', 2);
      push(makeNode('cta'), 'zoom-in', 3);
      break;
    case 'landing':
      push(makeNode('hero'), 'fade-up');
      push(makeNode('cards'), 'fade-up', 1);
      push(makeNode('pricing'), 'fade-up', 2);
      push(makeNode('testimonials'), 'fade-up', 3);
      push(makeNode('cta'), 'zoom-in');
      push(makeNode('footer'));
      break;
    case 'mobile': {
      const hero = makeNode('hero');
      hero.props.minHeight = 300;
      hero.props.title = 'كل ما تحتاجه بمتناول يدك';
      push(hero, 'fade-down');
      push(makeNode('search'), 'fade');
      push(makeNode('cards'), 'fade-up', 1);
      const list = makeNode('list');
      push(list, 'fade-up', 2);
      break;
    }
    case 'shop': {
      const hero = makeNode('hero');
      hero.props.title = 'تشكيلة الخريف وصلت';
      hero.props.subtitle = 'خصومات حتى 40% على كل المنتجات — لفترة محدودة.';
      hero.props.cta1 = { label: 'تسوق الآن', icon: 'ShoppingCart', show: true };
      push(hero, 'fade-up');
      push(makeNode('gallery'), 'zoom-in', 1);
      push(makeNode('cards'), 'fade-up', 2);
      push(makeNode('testimonials'), 'fade-up', 3);
      push(makeNode('footer'));
      break;
    }
    case 'blog': {
      const hero = makeNode('hero');
      hero.props.title = 'قصص وأفكار تستحق القراءة';
      hero.props.subtitle = 'مقالات أسبوعية في التصميم والتقنية وريادة الأعمال.';
      hero.props.cta1 = { label: 'اقرأ أحدث مقال', icon: 'BookOpen', show: true };
      hero.props.cta2 = { label: 'اشترك بالنشرة', icon: 'Mail', show: true };
      push(hero, 'fade-up');
      push(makeNode('cards'), 'fade-up', 1);
      push(makeNode('list'), 'fade-up', 2);
      push(makeNode('cta'), 'zoom-in');
      push(makeNode('footer'));
      break;
    }
    case 'portfolio':
      push(makeNode('profile'), 'zoom-in');
      push(makeNode('stats'), 'fade-up', 1);
      push(makeNode('gallery'), 'fade-up', 2);
      {
        const f = makeNode('form');
        f.props.title = 'تواصل معي';
        f.props.subtitle = 'لديك فكرة مشروع؟ دعنا نتحدث!';
        push(f, 'fade-up', 3);
      }
      push(makeNode('footer'));
      break;
  }
  return { ...chrome(kind), sections };
}

/* ============================================================
   مستند قالب كامل
   ============================================================ */

export function makeTemplateDoc(theme: ThemeCfg, kind: LayoutKind): TemplateDoc {
  return { version: 1, theme, layout: buildLayout(kind) };
}
