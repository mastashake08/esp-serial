# ESP IoT Monitor

A Vue 3 + TypeScript web application for communicating with ESP devices via Web Serial API and Web Bluetooth (BLE).

## Features

- 🔌 **Serial Communication**: Connect to ESP devices via USB using the Web Serial API
- 📡 **Bluetooth LE**: Connect to ESP devices wirelessly using Web Bluetooth
- 💬 **Real-time Messaging**: Send and receive messages from ESP devices
- 🎨 **Modern UI**: Clean interface built with Tailwind CSS
- ⚡ **Fast**: Powered by Vite with HMR

## Browser Support

This application requires modern browsers with Web Serial and Web Bluetooth API support:

### Serial (USB) Support
- Chrome 89+
- Edge 89+
- Opera 76+

### Bluetooth LE Support
- Chrome 56+
- Edge 79+
- Opera 43+

**Note**: Firefox does not currently support Web Serial or Web Bluetooth APIs.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Usage

### Serial Connection (USB)

1. Click **Serial (USB)** to select Serial mode
2. Set your desired baud rate (default: 115200)
3. Click **Connect** and select your ESP device from the browser's serial port picker
4. Send messages using the input field at the bottom
5. Messages from the device appear in the monitor

### Bluetooth LE Connection

1. Click **Bluetooth LE** to select BLE mode
2. Click **Connect to Device** and select your ESP device from the browser's Bluetooth picker
3. Once connected, select a GATT service from the dropdown
4. Select a characteristic that supports read/write/notify operations
5. Send messages using the input field at the bottom
6. Messages from notifications appear in the monitor

### Common BLE Services

The app includes presets for common BLE services:
- **Nordic UART Service** (`6e400001-b5a3-f393-e0a9-e50e24dcca9e`)
- **Device Information Service**
- **Battery Service**
- **Heart Rate Service**

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Project Structure

```
src/
├── composables/
│   ├── useSerial.ts      # Serial port composable
│   └── useBluetooth.ts   # Bluetooth LE composable
├── utils/
│   ├── serialTransforms.ts  # Serial data transform streams
│   └── bleTransforms.ts     # BLE data utilities and converters
├── App.vue               # Main application component
└── main.ts              # Application entry point
```

## Dependencies

- **[@mastashake08/web-iot](https://github.com/mastashake08/web-iot)**: Unified interface for Web Serial, Bluetooth, USB, and NFC APIs

## License

MIT
