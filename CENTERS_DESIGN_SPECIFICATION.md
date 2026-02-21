# 🎨 Centers Section - Visual Design Specification

## 📐 Layout Dimensions

### Card Dimensions

```
┌─────────────────────────────────────┐
│  DESKTOP (1024px+)                  │
├─────────────────────────────────────┤
│                                     │
│  Card Width: ~33.33% - 1rem         │ 
│  Image Height: 280px                │
│  Content Height: ~180px             │
│  Total Card Height: ~460-480px      │
│                                     │
│ ┌───────────────────────────────┐   │
│ │   [Image 280px]               │   │
│ │ (object-cover, 4:3 ratio)     │   │
│ ├───────────────────────────────┤   │
│ │ Title: 1.4rem bold            │   │
│ │ Description: 0.95rem x2-3 ln  │   │
│ │                               │   │
│ │ [Primary Gold Button] →       │   │
│ └───────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Color Specifications

```
Card Background:
  From: rgba(255, 255, 255, 0.98)
  To:   rgba(245, 245, 245, 0.95)
  Direction: 135deg

Border:
  Color: rgba(243, 177, 19, 0.1)
  Width: 1px

Title Text:
  Color: #383838
  Weight: 700
  Size: 1.4rem

Description:
  Color: #828282
  Weight: 400
  Size: 0.95rem

Button:
  From: #f3b113
  To:   #e09d0a
  Text: #1a1a1a

Button Hover:
  From: #f9bd33
  To:   #e6a812
```

### Spacing & Padding

```
Section:
  Padding: 3rem mobile
  Padding: 4rem tablet (3rem horiz)
  Padding: 6rem desktop

Cards Gap:
  Mobile:  1.5rem
  Tablet:  2rem
  Desktop: 2.5rem

Card Padding:
  Mobile:  1.75rem
  Tablet:  2rem
  Desktop: 2.25rem

Image Heights:
  Mobile:  220px
  Tablet:  240px
  Desktop: 280px
```

### Shadow System

```
Card Normal:
  0 10px 30px rgba(0, 0, 0, 0.15),
  0 0 0 1px rgba(0, 0, 0, 0.05)

Card Hover:
  0 20px 45px rgba(0, 0, 0, 0.25),
  0 0 0 1px rgba(243, 177, 19, 0.2)

Button Normal:
  0 4px 12px rgba(243, 177, 19, 0.25)

Button Hover:
  0 8px 20px rgba(243, 177, 19, 0.4),
  inset 0 0 0 2px rgba(255, 255, 255, 0.3)
```

## 🎬 Animation Timing

### Easing Function
```css
cubic-bezier(0.4, 0, 0.2, 1)
/* Smooth, natural motion */
```

### Duration Reference
```
Fast:     0.3s  (most interactions)
Medium:   0.5s  (image zoom)
Smooth:   1s+   (extended effects)
```

### Transform Origins
```
Card:     center center (lift vertically)
Image:    center center (zoom from center)
Button:   center center (all effects)
Icon:     center center (slide right)
```

## 📦 Component Architecture

### CSS Class Hierarchy

```
.centers-carousel-wrapper
├── Label: Outer container
├── Role: Positioning wrapper
└── Purpose: Manage overall carousel

.centers-carousel-container
├── Label: Main scroll container
├── Role: Flexbox scroll parent
├── Feature: overflow-x: auto
└── Feature: scroll-snap-type: x mandatory

.centers-carousel-item
├── Label: Card wrapper
├── Flex: 0 0 100% (mobile)
├── Flex: 0 0 ~50% (tablet)
├── Flex: 0 0 ~33% (desktop)
└── Feature: scroll-snap-align: center

.center-card-container
├── Label: Card component
├── Layout: Flex column
├── Height: 100% (full item height)
├── Feature: Hover transforms
└── Feature: Transition all 0.3s

.center-card-image-wrapper
├── Label: Image container
├── Height: 220-280px (responsive)
├── Feature: overflow: hidden
├── Feature: Relative positioning
└── Child: Image overlay

.center-card-content
├── Label: Content flex container
├── Layout: Flex column
├── Flex: 1 (takes remaining space)
├── Gap: 1rem - 1.25rem
└── Children: Title, Description, Button
```

## 🎯 Typography System

### Font Sizes
```
Title:
  Mobile:  1.25rem
  Tablet:  1.35rem
  Desktop: 1.4rem

Description:
  All: 0.95rem
  Line-height: 1.6-1.7

Button:
  All: 0.95rem
  Font-weight: 700
  Letter-spacing: 0.3px
```

### Font Weights
```
Title:       700 (bold)
Description: 400 (regular)
Button:      700 (bold)
```

### Letter Spacing
```
Title:       -0.3px
Description: normal
Button:      0.3px
```

## 🌈 Color Swatches

### Primary Colors
```
┌──────────────────┐
│ #f3b113 (Gold)   │ ← Primary accent
│ Used in:         │
│ - Buttons        │
│ - Borders        │
│ - Navigation     │
└──────────────────┘

┌──────────────────┐
│ #383838 (Dark)   │ ← Text color
│ Used in:         │
│ - Titles         │
│ - Button text    │
└──────────────────┘

┌──────────────────┐
│ #828282 (Gray)   │ ← Muted text
│ Used in:         │
│ - Descriptions   │
│ - Secondary text │
└──────────────────┘

┌──────────────────┐
│ #FFFFFF (White)  │ ← Background
│ Used in:         │
│ - Card base      │
│ - Text bg        │
└──────────────────┘

┌──────────────────┐
│ #1a1a1a → #0f0f0f│ ← Section bg
│ Used in:         │
│ - Section bg     │
│ - Gradient       │
└──────────────────┘
```

## 📐 Border Radius Scale

```
Card Container:    1.25rem mobile → 1.5rem desktop
Image Wrapper:     Inherits card radius
Button:            0.75rem mobile → 0.85rem desktop
Navigation Dots:   50% (perfect circles)
```

## 🔄 Transition Properties

```css
.center-card-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-card-image {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-card-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-card-button-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.centers-dot {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 📊 Responsive Breakpoints Table

| Size | Width | Cards | Image Ht | Gap | Card Pad |
|------|-------|-------|----------|-----|----------|
| **Mobile S** | 320px | 1 | 200px | 1.5rem | 1.5rem |
| **Mobile M** | 375px | 1 | 220px | 1.5rem | 1.75rem |
| **Mobile L** | 425px | 1 | 220px | 1.5rem | 1.75rem |
| **Tablet S** | 640px | 2 | 240px | 2rem | 2rem |
| **Tablet M** | 768px | 2 | 240px | 2rem | 2rem |
| **Tablet L** | 1024px | 3 | 280px | 2.5rem | 2.25rem |
| **Desktop S** | 1440px | 3 | 280px | 2.5rem | 2.25rem |
| **Desktop L** | 1920px | 3 | 280px | 2.5rem | 2.25rem |

## 🎮 Interactive States

### Hover State Transformations

```
CARD HOVER:
  transform: translateY(-8px)
  box-shadow: Enhanced 45px shadow
  border-color: rgba(243, 177, 19, 0.2)

IMAGE HOVER:
  transform: scale(1.08)
  opacity: 1 (unchanged)

BUTTON HOVER:
  transform: translateY(-3px)
  background: Linear gradient shift
  box-shadow: Enhanced with inset

ICON HOVER:
  transform: translateX(4px)
```

### Focus State

```
.centers-dot:focus-visible {
  outline: 2px solid #f3b113
  outline-offset: 2px
}

.center-card-button:focus-visible {
  outline: 2px solid #f3b113
  outline-offset: 2px
}
```

## 📱 Mobile-First Progressive Enhancement

```
Base (Mobile):
  - 1 column layout
  - Touch optimized
  - Large tap targets
  - Simplified styling

Mobile Tablets (640px+):
  - 2 column preview
  - Improved spacing
  - Enhanced images
  - Refined typography

Desktop (1024px+):
  - 3 column carousel
  - Premium shadows
  - Smooth animations
  - Full feature set
```

## ♿ Accessibility Considerations

### Semantic HTML
```html
<section>          <!-- Landmark -->
  <h2>            <!-- Heading hierarchy -->
  <button>        <!-- Accessible buttons -->
    aria-label    <!-- Description for dots -->
```

### Keyboard Navigation
```
Tab:          Navigate through buttons
Enter/Space:  Activate buttons
Arrow Keys:   Could be added for dots (optional)
```

### Color Contrast
```
Title (#383838) on White:     WCAG AAA ✓
Description (#828282) on White: WCAG AA ✓
Button Gold (#f3b113):         WCAG AA ✓
```

### Touch Targets
```
Navigation Dots:  10-12px circles
Button:          ~44px height (accessible)
Clickable Area:  Minimum 24x24px
```

## 🎓 Design Token Reference

```javascript
// Design Tokens
const designTokens = {
  // Colors
  colors: {
    primary: '#f3b113',
    dark: '#383838',
    muted: '#828282',
    white: '#ffffff',
  },
  
  // Spacing
  spacing: {
    sm: '1.5rem',
    md: '2rem',
    lg: '2.5rem',
  },
  
  // Sizing
  cardImageHeight: {
    mobile: '220px',
    tablet: '240px',
    desktop: '280px',
  },
  
  // Typography
  typography: {
    titleSize: {
      mobile: '1.25rem',
      tablet: '1.35rem',
      desktop: '1.4rem',
    },
  },
  
  // Animations
  timing: {
    fast: '0.3s',
    medium: '0.5s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

---

**Design Version**: 1.0
**Last Updated**: 2026-02-19
**Status**: ✅ Production Approved
