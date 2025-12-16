# Copilot Instructions for esp-serial

## Project Overview
Vue 3 + TypeScript + Vite application for ESP serial communication. This is a browser-based tool targeting modern Chromium and Firefox browsers with Web Serial API support.

## Tech Stack
- **Framework**: Vue 3.5+ with Composition API (`<script setup>`)
- **Build Tool**: Vite 7.x with HMR
- **Styling**: Tailwind CSS (configured for Vite)
- **Language**: TypeScript 5.9 (strict mode)
- **Runtime**: Node.js 20.19+ or 22.12+
- **Dev Tools**: Vue DevTools plugin enabled via `vite-plugin-vue-devtools`

## Project Structure
```
src/
  App.vue       - Root component
  main.ts       - App entry point
public/         - Static assets
index.html      - HTML entry (loads /src/main.ts)
```

## Development Workflows

### Commands
- `npm run dev` - Start dev server with HMR
- `npm run build` - Type-check + production build (runs in parallel)
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run vue-tsc type checking only

### Type Checking
- Uses `vue-tsc` instead of standard `tsc` for `.vue` file type support
- Project uses TypeScript project references (see `tsconfig.json`)
- Separate configs: `tsconfig.app.json` (app code), `tsconfig.node.json` (build config)

## Code Conventions

### Vue Components
- **Always use `<script setup lang="ts">`** - Composition API is the standard
- Keep components in `src/` directory
- Use scoped styles: `<style scoped>`
- Single File Components (.vue) follow this order: `<script>`, `<template>`, `<style>`

### TypeScript
- Import path alias `@/` maps to `src/` (configured in [vite.config.ts](vite.config.ts#L13))
- Use explicit types; avoid `any`
- `.vue` imports get type info from Volar/vue-tsc

### Tailwind CSS
- Use utility classes for styling (no custom CSS unless necessary)
- Responsive design with Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`)
- Component styles use Tailwind classes in template, not `<style>` blocks

### Browser APIs
- Target modern browsers (Chrome, Edge, Brave, Firefox)
- **Web Serial API** is core to the application
- Custom object formatters are enabled in recommended browser setup

## Key Integration Points

### Web Serial API Implementation
This app uses the WebSerial API for bidirectional serial communication:
- **Reading**: Display incoming serial messages from ESP devices
- **Writing**: Send messages/commands to serial devices
- **Transform Streams**: Use `TransformStream` for processing input/output
  - Simplifies data manipulation between serial port and UI
  - Example: Text encoding/decoding, line buffering, message parsing

### Serial Communication Pattern
```typescript
// Typical flow:
// 1. Request port: await navigator.serial.requestPort()
// 2. Open port: await port.open({ baudRate: 115200 })
// 3. Create transform streams for processing
// 4. Pipe port.readable through transforms to UI
// 5. Pipe UI input through transforms to port.writable
```

### Browser Permissions
- Serial port access requires user gesture (button click)
- Handle permission denials gracefully
- Port selection happens via browser's native picker

## Development Environment

### Required Extensions
- Vue (Official) - Volar language server for Vue 3
- Disable Vetur if installed (conflicts with Vue Official)

### Browser Setup
- Install Vue.js DevTools extension
- Enable Custom Object Formatters in DevTools settings

## Common Patterns

### Creating New Components
```vue
<script setup lang="ts">
// Component logic here
</script>

<template>
  <div class="p-4 bg-gray-100 rounded-lg">
    <!-- Use Tailwind utility classes -->
  </div>
</template>
```

### Transform Stream Pattern
```typescript
// Process serial data line-by-line
const lineBreakTransformer = new TransformStream({
  transform(chunk, controller) {
    // Split by newlines, buffer incomplete lines
    controller.enqueue(processedChunk)
  }
})

// Usage: port.readable.pipeThrough(lineBreakTransformer)
```

### Imports
```typescript
// Use @ alias for src imports
import MyComponent from '@/components/MyComponent.vue'
```

## Build & Deployment
- Production builds go to `dist/` directory
- Vite performs code splitting and optimization automatically
- Preview built app with `npm run preview` before deploying
