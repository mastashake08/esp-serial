declare module '@mastashake08/web-iot' {
  export class WebIOT {
    debug: boolean
    constructor(debug?: boolean)
    sendData(url: string, options?: any, type?: 'fetch' | 'beacon'): Promise<Response | undefined>
    sendBeacon(url: string, data: any): void
    sendFetch(url: string, options: RequestInit): Promise<Response | undefined>
    handleError(e: Error): void
    logData(): void
  }

  export class BluetoothManager extends WebIOT {
    constructor(callback?: (event: Event) => void, debug?: boolean)
    getDevices(options?: any): Promise<BluetoothDevice[]>
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
    connectToServer(
      disconnect?: (event: Event) => void,
      serviceadded?: (event: Event) => void
    ): Promise<void>
    getService(service: string): Promise<BluetoothRemoteGATTService>
    getServices(): Promise<BluetoothRemoteGATTService[]>
    getCharacteristic(
      char: string,
      valueChanged?: (event: Event) => void
    ): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
    getValue(): Promise<DataView>
    writeValue(data: BufferSource): Promise<void>
    startLEScan(options?: RequestDeviceOptions): Promise<void>
  }

  export class SerialManager extends WebIOT {
    constructor(debug?: boolean)
    getPorts(): Promise<SerialPort[]>
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
    openPort(options: SerialOptions): Promise<void>
    closePort(): Promise<void>
    getInfo(): Promise<SerialPortInfo>
    setSignals(options: SerialOutputSignals): Promise<void>
    getSignals(): Promise<SerialInputSignals>
    readData(): Promise<Uint8Array | undefined>
    writeData(data: BufferSource): Promise<void>
  }

  export class NFCManager extends WebIOT {
    constructor(debug?: boolean)
    startNFC(): void
    readNFCData(
      readCb?: (event: Event) => void,
      errorCb?: (event: Event) => void
    ): Promise<void>
    writeNFCData(records: any, errorCb?: (event: Event) => void): Promise<void>
    lockNFCTag(errorCb?: (event: Event) => void): Promise<void>
    static generateNFC(): NDEFReader
  }

  export class USBManager extends WebIOT {
    constructor(debug?: boolean)
    getDevices(): Promise<USBDevice[]>
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>
    openDevice(): Promise<USBDevice>
    closeDevice(): Promise<void>
    connectDevice(): Promise<USBDevice>
    writeData(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
    readData(endpointNumber: number, data: number): Promise<USBInTransferResult>
  }
}
