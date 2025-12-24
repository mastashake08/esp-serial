import { ref, type Ref } from 'vue'
import { BluetoothManager } from '@mastashake08/web-iot'

interface UseBluetoothReturn {
  manager: Ref<BluetoothManager | null>
  device: Ref<BluetoothDevice | null>
  isConnected: Ref<boolean>
  error: Ref<string | null>
  services: Ref<BluetoothRemoteGATTService[]>
  currentService: Ref<BluetoothRemoteGATTService | null>
  currentCharacteristic: Ref<BluetoothRemoteGATTCharacteristic | null>
  requestDevice: (options?: RequestDeviceOptions) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getServices: () => Promise<void>
  selectService: (serviceUuid: string) => Promise<void>
  getCharacteristics: () => Promise<BluetoothRemoteGATTCharacteristic[]>
  selectCharacteristic: (charUuid: string, valueChangedCallback?: (event: Event) => void) => Promise<void>
  writeValue: (data: BufferSource) => Promise<void>
  readValue: () => Promise<DataView | null>
  startNotifications: (callback: (event: Event) => void) => Promise<void>
}

export function useBluetooth(): UseBluetoothReturn {
  const manager = ref<BluetoothManager | null>(null)
  const device = ref<BluetoothDevice | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const services = ref<BluetoothRemoteGATTService[]>([])
  const currentService = ref<BluetoothRemoteGATTService | null>(null)
  const currentCharacteristic = ref<BluetoothRemoteGATTCharacteristic | null>(null)

  // Initialize BluetoothManager
  const initManager = () => {
    if (!manager.value) {
      manager.value = new BluetoothManager((event) => {
        console.log('Advertisement received:', event)
      }, false)
    }
  }

  // Request Bluetooth device from user
  const requestDevice = async (options: RequestDeviceOptions = { acceptAllDevices: true }) => {
    try {
      error.value = null
      initManager()

      if (!manager.value) {
        throw new Error('Failed to initialize Bluetooth Manager')
      }

      device.value = await manager.value.requestDevice(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to request device'
      console.error('Device request failed:', err)
    }
  }

  // Connect to selected device
  const connect = async () => {
    if (!manager.value || !device.value) {
      error.value = 'No device selected'
      return
    }

    try {
      error.value = null

      await manager.value.connectToServer(
        (event) => {
          console.log('Disconnected:', event)
          isConnected.value = false
          device.value = null
          services.value = []
          currentService.value = null
          currentCharacteristic.value = null
        },
        (event) => {
          console.log('Service added:', event)
        }
      )

      isConnected.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect'
      console.error('Connection failed:', err)
      isConnected.value = false
    }
  }

  // Disconnect from device
  const disconnect = async () => {
    try {
      error.value = null

      if (device.value?.gatt?.connected) {
        device.value.gatt.disconnect()
      }

      isConnected.value = false
      device.value = null
      services.value = []
      currentService.value = null
      currentCharacteristic.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to disconnect'
      console.error('Disconnect failed:', err)
    }
  }

  // Get available services
  const getServices = async () => {
    if (!manager.value) {
      error.value = 'Not connected to a device'
      return
    }

    try {
      error.value = null
      services.value = await manager.value.getServices()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get services'
      console.error('Get services failed:', err)
    }
  }

  // Select a service by UUID
  const selectService = async (serviceUuid: string) => {
    if (!manager.value) {
      error.value = 'Not connected to a device'
      return
    }

    try {
      error.value = null
      currentService.value = await manager.value.getService(serviceUuid)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to select service'
      console.error('Select service failed:', err)
    }
  }

  // Get characteristics from current service
  const getCharacteristics = async (): Promise<BluetoothRemoteGATTCharacteristic[]> => {
    if (!manager.value || !currentService.value) {
      error.value = 'No service selected'
      return []
    }

    try {
      error.value = null
      return await manager.value.getCharacteristics()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get characteristics'
      console.error('Get characteristics failed:', err)
      return []
    }
  }

  // Select a characteristic by UUID
  const selectCharacteristic = async (
    charUuid: string,
    valueChangedCallback?: (event: Event) => void
  ) => {
    if (!manager.value || !currentService.value) {
      error.value = 'No service selected'
      return
    }

    try {
      error.value = null
      currentCharacteristic.value = await manager.value.getCharacteristic(
        charUuid,
        valueChangedCallback || ((event) => console.log('Value changed:', event))
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to select characteristic'
      console.error('Select characteristic failed:', err)
    }
  }

  // Write data to current characteristic
  const writeValue = async (data: BufferSource) => {
    if (!manager.value || !currentCharacteristic.value) {
      error.value = 'No characteristic selected'
      return
    }

    try {
      error.value = null
      await manager.value.writeValue(data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to write value'
      console.error('Write failed:', err)
    }
  }

  // Read value from current characteristic
  const readValue = async (): Promise<DataView | null> => {
    if (!manager.value || !currentCharacteristic.value) {
      error.value = 'No characteristic selected'
      return null
    }

    try {
      error.value = null
      return await manager.value.getValue()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to read value'
      console.error('Read failed:', err)
      return null
    }
  }

  // Start notifications on current characteristic
  const startNotifications = async (callback: (event: Event) => void) => {
    if (!currentCharacteristic.value) {
      error.value = 'No characteristic selected'
      return
    }

    try {
      error.value = null
      await currentCharacteristic.value.startNotifications()
      currentCharacteristic.value.addEventListener('characteristicvaluechanged', callback)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start notifications'
      console.error('Start notifications failed:', err)
    }
  }

  return {
    manager,
    device,
    isConnected,
    error,
    services,
    currentService,
    currentCharacteristic,
    requestDevice,
    connect,
    disconnect,
    getServices,
    selectService,
    getCharacteristics,
    selectCharacteristic,
    writeValue,
    readValue,
    startNotifications
  }
}
