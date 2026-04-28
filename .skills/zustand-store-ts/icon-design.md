# Icon Design

Select the right icon for the job. Maps concepts to icons, provides templates, prevents common mistakes.

## Quick Reference (Top 20 Concepts)

| Concept | Lucide | Heroicons | Phosphor |
|---------|--------|-----------|----------|
| Award/Quality | `Trophy` | `trophy` | `Trophy` |
| Price/Value | `Tag` | `tag` | `Tag` |
| Location | `MapPin` | `map-pin` | `MapPin` |
| Expertise | `GraduationCap` | `academic-cap` | `GraduationCap` |
| Support | `MessageCircle` | `chat-bubble-left-right` | `ChatCircle` |
| Security | `Shield` | `shield-check` | `Shield` |
| Speed | `Zap` | `bolt` | `Lightning` |
| Phone | `Phone` | `phone` | `Phone` |
| Email | `Mail` | `envelope` | `Envelope` |
| User/Profile | `User` | `user` | `User` |
| Team | `Users` | `user-group` | `Users` |
| Settings | `Settings` | `cog-6-tooth` | `Gear` |
| Home | `Home` | `home` | `House` |
| Search | `Search` | `magnifying-glass` | `MagnifyingGlass` |
| Check/Success | `Check` | `check` | `Check` |
| Close/Cancel | `X` | `x-mark` | `X` |
| Menu | `Menu` | `bars-3` | `List` |
| Calendar | `Calendar` | `calendar` | `Calendar` |
| Clock/Time | `Clock` | `clock` | `Clock` |
| Heart/Favourite | `Heart` | `heart` | `Heart` |

## Library Selection

| Library | Best For | Package |
|---------|----------|---------|
| **Lucide** | General use, React projects | `lucide-react` |
| **Heroicons** | Tailwind projects, minimal style | `@heroicons/react` |
| **Phosphor** | Weight variations needed | `@phosphor-icons/react` |

**Default recommendation**: Lucide (1,400+ icons, excellent React integration)

See `references/library-comparison.md` for detailed comparison.

## Icon Style Rules

### Sizing

| Context | Tailwind Class | Pixels |
|---------|----------------|--------|
| Inline with text | `w-4 h-4` or `w-5 h-5` | 16-20px |
| Feature cards | `w-8 h-8` | 32px |
| Hero sections | `w-10 h-10` or `w-12 h-12` | 40-48px |
| Large decorative | `w-16 h-16` | 64px |

### Consistency Rules

1. **Never mix styles** - Use all outline OR all solid in a section
2. **Never use emoji** - Use proper icon components (tree-shakeable)
3. **Use currentColor** - Icons inherit text color via `stroke="currentColor"`
4. **Semantic colours** - Use `text-primary`, not `text-blue-500`

### Tree-Shaking (Critical)

Dynamic icon selection breaks tree-shaking. Use explicit maps:

```tsx
// BAD - all icons bundled
import * as Icons from 'lucide-react'
const Icon = Icons[iconName]  // Tree-shaken away!

// GOOD - explicit map
import { Home, Users, Settings, type LucideIcon } from 'lucide-react'
const ICON_MAP: Record<string, LucideIcon> = { Home, Users, Settings }
const Icon = ICON_MAP[iconName]
```

## Selection Process

1. **Identify the concept** - What does the label/title communicate?
2. **Check semantic mapping** - See `references/semantic-mapping.md`
3. **Choose library** - Lucide (default), Heroicons (Tailwind), Phosphor (weights)
4. **Apply template** - See `references/icon-templates.md`
5. **Verify consistency** - Same style, same size in section

## Decision Tree

When unsure which icon:

```
Is it about recognition/awards? → Trophy, Star, Award
Is it about money/price? → Tag, DollarSign, CreditCard
Is it about location? → MapPin, Globe, Map
Is it about people/team? → Users, UserGroup, User
Is it about communication? → MessageCircle, Phone, Mail
Is it about safety/trust? → Shield, Lock, ShieldCheck
Is it about speed/time? → Zap, Clock, Timer
Is it trade-specific? → Check semantic-mapping.md
Still unsure? → CheckCircle (generic positive) or Sparkles (generic feature)
```

## Resources

- `references/semantic-mapping.md` - Full concept→icon tables by category
- `references/icon-templates.md` - React/HTML patterns with Tailwind
- `references/library-comparison.md` - Lucide vs Heroicons vs Phosphor
- `references/migration-guide.md` - FA/Material → modern equivalents
- `rules/icon-design.md` - Correction rules for projects


---

# Icon Design Rules

Correction rules for icon usage in React/TypeScript projects.

## Never Use Emoji for UI Icons

Emoji render inconsistently across platforms and can't be styled.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `<span>✅</span>` | `<Check className="w-4 h-4" />` |
| `<span>⚠️</span>` | `<AlertTriangle className="w-4 h-4" />` |
| `✉️ Email` | `<Mail className="w-4 h-4" /> Email` |
| `📍 Location` | `<MapPin className="w-4 h-4" /> Location` |

## Tree-Shaking Prevention

Dynamic icon access breaks tree-shaking, bundling ALL icons.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `import * as Icons from 'lucide-react'` | Named imports only |
| `Icons[iconName]` | Explicit `ICON_MAP` object |
| `require('lucide-react')[name]` | Static imports |

Correct pattern:

```tsx
import { Home, User, Settings, type LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  user: User,
  settings: Settings,
}

const Icon = ICON_MAP[iconName]
if (!Icon) throw new Error(`Unknown icon: ${iconName}`)
```

## Use Semantic Colours

Icons should use Tailwind v4 semantic tokens, not raw colours.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `className="text-blue-500"` | `className="text-primary"` |
| `className="text-gray-500"` | `className="text-muted-foreground"` |
| `className="text-red-500"` | `className="text-destructive"` |
| `stroke="#3B82F6"` | `className="text-primary"` (uses currentColor) |

## Consistent Sizing

Use standard size classes within a section.

| Context | Class | Notes |
|---------|-------|-------|
| Inline text | `w-4 h-4` or `w-5 h-5` | Match line height |
| Feature cards | `w-6 h-6` to `w-8 h-8` | Inside container |
| Hero sections | `w-10 h-10` to `w-12 h-12` | Decorative |

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| Mixed sizes in one section | Same size for all icons in section |
| `size={24}` (Phosphor) | `className="w-6 h-6"` (Tailwind) |
| `width="20" height="20"` | `className="w-5 h-5"` |

## Style Consistency

Never mix outline and solid icons in the same section.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `CheckIcon` (solid) next to `HomeIcon` (outline) | All outline OR all solid |
| Heroicons `/24/outline` mixed with `/24/solid` | Pick one style for section |
| Phosphor `weight="fill"` mixed with `weight="regular"` | Single weight per section |

## Heroicons Import Paths

Heroicons have specific import paths for sizes and styles.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `@heroicons/react/outline` | `@heroicons/react/24/outline` |
| `@heroicons/react/solid` | `@heroicons/react/24/solid` |
| `import { Home }` | `import { HomeIcon }` (suffix required) |

Correct patterns:

```tsx
// 24px outline (default)
import { HomeIcon } from '@heroicons/react/24/outline'

// 24px solid
import { HomeIcon } from '@heroicons/react/24/solid'

// 20px solid (mini)
import { HomeIcon } from '@heroicons/react/20/solid'
```

## Accessibility

Decorative icons need proper handling.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `<Icon />` (no label) | `<Icon aria-hidden="true" />` or with `aria-label` |
| Icon-only button without label | Add `aria-label="Description"` to button |

Correct patterns:

```tsx
// Decorative icon (alongside text)
<span className="flex items-center gap-2">
  <Phone aria-hidden="true" className="w-4 h-4" />
  <span>Call us</span>
</span>

// Icon-only button
<button aria-label="Open menu">
  <Menu className="w-6 h-6" />
</button>

// Meaningful standalone icon
<CheckCircle aria-label="Completed" className="w-5 h-5 text-green-500" />
```

## Lucide Wrapper Elements

Lucide icons don't accept HTML attributes like `title` directly.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `<Trophy title="Award" />` | `<span title="Award"><Trophy /></span>` |
| `<Icon aria-label="..." />` | Wrap in element with aria-label |

## currentColor Pattern

Icons should inherit colour from parent text.

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `stroke="#000000"` | Use default (currentColor) |
| `fill="blue"` | `className="text-primary"` |
| Hardcoded colours in SVG | Let CSS control via currentColor |