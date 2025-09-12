# Dashboard Transformation Decisions

## Design Philosophy
**Target**: Premium construction management dashboard rivaling Procore/BuilderTrend ($300/month products)
**Approach**: Delete existing, build exceptional from scratch
**Focus**: Visual excellence first, functionality second

## Key Design Decisions

### Visual Excellence
- Glass morphism with enhanced backdrop blur (20px)
- Dark mode only with graphite color palette
- Gradient overlays on all cards
- Framer Motion for all animations
- Mobile-first approach (320px baseline)

### Widget Architecture
1. **Bento Grid Layout**: Responsive grid system with variable spanning
2. **Touch Targets**: Minimum 48px on mobile
3. **Loading States**: Skeleton with shimmer animation
4. **Empty States**: Illustrated, not just text
5. **Error States**: Graceful degradation

### Performance Targets
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Bundle size increase: <250KB
- Lighthouse score: >90
- 60fps animations

### Mobile Strategy
- Drawer sheets instead of modals
- Bottom sheets for mobile modals (vaul library)
- Card stack for tasks (Apple Wallet style)
- Radial FAB menu (56px diameter)
- Swipe gestures for task management

## Research Insights
*To be updated as research progresses*

## Implementation Notes
- All widgets must have hover states with scale(1.02)
- Entry animations are mandatory (stagger children)
- Progress indicators use rings, not bars
- Weather integration includes work impact analysis
- Role-based content filtering throughout