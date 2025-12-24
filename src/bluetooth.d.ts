/// <reference lib="dom" />

// Web Bluetooth API type definitions
declare global {
  interface Navigator {
    bluetooth: Bluetooth
  }

  interface Bluetooth {
    getAvailability(): Promise<boolean>
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
    getDevices(options?: any): Promise<BluetoothDevice[]>
    requestLEScan(options?: RequestDeviceOptions): Promise<any>
    onadvertisementreceived: ((this: Bluetooth, ev: Event) => any) | null
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[]
    optionalServices?: BluetoothServiceUUID[]
    acceptAllDevices?: boolean
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[]
    name?: string
    namePrefix?: string
    manufacturerData?: BluetoothManufacturerDataFilter[]
    serviceData?: BluetoothServiceDataFilter[]
  }

  interface BluetoothManufacturerDataFilter {
    companyIdentifier: number
    dataPrefix?: BufferSource
    mask?: BufferSource
  }

  interface BluetoothServiceDataFilter {
    service: BluetoothServiceUUID
    dataPrefix?: BufferSource
    mask?: BufferSource
  }

  type BluetoothServiceUUID = string | number

  interface BluetoothDevice extends EventTarget {
    id: string
    name?: string
    gatt?: BluetoothRemoteGATTServer
    watchAdvertisements(): Promise<void>
    unwatchAdvertisements(): void
    addEventListener(
      type: 'gattserverdisconnected',
      listener: (this: BluetoothDevice, ev: Event) => any,
      useCapture?: boolean
    ): void
    gattserverdisconnected: ((this: BluetoothDevice, ev: Event) => any) | null
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice
    connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
    serviceadded: ((this: BluetoothRemoteGATTServer, ev: Event) => any) | null
  }

  interface BluetoothRemoteGATTService extends EventTarget {
    device: BluetoothDevice
    uuid: string
    isPrimary: boolean
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
    getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  }

  type BluetoothCharacteristicUUID = string | number

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    service: BluetoothRemoteGATTService
    uuid: string
    properties: BluetoothCharacteristicProperties
    value?: DataView
    readValue(): Promise<DataView>
    writeValue(value: BufferSource): Promise<void>
    writeValueWithResponse(value: BufferSource): Promise<void>
    writeValueWithoutResponse(value: BufferSource): Promise<void>
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>
    getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>
    addEventListener(
      type: 'characteristicvaluechanged',
      listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => any,
      useCapture?: boolean
    ): void
    characteristicvaluechanged: ((this: BluetoothRemoteGATTCharacteristic, ev: Event) => any) | null
  }

  interface BluetoothCharacteristicProperties {
    broadcast: boolean
    read: boolean
    writeWithoutResponse: boolean
    write: boolean
    notify: boolean
    indicate: boolean
    authenticatedSignedWrites: boolean
    reliableWrite: boolean
    writableAuxiliaries: boolean
  }

  type BluetoothDescriptorUUID = string | number

  interface BluetoothRemoteGATTDescriptor {
    characteristic: BluetoothRemoteGATTCharacteristic
    uuid: string
    value?: DataView
    readValue(): Promise<DataView>
    writeValue(value: BufferSource): Promise<void>
  }
}

export {}
