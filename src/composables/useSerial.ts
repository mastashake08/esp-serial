import { ref, type Ref } from 'vue'
import { SerialManager } from '@mastashake08/web-iot'

interface UseSerialReturn {
  manager: Ref<SerialManager | null>
  port: Ref<SerialPort | null>
  isConnected: Ref<boolean>
  error: Ref<string | null>
  requestPort: () => Promise<void>
  connect: (baudRate?: number) => Promise<void>
  disconnect: () => Promise<void>
  write: (data: string) => Promise<void>
  reader: Ref<ReadableStreamDefaultReader<string> | null>
}

export function useSerial(): UseSerialReturn {
  const manager = ref<SerialManager | null>(null)
  const port = ref<SerialPort | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const reader = ref<ReadableStreamDefaultReader<string> | null>(null)

  // Initialize SerialManager
  const initManager = () => {
    if (!manager.value) {
      manager.value = new SerialManager(false)
    }
  }

  // Request serial port from user
  const requestPort = async () => {
    try {
      error.value = null
      
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser')
      }

      initManager()

      if (!manager.value) {
        throw new Error('Failed to initialize Serial Manager')
      }

      port.value = await manager.value.requestPort()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to request port'
      console.error('Port request failed:', err)
    }
  }

  // Connect to selected port
  const connect = async (baudRate = 115200) => {
    if (!manager.value || !port.value) {
      error.value = 'No port selected'
      return
    }

    try {
      error.value = null
      
      await manager.value.openPort({ baudRate })
      isConnected.value = true
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

      // Close port
      if (manager.value && port.value) {
        await manager.value.closePort()
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
    if (!manager.value || !isConnected.value) {
      error.value = 'No active connection'
      return
    }

    try {
      error.value = null
      const encoder = new TextEncoder()
      await manager.value.writeData(encoder.encode(data))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to write data'
      console.error('Write failed:', err)
    }
  }

  return {
    manager,
    port,
    isConnected,
    error,
    requestPort,
    connect,
    disconnect,
    write,
    reader
  }
}
