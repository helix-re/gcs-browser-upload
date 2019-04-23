import { Promise } from 'es6-promise'
import SparkMD5 from 'spark-md5'

class FileProcessor {
  constructor (file, chunkSize, calculateChecksum) {
    this.calculateChecksum = calculateChecksum
    this.chunkSize = chunkSize
    this.file = file
    this.paused = false
    this.unpauseHandlers = []
    this.debug = () => {};
  }

  async run (fn, startIndex = 0, endIndex) {
    const { file, chunkSize } = this
    const totalChunks = Math.ceil(file.size / chunkSize)
    let spark = new SparkMD5.ArrayBuffer()

    this.debug('Starting run on file:')
    this.debug(` - Total chunks: ${totalChunks}`)
    this.debug(` - Start index: ${startIndex}`)
    this.debug(` - End index: ${endIndex || totalChunks}`)

    const processIndex = async (index) => {
      if (index === totalChunks || index === endIndex) {
        this.debug('File process complete')
        return
      }
      if (this.paused) {
        await waitForUnpause()
      }

      const start = index * chunkSize
      const section = file.slice(start, start + chunkSize)
      let chunk = section;
      let checksum;
      if (this.calculateChecksum) {
        chunk = await getData(section)
        checksum = getChecksum(spark, chunk)
      }

      const shouldContinue = await fn(checksum, index, chunk)
      if (shouldContinue !== false) {
        await processIndex(index + 1)
      }
    }

    const waitForUnpause = () => {
      return new Promise((resolve) => {
        this.unpauseHandlers.push(resolve)
      })
    }

    await processIndex(startIndex)
  }

  pause () {
    this.paused = true
  }

  unpause () {
    this.paused = false
    this.unpauseHandlers.forEach((fn) => fn())
    this.unpauseHandlers = []
  }
}

export function getChecksum (spark, chunk) {
  // just grab the ends of the chunk for comparison.  Was running into major performance issues with big wav files
  var endsBuffer = mergeArrayBuffers(chunk.slice(0, 20), chunk.slice(chunk.byteLength - 20, chunk.byteLength))
  spark.append(endsBuffer)
  // spark.append(chunk)
  const state = spark.getState()
  const checksum = spark.end()
  spark.setState(state)
  return checksum
}

export async function getData (blob) {
  return new Promise((resolve, reject) => {
    let reader = new self.FileReader()
    reader.onload = () => resolve(reader.result.buffer ? reader.result.buffer : reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

export function mergeArrayBuffers (a, b) {
  var tmp = new Uint8Array(a.byteLength + b.byteLength)
  tmp.set(new Uint8Array(a), 0)
  tmp.set(new Uint8Array(b), a.byteLength)
  return tmp.buffer
}

export default FileProcessor
