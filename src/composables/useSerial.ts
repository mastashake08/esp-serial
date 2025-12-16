import { ref, type Ref } from 'vue'

interface UseSerialReturn {
  port: Ref<SerialPort | null>
  isConnected: Ref<boolean>
  error: Ref<string | null>
  requestPort: () => Promise<void>
  connect: (baudRate?: number) => Promise<void>
  disconnect: () => Promise<void>
  write: (data: string) => Promise<void>
  reader: Ref<ReadableStreamDefaultReader<string> | null>
  writer: Ref<WritableStreamDefaultWriter<Uint8Array> | null>
}

export function useSerial(): UseSerialReturn {
  const port = ref<SerialPort | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const reader = ref<ReadableStreamDefaultReader<string> | null>(null)
  const writer = ref<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  // Request serial port from user
  const requestPort = async () => {
    try {
      error.value = null
      
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser')
      }

      port.value = await navigator.serial.requestPort()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to request port'
      console.error('Port request failed:', err)
    }
  }

  // Connect to selected port
  const connect = async (baudRate = 115200) => {
    if (!port.value) {
      error.value = 'No port selected'
      return
    }

    try {
      error.value = null
      
      await port.value.open({ baudRate })
      isConnected.value = true

      // Set up writer for sending data
      if (port.value.writable) {
        writer.value = port.value.writable.getWriter()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect'
      console.error('Connection failed:', err)
      isConnected.value = false
    }
  }

  // Disconnect from port
  const disconnect = async () => {
    try {
      error.value = null

      // Release reader if active
      if (reader.value) {
        await reader.value.cancel()
        reader.value = null
      }

      // Release writer if active
      if (writer.value) {
        await writer.value.close()
        writer.value = null
      }

      // Close port
      if (port.value) {
        await port.value.close()
        port.value = null
      }

      isConnected.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to disconnect'
      console.error('Disconnect failed:', err)
    }
  }

  // Write data to serial port
  const write = async (data: string) => {
    if (!writer.value) {
      error.value = 'No active connection'
      return
    }

    try {
      error.value = null
      const encoder = new TextEncoder()
      await writer.value.write(encoder.encode(data))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to write data'
      console.error('Write failed:', err)
    }
  }

  return {
    port,
    isConnected,
    error,
    requestPort,
    connect,
    disconnect,
    write,
    reader,
    writer
  }
}
