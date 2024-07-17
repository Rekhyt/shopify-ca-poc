const convict = require('convict')
const schema = require('./schema')
const config = convict(schema)
const env = config.get('env')

const conf = require('./env/' + env)

config.load(conf)

config.validate()

module.exports = config.get()
