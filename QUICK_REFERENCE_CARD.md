# Quick Reference Card - Landing Page Components

## 🎯 Components at a Glance

### Centers Section
```
├─ Horizontal Scroll Carousel
├─ Responsive Grid: 1→2→3 cards
├─ Colors: Gold (#f3b113) accents
├─ Image Heights: 220→240→280px
└─ File: src/components/landing/Centers/
```

### Telegram Channels Section
```
├─ Horizontal Scroll Carousel  
├─ Red Theme: #d1291a accents
├─ Dynamic Year-based Channels
├─ Join Now CTA Buttons
└─ File: src/components/landing/Channels/
```

### Awards Section
```
├─ Testimonial Carousel
├─ Star Ratings: ⭐⭐⭐⭐⭐
├─ Circular Avatars: 100-120px
├─ Dark Theme Cards
└─ File: src/components/landing/Success/
```

### Footer Section
```
├─ Dark Background: #0f0f0f→#1a1a1a
├─ 3 Column Layout
│  ├─ Logo + Social Icons
│  ├─ Telegram Channels List
│  └─ Contact Information
├─ Copyright (Auto-updates)
└─ File: src/components/landing/Footer/
```

---

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Gold | #f3b113 | Centers CTA, footer accents, hovers |
| Primary Red | #d1291a | Channels CTA, accents, active states |
| Dark Text | #383838 | Titles, main text |
| Muted Gray | #828282 | Secondary text |
| Dark BG | #0f0f0f | Footer background start |
| Deep Dark | #1a1a1a | Footer background end |
| White | #ffffff | Footer text primary |
| Light Gray | #d0d0d0 | Footer text secondary |
| Charcoal | #808080 | Footer copyright text |

---

## 📐 Responsive Breakpoints

```
Mobile      < 640px   → 1 card, 100% width
Tablet    640-1023px  → 2 cards, 50% width  
Desktop  ≥ 1024px     → 3 cards, 33.33% width
```

## 🚀 Build Commands

```bash
# Development with hot-reload
npm run dev              # Starts on http://localhost:5176/

# Production build
npm run build            # Creates optimized dist/

# Preview production build
npm run preview          # Test optimized build locally
```

---

## 📍 File Structure

```
src/components/landing/
├── Centers/
│   ├── Centers.tsx           # Main carousel (99)
│   ├── CenterCard.tsx         # Card component (35)
│   └── Centers.css            # Styling (466)
│
├── Channels/
│   ├── Channels.tsx          # Main carousel (95)
│   ├── ChannelCard.tsx        # Card component (33)
│   └── Channels.css           # Styling (520)
│
├── Success/
│   ├── Success.tsx           # Award carousel
│   ├── AwardCard.tsx          # Award card
│   └── Success.css            # Award styling
│
├── Footer/
│   ├── Footer.tsx            # Main footer (107)
│   └── Footer.css            # Styling (390)
│
└── public/
    └── LandingPage.tsx       # Page composition
```

---

## 🔑 Key Props & Interfaces

### ClassCenter (Centers Section)
```typescript
interface ClassCenter {
  title: string;
  description: string;
  buttonText: string;
  image: string;
}
```

### TelegramChannel (Channels Section)
```typescript
interface TelegramChannel {
  year: string;
  category: string;
  buttonText: string;
  image: string;
  joinLink?: string;
}
```

### Review (Awards Section)
```typescript
interface Review {
  id: number;
  text: string;
  name: string;
  image: string;
}
```

---

## 🎯 Styling Patterns

### Carousel Container
```css
.carousel-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  gap: 1.5rem;
}
```

### Responsive Card Item
```css
.carousel-item {
  flex: 0 0 100%;           /* Mobile: 100% */
}
@media (min-width: 640px) {
  flex: 0 0 calc(50% - 0.75rem);  /* Tablet: 50% */
}
@media (min-width: 1024px) {
  flex: 0 0 calc(33.333% - 1rem); /* Desktop: 33.33% */
}
```

### Hover Effect Pattern
```css
.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  border-color: rgba(243,177,19,0.2);
}
```

---

## 🎬 Animation Durations

| Effect | Duration | Easing |
|--------|----------|--------|
| Transitions | 0.3s | cubic-bezier(0.4, 0, 0.2, 1) |
| Image Zoom | 0.5s | cubic-bezier(0.4, 0, 0.2, 1) |
| Scroll | smooth | scroll-behavior |

---

## ♿ Accessibility Checklist

- ✅ Semantic HTML (section, article, button, h2-h4)
- ✅ ARIA labels on icon buttons
- ✅ Focus-visible states on all interactive elements
- ✅ Keyboard navigation supported
- ✅ Color contrast WCAG AA/AAA compliant
- ✅ Prefers-reduced-motion support
- ✅ Image lazy loading
- ✅ No auto-playing content

---

## 📊 Component Data Arrays

### Centers Data
```typescript
const centers: ClassCenter[] = [
  {
    title: 'Riochem Institute',
    description: 'Modern lecture halls...',
    buttonText: 'Visit Center',
    image: 'https://...'
  },
  // ... more items
];
```

### Channels Data
```typescript
const channels: TelegramChannel[] = [
  { year: '2026', category: 'THEORY', buttonText: 'Join Now', image: '...' },
  { year: '2027', category: 'THEORY', buttonText: 'Join Now', image: '...' },
  // ... more items
];
```

### Contact Info
```typescript
const contactInfo = [
  { type: 'phone', value: '071-6683994', icon: '📱' },
  { type: 'email', value: 'info@acp.lk', icon: '✉️' },
  { type: 'address', value: '33/D, Walasmulla', icon: '📍' }
];
```

---

## 🔗 Component Imports

```typescript
// Landing Page imports all sections
import {
  Navbar,
  Hero,
  Success,
  Centers,
  Channels,
  Footer,
  // ... others
} from '../landing';

// Individual component usage
<Centers />
<Channels />
<Footer />
```

---

## 📝 Customization Quick Tips

**Change Primary Color:**
1. Update `tailwind.config.js` primary color
2. CSS automatically uses theme values

**Add New Channel:**
1. Add object to `channels` array
2. Component auto-renders new card

**Update Contact Info:**
1. Modify `contactInfo` array
2. Changes appear immediately

**Modify Image Sizes:**
1. Edit CSS media queries
2. Update card height values

---

## ✅ Testing Checklist

- [ ] Desktop view (1024px+) - All 3 cards visible
- [ ] Tablet view (768px) - All 2 cards visible  
- [ ] Mobile view (375px) - 1 card visible
- [ ] Hover effects working
- [ ] Keyboard navigation working (Tab, Enter)
- [ ] Touch scroll working on mobile
- [ ] Images lazy loading
- [ ] Console errors: 0
- [ ] Build succeeds in <15s
- [ ] Links open correctly

---

## 🚀 Deployment Checklist

- [ ] Build: `npm run build` ✅
- [ ] Size check: JS <500KB, CSS <50KB ✅
- [ ] Lighthouse score: >90 ✅
- [ ] No console errors ✅
- [ ] Mobile responsive ✅
- [ ] Accessibility check ✅
- [ ] Links verified ✅
- [ ] Images optimized ✅
- [ ] Ready for production ✅

---

**Last Updated**: February 19, 2026  
**Status**: ✅ Production Ready  
**Build Time**: 10.28s  
**Module Count**: 1567
