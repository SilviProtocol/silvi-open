# Treekipedia Style Guide

This document outlines the standardized styles, typography, colors, and components used across the Treekipedia application. It serves as a reference for maintaining consistent design and branding.

## Overview

Treekipedia follows a cohesive design system with these key characteristics:

1. **Dark Mode Interface** - Deep black backgrounds with semi-transparent cards and frosted glass effects
2. **Emerald Accent Colors** - Primary emerald green accents that represent the forestry and environmental nature of the platform
3. **Card-Based Layout** - Content is organized into distinct cards with consistent styling
4. **Standardized Typography** - Consistent font sizes, weights, and colors across the application
5. **Uniform Rounded Corners** - All containers and interactive elements have rounded borders (rounded-xl)
6. **Backdrop Blur Effects** - Semi-transparent backgrounds with backdrop blur for a modern, frosted glass effect

All UI elements should follow this guide to maintain visual consistency across the application.

## Typography

### Font Hierarchy

| Element Type       | Class Name              | Font Size    | Font Weight | Color                  | Line Height  |
|--------------------|-------------------------|--------------| ------------|------------------------|--------------|
| Page Title         | `text-4xl font-bold`    | 2.25rem (36px) | Bold (700)  | `text-white`           | 1.2          |
| Section Heading    | `text-3xl font-bold`    | 1.875rem (30px) | Bold (700)  | `text-emerald-300`     | 1.2          |
| Card Heading       | `text-xl font-bold`     | 1.25rem (20px) | Bold (700)  | `text-emerald-300`     | 1.2          |
| Body Text          | `text-lg leading-relaxed` | 1.125rem (18px) | Normal (400) | `text-white`       | 1.6          |
| Secondary Text     | `text-base`             | 1rem (16px)   | Normal (400) | `text-white/80`       | 1.5          |
| Small Text         | `text-sm`               | 0.875rem (14px) | Normal (400) | `text-white/70`     | 1.4          |
| Emphasis Text      | `text-lg font-medium`   | 1.125rem (18px) | Medium (500) | `text-emerald-300`  | 1.5          |

### Font Application Guidelines

- **Page titles**: Used for main page identifiers
- **Section headings**: Used for major content divisions
- **Card headings**: Used for individual card titles or feature names
- **Body text**: Primary content text throughout the application
- **Secondary text**: Supporting information and descriptions
- **Small text**: UI elements, captions, and metadata
- **Emphasis text**: Important statements or highlights within body content

## Color Palette

### Primary Colors

| Color Name     | Hex Code  | Tailwind Class          | Usage                                |
|----------------|-----------|-------------------------|--------------------------------------|
| Emerald Primary | `#10b981` | `text-emerald-500`      | Primary brand color, call to actions |
| Emerald Light   | `#6ee7b7` | `text-emerald-300`      | Headings, highlights                 |
| White           | `#ffffff` | `text-white`            | Primary text                         |
| White 80%       | `#ffffffcc` | `text-white/80`       | Secondary text                       |
| White 20%       | `#ffffff33` | `border-white/20`     | Subtle borders                       |
| Black 30%       | `#0000004d` | `bg-black/30`         | Card backgrounds                     |

### Interactive State Colors

| State         | Background              | Text                     | Border                   |
|---------------|-------------------------|--------------------------|--------------------------|
| Default       | `bg-emerald-600/80`     | `text-white`             | `border-white/20`        |
| Hover         | `bg-emerald-600`        | `text-white`             | `border-emerald-400/40`  |
| Active        | `bg-emerald-700`        | `text-white`             | `border-emerald-500`     |
| Disabled      | `bg-gray-600/50`        | `text-white/50`          | `border-white/10`        |
| Error         | `bg-red-600/80`         | `text-white`             | `border-red-500`         |
| Success       | `bg-green-600/80`       | `text-white`             | `border-green-500`       |

## Card System

### Standard Card

```html
<div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
  <!-- Card content -->
</div>
```

### Card Properties

- **Padding**: `p-5` (1.25rem/20px on all sides)
- **Border radius**: `rounded-xl` (0.75rem/12px)
- **Background**: `bg-black/30` (30% opacity black)
- **Backdrop effect**: `backdrop-blur-md` (medium blur effect)
- **Border**: `border border-white/20` (1px white border at 20% opacity)
- **Text color**: `text-white` (white text)

### Card Content Structure

For feature cards with icons:
```html
<div className="flex flex-col">
  <div className="flex items-center mb-3">
    <div className="text-5xl mr-3"><!-- Icon --></div>
    <h3 className="text-xl font-bold text-emerald-300"><!-- Heading --></h3>
  </div>
  <p className="text-white text-lg leading-relaxed">
    <!-- Body text -->
  </p>
</div>
```

For informational cards:
```html
<div>
  <h2 className="text-3xl font-bold mb-4 text-emerald-300"><!-- Heading --></h2>
  <p className="text-white text-lg leading-relaxed">
    <!-- Body text -->
  </p>
</div>
```

## Spacing System

- **Card spacing**: `gap-4` (1rem) for grid layouts, `gap-5` (1.25rem) for larger screens
- **Section spacing**: `py-8 md:py-10` (2rem top and bottom, 2.5rem on medium screens)
- **Content spacing**: `mb-3` (0.75rem) between heading and content
- **Icon spacing**: `mr-3` (0.75rem) between icons and text
- **Paragraph spacing**: `mt-4` (1rem) between paragraphs

## Button System

### Primary Button

```html
<button className="px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors">
  Button Text
</button>
```

### Button Properties

- **Padding**: `px-6 py-3` (1.5rem horizontal, 0.75rem vertical)
- **Background**: `bg-emerald-600/80` (emerald with 80% opacity)
- **Hover state**: `hover:bg-emerald-600` (solid emerald color)
- **Border radius**: `rounded-xl` (0.75rem/12px)
- **Text**: `text-white font-semibold` (white, semi-bold text)
- **Transitions**: `transition-colors` (smooth color transitions)

## Search Input

```html
<input
  className="w-full px-6 py-4 rounded-xl bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 text-silvi-mint placeholder-silvi-mint/70 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400/50 outline-none shadow-[0_0_15px_rgba(52,211,153,0.15)] transition-all duration-300 hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
  placeholder="Search over 50,000 tree species..."
/>
```

## Layout Guidelines

- **Maximum content width**: `max-w-3xl` (48rem) for text content, `max-w-2xl` (42rem) for input elements
- **Container padding**: `px-4 md:px-6` (1rem on small screens, 1.5rem on medium screens)
- **Responsive breakpoints**:
  - Mobile: Default
  - Tablet: `md:` (768px)
  - Desktop: `lg:` (1024px)

## Implementation Checklist

When implementing or updating a UI component, ensure it follows these guidelines:

1. **Typography** 
   - [ ] Uses the appropriate font size from the typography hierarchy
   - [ ] Uses emerald-300 for headings
   - [ ] Uses consistent font weights (bold for headings, normal for body text)
   - [ ] Uses appropriate text colors (white for primary, white/80 for secondary)

2. **Containers**
   - [ ] Uses rounded-xl for borders
   - [ ] Implements bg-black/30 backdrop-blur-md for card backgrounds
   - [ ] Uses border border-white/20 for standard borders
   - [ ] Uses consistent padding (p-5 for cards, p-4 for inner cards)

3. **Interactive Elements**
   - [ ] Buttons use the standard button styles with emerald-600/80 backgrounds
   - [ ] Hover states are defined with appropriate transitions
   - [ ] Focus states are clearly visible
   - [ ] Active states provide feedback

4. **Spacing**
   - [ ] Uses consistent margin between elements (mb-3 between heading and content)
   - [ ] Uses gap-4 or gap-5 for grid layouts
   - [ ] Uses consistent section spacing (py-8 md:py-10 for sections)

5. **Components**
   - [ ] Feature cards follow the standard card design
   - [ ] Research cards follow the specialized research card design
   - [ ] Buttons follow the button style guidelines
   - [ ] Form inputs follow the input style guidelines

## Component-Specific Styles

### Research Card

The Research Card component uses the standardized styles with specific semantics:

```jsx
<div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-6 text-white mb-6 sticky top-4">
  <h2 className="text-xl font-bold mb-4 flex items-center text-emerald-300">
    <Leaf className="w-5 h-5 mr-2" />
    Tree Intelligence Commons
  </h2>
  
  {/* Card content */}
  <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
    <div className="mb-3 text-xl font-bold text-emerald-300">AI Research Complete</div>
    <p className="text-white text-lg leading-relaxed mb-2">
      Description text here...
    </p>
  </div>
  
  {/* Steps list */}
  <div className="space-y-3 text-base">
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">1</div>
      <p className="text-white/80">Step description</p>
    </div>
  </div>
</div>
```

### Sponsorship Button

```jsx
<Button
  className="px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
>
  {buttonText}
</Button>
```

### Navbar

The Navbar component features:

```jsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-silvi-mint/20 shadow-md">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Logo and Navigation */}
      <div className="flex items-center">
        <Link href="/">
          <img src="/treekipedialogo.svg" alt="Treekipedia" className="h-8" />
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex ml-6 space-x-6">
          <Link className="text-silvi-mint hover:text-emerald-300 font-medium transition-colors">
            Link Text
          </Link>
        </div>
      </div>
      
      {/* Right side elements */}
      <div className="flex items-center space-x-4">
        {/* Buttons and mobile menu */}
      </div>
    </div>
  </div>
</nav>
```

## Usage Examples

### Feature Card

```jsx
<div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
  <div className="flex flex-col">
    <div className="flex items-center mb-3">
      <div className="text-5xl mr-3">🌳</div>
      <h3 className="text-xl font-bold text-emerald-300">Discover Tree Species</h3>
    </div>
    <p className="text-white text-lg leading-relaxed">
      Browse over 50,000 species with structured data on taxonomy, ecology, and habitat.
    </p>
  </div>
</div>
```

### Information Section

All information sections now follow the standardized card format with icon, heading, and content:

```jsx
<div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
  <div className="flex flex-col">
    <div className="flex items-center mb-3">
      <div className="text-5xl mr-3">📚</div>
      <h3 className="text-xl font-bold text-emerald-300">No paywalls. No gatekeeping.</h3>
    </div>
    <p className="text-white text-lg leading-relaxed">
      Treekipedia is an open-source, AI-powered database of tree knowledge. It's built for land stewards, restoration practitioners, and anyone trying to understand which trees grow where, and why that matters.
    </p>
  </div>
</div>
```

### Call-to-Action Section

For sections with buttons or links:

```jsx
<div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
  <div className="flex flex-col">
    <div className="flex items-center mb-3">
      <div className="text-5xl mr-3">📍</div>
      <h3 className="text-xl font-bold text-emerald-300">This is just the beginning.</h3>
    </div>
    <p className="text-white text-lg leading-relaxed mb-6">
      Future versions will unlock collaborative editing, decentralized validation, open APIs, 
      and integrations with climate and biodiversity platforms.
    </p>
    <div className="flex justify-start">
      <Link 
        href="/about"
        className="inline-flex px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
      >
        Learn About Our Mission
      </Link>
    </div>
  </div>
</div>
```