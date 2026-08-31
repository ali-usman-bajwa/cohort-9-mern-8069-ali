const mongoose = require('mongoose')

after(async () => {
  try {
    await mongoose.disconnect()
    console.log('Mongoose connection closed after tests')
  } catch (err) {
    console.error('Error closing Mongoose connection:', err)
  }
})