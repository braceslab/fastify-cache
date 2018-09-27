const Keyv = require('keyv')
const lib = require('../lib')

// https://github.com/lukechilds/keyv-test-suite/blob/master/src/api.js

/**
 *
 * @param {object} [options]
 * @param {peekaboo.STORAGE} [options.type=lib.STORAGE.MEMORY]
 * @param {number} [options.expire=60000] 1 min
 */
const Storage = function (options) {
  let __storage

  const __init = function (options) {
    if (!options) {
      options = { }
    }
    if (!options.type) {
      options.type = { type: lib.STORAGE.MEMORY }
    }
    if (!options.expire) {
      options.expire = 60 * 1000
    }

    switch (options.type) {
      // @todo lib.STORAGE.FILE
      // @todo lib.STORAGE.REDIS
      case lib.STORAGE.MEMORY:
      default:
        __storage = new Keyv()
    }
  }

  const get = async function (key) {
    return __storage.get(key)
  }

  const set = async function (key, data) {
    return __storage.set(key, data, options.expire)
  }

  __init()

  return {
    get: get,
    set: set
  }
}

module.exports = Storage