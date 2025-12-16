/// <reference types="vite/client" />

// Web Serial API type declarations
interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null
  readonly writable: WritableStream<Uint8Array> | null
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}

interface Navigator {
  readonly serial: Serial
}
