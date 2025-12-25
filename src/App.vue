<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { useSerial } from '@/composables/useSerial'
import { useBluetooth } from '@/composables/useBluetooth'
import { 
  dataViewToString, 
  stringToUint8Array, 
  BLE_SERVICES, 
  BLE_CHARACTERISTICS,
  getServiceName,
  getCharacteristicName
} from '@/utils/bleTransforms'

type ConnectionType = 'serial' | 'ble'

// Connection type
const connectionType = ref<ConnectionType>('serial')

// Serial setup
const { port, isConnected: isSerialConnected, error: serialError, requestPort, connect: connectSerial, disconnect: disconnectSerial, write: writeSerial } = useSerial()

// BLE setup
const { 
  device, 
  isConnected: isBleConnected, 
  error: bleError, 
  services,
  currentService,
  currentCharacteristic,
  requestDevice, 
  connect: connectBle, 
  disconnect: disconnectBle,
  getServices,
  selectService,
  getCharacteristics,
  selectCharacteristic,
  writeValue,
  startNotifications
} = useBluetooth()

// Computed properties
const isConnected = computed(() => 
  connectionType.value === 'serial' ? isSerialConnected.value : isBleConnected.value
)

const error = computed(() => 
  connectionType.value === 'serial' ? serialError.value : bleError.value
)

// BLE state
const characteristics = ref<BluetoothRemoteGATTCharacteristic[]>([])
const selectedServiceUuid = ref('')
const selectedCharacteristicUuid = ref('')
const deviceNamePrefix = ref('')

// Shared state
const messages = ref<string[]>([])
const inputMessage = ref('')
const baudRate = ref(115200)
const isReading = ref(false)
const messagesEndRef = ref<HTMLElement | null>(null)
const serialReader = ref<ReadableStreamDefaultReader<string> | null>(null)

// Start reading from serial port
const startReading = async () => {
  if (!port.value || !port.value.readable) {
    return
  }

  isReading.value = true
  
  try {
    const textDecoder = new TextDecoder()
    const reader = port.value.readable.getReader()
    serialReader.value = reader as any
    
    while (isReading.value && port.value.readable) {
      try {
        const { value, done } = await reader.read()
        
        if (done) {
          break
        }
        
        if (value) {
          // Decode the Uint8Array to string
          const text = textDecoder.decode(value)
          // Split by lines and add to messages
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              messages.value.push(line)
            }
          }
          // Auto-scroll to bottom
          setTimeout(() => {
            messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
          }, 0)
        }
        
        // Small yield to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 0))
      } catch (readError) {
        if (isReading.value) {
          console.error('Read error:', readError)
        }
        break
      }
    }
    
    if (reader) {
      try {
        reader.releaseLock()
      } catch (e) {
        // Reader may already be released
      }
      serialReader.value = null
    }
  } catch (err) {
    console.error('Reading error:', err)
    isReading.value = false
    if (serialReader.value) {
      try {
        (serialReader.value as any).releaseLock()
      } catch (e) {
        // Reader may already be released
      }
      serialReader.value = null
    }
  }
}

// Stop reading from serial port
const stopReading = async () => {
  isReading.value = false
  
  // Release the reader if it's still active
  if (serialReader.value) {
    try {
      await (serialReader.value as any).cancel()
      serialReader.value = null
    } catch (err) {
      console.error('Error canceling reader:', err)
    }
  }
}

// Handle connection
const handleConnect = async () => {
  if (connectionType.value === 'serial') {
    if (!port.value) {
      await requestPort()
    }
    
    if (port.value) {
      await connectSerial(baudRate.value)
      if (isSerialConnected.value) {
        // Start reading in the background without blocking
        startReading()
      }
    }
  } else {
    // BLE connection
    if (!device.value) {
      // Simple device request - use name filter if provided, otherwise accept all
      const options: any = {
        optionalServices: [] // Will get all services from GATT
      }
      
      if (deviceNamePrefix.value.trim()) {
        // Filter by device name prefix
        options.filters = [{ namePrefix: deviceNamePrefix.value.trim() }]
      } else {
        // Accept all devices
        options.acceptAllDevices = true
      }
      
      await requestDevice(options)
    }
    
    if (device.value) {
      await connectBle()
      if (isBleConnected.value) {
        try {
          // Get services directly from the GATT server
          if (device.value.gatt?.connected) {
            const gattServices = await device.value.gatt.getPrimaryServices()
            services.value = gattServices
            console.log('Services found:', gattServices.map(s => s.uuid))
          } else {
            await getServices()
          }
        } catch (err) {
          console.error('Error getting services:', err)
        }
      }
    }
  }
}

// Handle disconnection
const handleDisconnect = async () => {
  await stopReading()
  
  if (connectionType.value === 'serial') {
    await disconnectSerial()
  } else {
    await disconnectBle()
    services.value = []
    characteristics.value = []
    selectedServiceUuid.value = ''
    selectedCharacteristicUuid.value = ''
  }
  
  messages.value = []
}

// Handle service selection
const handleServiceSelect = async () => {
  if (!selectedServiceUuid.value) return
  
  await selectService(selectedServiceUuid.value)
  if (currentService.value) {
    characteristics.value = await getCharacteristics()
    
    // Auto-select first writable characteristic
    const writableChars = characteristics.value.filter(c => c.properties.write || c.properties.writeWithoutResponse)
    if (writableChars.length === 1 && writableChars[0]) {
      selectedCharacteristicUuid.value = writableChars[0].uuid
      await handleCharacteristicSelect()
    }
  }
}

// Handle characteristic selection
const handleCharacteristicSelect = async () => {
  if (!selectedCharacteristicUuid.value) return
  
  await selectCharacteristic(selectedCharacteristicUuid.value, (event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    if (target.value) {
      const message = dataViewToString(target.value)
      messages.value.push(message)
      setTimeout(() => {
        messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
      }, 0)
    }
  })
  
  // Start notifications if characteristic supports it
  if (currentCharacteristic.value?.properties.notify) {
    await startNotifications((event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      if (target.value) {
        const message = dataViewToString(target.value)
        messages.value.push(message)
        setTimeout(() => {
          messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
        }, 0)
      }
    })
  }
}

// Send message
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return
  }
  
  if (connectionType.value === 'serial') {
    await writeSerial(inputMessage.value + '\n')
  } else {
    // BLE write
    if (currentCharacteristic.value) {
      const data = stringToUint8Array(inputMessage.value + '\n')
      await writeValue(data as BufferSource)
    }
  }
  
  inputMessage.value = ''
}

// Clear messages
const clearMessages = () => {
  messages.value = []
}

// Cleanup on unmount
onUnmounted(async () => {
  await stopReading()
  if (connectionType.value === 'serial') {
    await disconnectSerial()
  } else {
    await disconnectBle()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">ESP IoT Monitor</h1>
        <p class="text-gray-600">Connect to ESP devices via Web Serial API or Bluetooth LE</p>
      </div>

      <!-- Connection Type Selector -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Connection Type</h2>
        <div class="flex gap-4">
          <button
            @click="connectionType = 'serial'"
            :class="[
              'px-6 py-3 rounded-md font-medium transition-all',
              connectionType === 'serial'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
            :disabled="isConnected"
          >
            Serial (USB)
          </button>
          <button
            @click="connectionType = 'ble'"
            :class="[
              'px-6 py-3 rounded-md font-medium transition-all',
              connectionType === 'ble'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
            :disabled="isConnected"
          >
            Bluetooth LE
          </button>
        </div>
      </div>

      <!-- Connection Controls -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">
          {{ connectionType === 'serial' ? 'Serial Connection' : 'Bluetooth LE Connection' }}
        </h2>
        
        <!-- Serial Options -->
        <div v-if="connectionType === 'serial'" class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label for="baudRate" class="block text-sm font-medium text-gray-700 mb-1">
              Baud Rate
            </label>
            <input
              id="baudRate"
              v-model.number="baudRate"
              type="number"
              :disabled="isConnected"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div class="flex gap-2">
            <button
              v-if="!isConnected"
              @click="handleConnect"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Connect
            </button>
            <button
              v-else
              @click="handleDisconnect"
              class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <!-- BLE Options -->
        <div v-else class="space-y-4">
          <!-- BLE Configuration -->
          <div v-if="!isConnected">
            <label for="deviceNamePrefix" class="block text-sm font-medium text-gray-700 mb-1">
              Device Name Filter (optional)
            </label>
            <input
              id="deviceNamePrefix"
              v-model="deviceNamePrefix"
              type="text"
              placeholder="ESP32 or leave empty for all devices"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="mt-1 text-xs text-gray-500">
              Tip: Filtering by name gives access to all device services
            </p>
          </div>
          
          <div class="flex gap-2">
            <button
              v-if="!isConnected"
              @click="handleConnect"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Connect to Device
            </button>
            <button
              v-else
              @click="handleDisconnect"
              class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Disconnect
            </button>
          </div>

          <!-- Service Selection -->
          <div v-if="isConnected && services.length > 0" class="space-y-2">
            <label for="service" class="block text-sm font-medium text-gray-700">
              Select Service
            </label>
            <select
              id="service"
              v-model="selectedServiceUuid"
              @change="handleServiceSelect"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a service --</option>
              <option v-for="service in services" :key="service.uuid" :value="service.uuid">
                {{ getServiceName(service.uuid) }} ({{ service.uuid }})
              </option>
            </select>
          </div>

          <!-- Characteristic Selection -->
          <div v-if="currentService && characteristics.length > 0" class="space-y-2">
            <label for="characteristic" class="block text-sm font-medium text-gray-700">
              Select Characteristic
            </label>
            <select
              id="characteristic"
              v-model="selectedCharacteristicUuid"
              @change="handleCharacteristicSelect"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a characteristic --</option>
              <option v-for="char in characteristics" :key="char.uuid" :value="char.uuid">
                {{ getCharacteristicName(char.uuid) }} 
                [{{ char.properties.read ? 'R' : '' }}{{ char.properties.write || char.properties.writeWithoutResponse ? 'W' : '' }}{{ char.properties.notify ? 'N' : '' }}]
                {{ (char.properties.write || char.properties.writeWithoutResponse) ? '✓' : '' }}
              </option>
            </select>
          </div>

          <!-- Device Info -->
          <div v-if="device" class="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p class="text-sm text-blue-800">
              <span class="font-medium">Device:</span> {{ device.name || 'Unknown' }}
            </p>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Connection Status -->
        <div class="mt-4 flex items-center gap-2">
          <div 
            class="w-3 h-3 rounded-full transition-colors"
            :class="isConnected ? 'bg-green-500' : 'bg-gray-300'"
          ></div>
          <span class="text-sm font-medium text-gray-700">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>

      <!-- Messages Display -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">Serial Monitor</h2>
          <button
            @click="clearMessages"
            :disabled="messages.length === 0"
            class="px-4 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
        
        <div class="bg-gray-900 rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
          <div v-if="messages.length === 0" class="text-gray-500">
            No messages yet...
          </div>
          <div v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="text-green-400 mb-1"
            >
              {{ message }}
            </div>
            <div ref="messagesEndRef"></div>
          </div>
        </div>
      </div>

      <!-- Input Controls -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Send Message</h2>
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Type a message..."
            :disabled="!isConnected || (connectionType === 'ble' && !currentCharacteristic)"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            :disabled="!isConnected || !inputMessage.trim() || (connectionType === 'ble' && !currentCharacteristic)"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
        <p v-if="connectionType === 'ble' && isConnected && !currentCharacteristic" class="mt-2 text-sm text-gray-500">
          {{ !currentService ? 'Select a service first' : characteristics.length === 0 ? 'No characteristics found' : 'Select a writable characteristic to send messages' }}
        </p>
        <p v-if="connectionType === 'ble' && isConnected && currentCharacteristic && !currentCharacteristic.properties.write && !currentCharacteristic.properties.writeWithoutResponse" class="mt-2 text-sm text-orange-600">
          ⚠️ Selected characteristic is not writable
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
