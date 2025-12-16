/**
 * Transform stream that converts Uint8Array chunks to text strings
 */
export class TextDecoderStream extends TransformStream<Uint8Array, string> {
  constructor(encoding = 'utf-8') {
    const decoder = new TextDecoder(encoding)
    super({
      transform(chunk, controller) {
        controller.enqueue(decoder.decode(chunk, { stream: true }))
      }
    })
  }
}

/**
 * Transform stream that converts text strings to Uint8Array chunks
 */
export class TextEncoderStream extends TransformStream<string, Uint8Array> {
  constructor() {
    const encoder = new TextEncoder()
    super({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(chunk))
      }
    })
  }
}

/**
 * Transform stream that buffers incoming text and splits by line breaks
 */
export class LineBreakTransformer extends TransformStream<string, string> {
  constructor() {
    let buffer = ''
    
    super({
      transform(chunk, controller) {
        buffer += chunk
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''
        
        // Enqueue complete lines
        for (const line of lines) {
          controller.enqueue(line)
        }
      },
      
      flush(controller) {
        // Send remaining buffer content when stream closes
        if (buffer) {
          controller.enqueue(buffer)
        }
      }
    })
  }
}

/**
 * Creates a piped readable stream from serial port with text decoding and line breaking
 */
export function createSerialReader(port: SerialPort): ReadableStream<string> {
  if (!port.readable) {
    throw new Error('Port is not readable')
  }

  return port.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new LineBreakTransformer())
}
