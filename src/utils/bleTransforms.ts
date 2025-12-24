/**
 * Convert DataView to string using TextDecoder
 */
export function dataViewToString(dataView: DataView, encoding = 'utf-8'): string {
  const decoder = new TextDecoder(encoding)
  const buffer = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
  return decoder.decode(buffer)
}

/**
 * Convert string to Uint8Array for BLE write operations
 */
export function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

/**
 * Convert number to Uint8Array for BLE write operations
 */
export function numberToUint8Array(num: number, byteLength = 1): Uint8Array {
  const buffer = new ArrayBuffer(byteLength)
  const view = new DataView(buffer)
  
  switch (byteLength) {
    case 1:
      view.setUint8(0, num)
      break
    case 2:
      view.setUint16(0, num, true) // little-endian
      break
    case 4:
      view.setUint32(0, num, true) // little-endian
      break
    default:
      throw new Error(`Unsupported byte length: ${byteLength}`)
  }
  
  return new Uint8Array(buffer)
}

/**
 * Convert DataView to hex string for display
 */
export function dataViewToHex(dataView: DataView): string {
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ')
}

/**
 * Parse DataView as JSON string
 */
export function dataViewToJSON<T = unknown>(dataView: DataView): T | null {
  try {
    const str = dataViewToString(dataView)
    return JSON.parse(str) as T
  } catch (err) {
    console.error('Failed to parse JSON from DataView:', err)
    return null
  }
}

/**
 * Convert object to Uint8Array for BLE write (as JSON)
 */
export function objectToUint8Array(obj: unknown): Uint8Array {
  const jsonStr = JSON.stringify(obj)
  return stringToUint8Array(jsonStr)
}

/**
 * Read numeric value from DataView
 */
export function dataViewToNumber(dataView: DataView, type: 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' = 'uint8'): number {
  switch (type) {
    case 'uint8':
      return dataView.getUint8(0)
    case 'uint16':
      return dataView.getUint16(0, true) // little-endian
    case 'uint32':
      return dataView.getUint32(0, true) // little-endian
    case 'int8':
      return dataView.getInt8(0)
    case 'int16':
      return dataView.getInt16(0, true) // little-endian
    case 'int32':
      return dataView.getInt32(0, true) // little-endian
    default:
      throw new Error(`Unsupported type: ${type}`)
  }
}

/**
 * Common BLE service UUIDs
 */
export const BLE_SERVICES = {
  GENERIC_ACCESS: '00001800-0000-1000-8000-00805f9b34fb',
  GENERIC_ATTRIBUTE: '00001801-0000-1000-8000-00805f9b34fb',
  DEVICE_INFORMATION: '0000180a-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  UART_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
}

/**
 * Common BLE characteristic UUIDs
 */
export const BLE_CHARACTERISTICS = {
  DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
  APPEARANCE: '00002a01-0000-1000-8000-00805f9b34fb',
  MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
  MODEL_NUMBER: '00002a24-0000-1000-8000-00805f9b34fb',
  SERIAL_NUMBER: '00002a25-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  UART_TX: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX
  UART_RX: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART RX
}

/**
 * Format BLE service UUID for display
 */
export function formatServiceUUID(uuid: string): string {
  // Check if it's a standard 16-bit UUID
  if (uuid.startsWith('0000') && uuid.endsWith('-0000-1000-8000-00805f9b34fb')) {
    return uuid.substring(4, 8)
  }
  return uuid
}

/**
 * Get human-readable service name
 */
export function getServiceName(uuid: string): string {
  const uuidLower = uuid.toLowerCase()
  
  for (const [name, serviceUuid] of Object.entries(BLE_SERVICES)) {
    if (serviceUuid === uuidLower) {
      return name.replace(/_/g, ' ')
    }
  }
  
  return formatServiceUUID(uuid)
}

/**
 * Get human-readable characteristic name
 */
export function getCharacteristicName(uuid: string): string {
  const uuidLower = uuid.toLowerCase()
  
  for (const [name, charUuid] of Object.entries(BLE_CHARACTERISTICS)) {
    if (charUuid === uuidLower) {
      return name.replace(/_/g, ' ')
    }
  }
  
  return formatServiceUUID(uuid)
}
