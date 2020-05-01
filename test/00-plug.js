const tap = require('tap')
const fastify = require('fastify')
const helper = require('./helper')

const peekaboo = require('../src/plugin')

tap.test('peekaboo plugin is loaded',
  async (_test) => {
    _test.plan(1)
    const _fastify = fastify()
    await _fastify
      .register(peekaboo)
      .ready()
    await helper.fastify.stop(_fastify)
    _test.pass(_fastify.peekaboo)
  })

tap.test('peekaboo plugin is working (basic match)',
  async (_test) => {
    _test.plan(1)
    const _fastify = fastify({ logger: { level: 'trace' } })
    _fastify.register(peekaboo, {
      xheader: true,
      rules: [{
        request: {
          methods: 'get',
          route: '/home'
        }
      }]
    })

    _fastify.get('/home', async (request, response) => {
      response.send('hey there')
    })

    try {
      await helper.fastify.start(_fastify)
      await helper.request({ path: '/home' })
      const _response = await helper.request({ path: '/home' })
      if (!_response.headers['x-peekaboo']) {
        _test.fail()
      }
      await helper.fastify.stop(_fastify)
      _test.pass()
    } catch (error) {
      _test.threw(error)
    }
  })

tap.test('peekaboo plugin is working (default settings)',
  async (_test) => {
    _test.plan(1)
    const _fastify = fastify()
    _fastify
      .register(peekaboo, {
        xheader: true,
        rules: [{
          request: {
            route: true
          }
        }]
      })

    _fastify.all('/home', async (request, response) => {
      response.send('this is the home')
    })

    try {
      await helper.fastify.start(_fastify)
      await helper.request({ path: '/home' })
      const _response = await helper.request({ path: '/home' })
      if (!_response.headers['x-peekaboo']) {
        _test.fail()
      }
      await helper.fastify.stop(_fastify)
      _test.pass()
    } catch (error) {
      _test.threw(error)
    }
  })
