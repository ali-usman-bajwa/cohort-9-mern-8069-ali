const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../server')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const Category = require('../src/models/Category')

chai.use(chaiHttp)
const { expect } = chai

const testEmail = `testuser_${Date.now()}@test.com`

before(async () => {
  await connectDB()
})

after(async () => {
  try {
    const user = await User.findOne({ email: testEmail })
    if (user) {
      await Category.deleteMany({ userId: user._id })
      await User.deleteMany({ _id: user._id })
    }
  } catch (err) {
    console.error('Teardown error in auth.test.js:', err)
  }
})

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should signup a new user', async () => {
      const res = await chai.request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: testEmail,
          password: '12345678'
        })
      expect(res).to.have.status(201)
      expect(res.body).to.have.property('token')
      expect(res.body.user).to.have.property('email', testEmail)
    })

    it('should not signup with missing fields', async () => {
      const res = await chai.request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail })
      expect(res).to.have.status(400)
      expect(res.body).to.have.property('message', 'All fields are required')
    })

    it('should not signup with short password', async () => {
      const res = await chai.request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: testEmail,
          password: '123'
        })
      expect(res).to.have.status(400)
      expect(res.body).to.have.property('message', 'Password must be at least 8 characters')
    })

    it('should not signup with duplicate email', async () => {
      const res = await chai.request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: testEmail,
          password: '12345678'
        })
      expect(res).to.have.status(409)
      expect(res.body).to.have.property('message', 'User already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: '12345678'
        })
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('token')
    })

    it('should not login with wrong password', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        })
      expect(res).to.have.status(401)
      expect(res.body).to.have.property('message', 'Invalid credentials')
    })

    it('should not login with missing fields', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({ email: testEmail })
      expect(res).to.have.status(400)
      expect(res.body).to.have.property('message', 'All fields are required')
    })
  })
})
