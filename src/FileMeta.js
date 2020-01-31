const STORAGE_KEY = '__gcsBrowserUpload'

export default class FileMeta {
  constructor (id, fileSize, chunkSize, storage, resumable) {
    this.id = id
    this.fileSize = fileSize
    this.chunkSize = chunkSize
    this.storage = storage
    this.resumable = resumable;
  }

  getMeta () {
    const meta = this.storage.getItem(`${STORAGE_KEY}.${this.id}`)
    if (meta) {
      return JSON.parse(meta)
    } else {
      return {
        checksums: [],
        chunkSize: this.chunkSize,
        started: false,
        fileSize: this.fileSize
      }
    }
  }

  setMeta (meta) {
    const key = `${STORAGE_KEY}.${this.id}`
    if (meta) {
      this.storage.setItem(key, JSON.stringify(meta))
    } else {
      this.storage.removeItem(key)
    }
  }

  isResumable () {
    let meta = this.getMeta()
    return this.resumable || (meta.started && this.chunkSize === meta.chunkSize)
  }

  getResumeIndex () {
    return this.getMeta().checksums.length
  }

  getFileSize () {
    return this.getMeta().fileSize
  }

  addChecksum (index, checksum) {
    let meta = this.getMeta()
    meta.checksums[index] = checksum
    meta.started = true
    this.setMeta(meta)
  }

  getChecksum (index) {
    return this.getMeta().checksums[index]
  }

  reset () {
    this.setMeta(null)
  }
}
