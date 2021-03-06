**Index**

- [Matching system](#matching-system)
  - [MatchRule](#matchrule)
    - [MatchRequest](#matchrequest)
    - [MatchResponse](#matchresponse)
    - [MatchString](#matchstring)
    - [MatchNumber](#matchnumber)
    - [MatchList](#matchlist)
    - [MatchObject](#matchobject)
  - [Match by function notes](#match-by-function-notes)
- [Storage](#storage)
  - [storage.get](#storageget)
  - [storage.set](#storageset)
  - [storage.rm](#storagerm)
  - [storage.clear](#storageclear)
  - [storage.list](#storagelist)
- [Dataset](#dataset)
  - [dataset.get](#datasetget)
  - [dataset.create](#datasetcreate)
  - [dataset.update](#datasetupdate)
  - [dataset.remove](#datasetremove)
  - [dataset.set](#datasetset)
  - [dataset.current](#datasetcurrent)
- [Examples](#examples)

---

## Matching system

### MatchRule

```js
{
  request: MatchRequest,
  response?: MatchResponse
}
```

#### MatchRequest

`route` and `methods` are mandatory, while can be any values.

```js
{
  methods: MatchList,
  route: MatchString,
  headers?: MatchObject,
  body?: MatchObject,
  query?: MatchObject
}
```

#### MatchResponse

```js
{
  status?: MatchNumber,
  headers?: MatchObject,
  body?: MatchObject
}
```

#### MatchString

`request.route` and properties of `MatchObject` use a string matching logic and can be matched by:

- `true` or `false`
- string
- regexp
- function

**Examples**

```js
route: true
```

match everything not null

```js
authorization: false
```

match if value is not set (or undefined)

```js
route: '/home'
```

exact match: match if value is `===`

```js
route: /^\/public/
```

use a regexp: everything starts with `/public` in this case

```js
route: (value) => value != '/private'
```

use a function for more logic

#### MatchNumber

Only `response.status` uses this

```js
status: true
```

always

```js
status: false
```

never

```js
status: 200
```

exact match: match if value is `200` but not `201`

```js
status: /^2/
```

use a regexp: `2xx` response status are ok

```js
status: (code) => code > 199 && code < 300
```

use a function for more logic: `2xx` statuses are ok

#### MatchList

Only `request.methods` uses this

```js
methods: true
```

always

```js
methods: '*'
```

always

```js
methods: false
```

never

```js
methods: 'get'
```

exact match: cache only `GET` requests. Allowed values:  
`'get', 'head', 'post', 'put', 'delete', 'options', 'patch'`

```js
methods: ['get', 'head']
```

match methods in the list

```js
methods: (method) => method != 'delete'
```

use a function for more logic: anything but `DELETE`

#### MatchObject

`request.headers`, `request.body`, `request.query`, `response.headers` and `response.body` use the same logic.

```js
request: { body: true }
```

match if body is present; also use the whole body for caching

```js
request: { body: false }
```

match if body not is present

```js
response: {
  headers: (headers) => {
    return !headers.authorization
  }
}
```

match using a function, in this case only if `response` has no `authorization` header

```js
response: {
  headers: {
    'content-type': /^\/image\//,
    'content-length': (length) => length < 2048
  }
}
```

Match single object entries using a `MatchString` logic.  
All entries must succeed in order to match the object.  
In this case, match all sent images less than 2k.

---

### Match by function notes

In case the function returns `true`, the whole part is considered for caching;
if the function returns a value, the value is taken: in this way you can add a custom logic
for caching based on function evaluation.

**Example**

```js
response: {
  body: (body) => {
    return { user: body.userId }
  }
}
```

This is applied to matching `request.methods`, `request.route`, `request.headers`, `request.body`, `request.query`, but not on `MatchingObject` field functions.

---

## Storage

The storage allow access to entries for:

### storage.get

retrieve the entry

```js
fastify.get('/cache/get/:hash', async (request, response) => {
  response.send(await request.peekaboo.storage.get(request.params.hash))
})

{
    "response": {
        "status": 200,
        "headers": {
            "date": "Mon, 01 Jun 2020 12:46:29 GMT",
            "content-type": "application/json;charset=UTF-8",
            "content-length": "329"
        },
        "body": { ... }
    },
    "request": {
        "method": "GET",
        "route": "/my/route",
        "headers": {
            "host": "localhost:8080",
            "client-platform": "web",
            "authorization": "Bearer 8JWyaSndABPj3APA3MmmF50m2bNa",
            "content-type": "application/json; charset=UTF-8",
            "accept": "application/json",
            "accept-encoding": "gzip, deflate, br",
        }
    },
    "info": {
        "rule": "{request:{methods:'*',route:/^\\/url/,body:true,query:true},response:{status:(status) => status > 199 && status < 501}}",
        "created": 1591015589805
    },
    "expire": 1622551589805
}
```

### storage.set

set the content of a entry, all part must be provided:

```js
fastify.put('/cache/set/:hash', async (request, response) => {
  const update = {
    response: {
      status: 200,
      headers: { 'content-type': 'application/json;charset=UTF-8', 'content-length': '123' },
      body: { new: 'content' },
      expire: 1622551586632
    }
  }
  await request.peekaboo.storage.set(request.params.hash, update)
  response.send('entry updated')
})
```

### storage.rm

```js
fastify.delete('/cache/rm/:hash', async (request, response) => {
  await request.peekaboo.storage.rm(request.params.hash)
  response.send('entry removed')
})
```

### storage.clear

```js
fastify.delete('/cache/clear', async (request, response) => {
  await request.peekaboo.storage.clear()
  response.send('cache is empty now')
})
```

### storage.list

retrieve the hashes of entries

```js
fastify.delete('/cache/list', async (request, response) => {
  response.send(await request.peekaboo.storage.list())
})

["48471f2408e9e1c2f9058060f5723f40e93cd965c0ab2322d1…", "af1ec22be30172fb69f9624b91042d9945943db81da052554a…"]
```

## Dataset

Storage uses a default dataset, however storage can use many dataset at runtime.
Dataset are volatile using `memory` storage, but persist using `fs` storage.

### dataset.get

Get the dataset status: `entries`, `default` and `current`.

```js
fastify.get('/dataset', async (request, response) => {
  response.send(await fastify.peekaboo.dataset.get())
})
```

### dataset.create

Create a new dataset with the given `name`. An error occurs if `name` is not valid or empty.

```js
fastify.post('/dataset', async (request, response) => {
  try {
    const id = await fastify.peekaboo.dataset.create(request.body.name)
    response.send({ id })
  } catch (error) {
    response.code(400).send({ message: error.message })
  }
})
```

### dataset.update

Update a dataset `name`. An error occurs if `name` is not valid or empty or the `id` is not valid.

```js
fastify.patch('/dataset', async (request, response) => {
  try {
    await fastify.peekaboo.dataset.update(request.body.id, request.body.name)
    response.send({})
  } catch (error) {
    response.code(400).send({ message: error.message })
  }
})
```

### dataset.remove

Remove a dataset. An error occurs trying to remove the `default` dataset or the `id` is not valid.

```js
fastify.patch('/dataset', async (request, response) => {
  try {
    await fastify.peekaboo.dataset.update(request.body.id, request.body.name)
    response.send({})
  } catch (error) {
    response.code(400).send({ message: error.message })
  }
})
```

### dataset.set

Set the dataset in use. An error occurs trying if the `id` is not valid.

```js
fastify.get('/dataset/:id', async (request, response) => {
  try {
    await fastify.peekaboo.dataset.set(request.params.id)
    response.send({})
  } catch (error) {
    response.code(400).send({ message: error.message })
  }
})
```

### dataset.current

Get the id of the dataset currently in use. It's the same value of `dataset.get().current`, but the function is sync.

```js
fastify.get('/dataset/current', async (request, response) => {
  response.send({current: fastify.peekaboo.dataset.current() })
})
```

---

## Examples

Setup and run

```js
const fastify = require('fastify')
const peekaboo = require('fastify-peekaboo')

const fastify = fastify()
fastify.register(peekaboo, {
  rules: [
    // list of matches, see below
  ]}
)
```

- cache `GET /home` (using default settings)

  ```js
  const rules = [{
    request: {
      methods: 'get',
      route: '/home'
    }
  }]
  ```

- response using cache after from the second time, same response always

  ```js
  fastify.get('/home', async (request, response) => {
    response.send('hey there')
  })
  ```

- cache route /session by cookie

  ```js
  const rules = [{
    request: {
      methods: '*',
      route: '/session',
      headers: {
        cookie: true
      }
    }
  }]
  ```

- response using cache but different from header/cookie, means that every request is based on cookie

  ```js
  fastify.get('/session', async (request, response) => {
    // cookie parsing is done by a plugin like fastify-cookie
    // ... retrieve user
    const _user = user.retrieve(request.cookies.token)
    response.send('welcome ' + _user.name)
  })
  ```

- cache route /content even if response is an error

  ```js
  const rules = [{
    request: {
      methods: 'get',
      route: /^\/content/,
    },
    response: {
      headers: {
        status: true
      }
    }
  }]
  ```

- response using cache either on error too

  ```js
  fastify.get('/content/:id', async (request, response) => {
    const _id = parseInt(request.params.id)
    if (isNaN(_id)) {
      response.code(405).send('BAD_REQUEST')
      return
    }
    response.send('your content ...')
  })
  ```
