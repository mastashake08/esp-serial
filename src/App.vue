<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useSerial } from '@/composables/useSerial'
import { createSerialReader } from '@/utils/serialTransforms'

const { port, isConnected, error, requestPort, connect, disconnect, write } = useSerial()

const messages = ref<string[]>([])
const inputMessage = ref('')
const baudRate = ref(115200)
const isReading = ref(false)
const messagesEndRef = ref<HTMLElement | null>(null)

// Start reading from serial port
const startReading = async () => {
  if (!port.value || !port.value.readable) {
    return
  }

  isReading.value = true
  
  try {
    const reader = createSerialReader(port.value).getReader()
    
    while (isReading.value) {
      const { value, done } = await reader.read()
      
      if (done) {
        break
      }
      
      if (value) {
        messages.value.push(value)
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
        }, 0)
      }
    }
    
    reader.releaseLock()
  } catch (err) {
    console.error('Reading error:', err)
    isReading.value = false
  }
}

// Stop reading from serial port
const stopReading = () => {
  isReading.value = false
}

// Handle connection
const handleConnect = async () => {
  if (!port.value) {
    await requestPort()
  }
  
  if (port.value) {
    await connect(baudRate.value)
    if (isConnected.value) {
      await startReading()
    }
  }
}

// Handle disconnection
const handleDisconnect = async () => {
  stopReading()
  await disconnect()
  messages.value = []
}

// Send message
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return
  }
  
  await write(inputMessage.value + '\n')
  inputMessage.value = ''
}

// Clear messages
const clearMessages = () => {
  messages.value = []
}

// Cleanup on unmount
onUnmounted(() => {
  stopReading()
  disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">ESP Serial Monitor</h1>
        <p class="text-gray-600">Connect to ESP devices via Web Serial API</p>
      </div>

      <!-- Connection Controls -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <div class="flex flex-wrap gap-4 items-end">
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
            :disabled="!isConnected"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            :disabled="!isConnected || !inputMessage.trim()"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
