const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../server')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const Category = require('../src/models/Category')
const Note = require('../src/models/Notes')

chai.use(chaiHttp)
const { expect } = chai

const testEmail = `cattest_${Date.now()}@test.com`
let token
let categoryId

before(async () => {
  await connectDB()

  const res = await chai.request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Cat Test User',
      email: testEmail,
      password: '12345678'
    })
  token = res.body.token
})

after(async () => {
  try {
    const user = await User.findOne({ email: testEmail })
    if (user) {
      await Note.deleteMany({ userId: user._id })
      await Category.deleteMany({ userId: user._id })
      await User.deleteMany({ _id: user._id })
    }
  } catch (err) {
    console.error('Teardown error in category.test.js:', err)
  }
})

describe('Category API', () => {
  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const res = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Category', color: '#7B5EA7' })
      expect(res).to.have.status(201)
      expect(res.body).to.have.property('name', 'Test Category')
      categoryId = res.body._id
    })

    it('should not create duplicate category', async () => {
      const res = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Category', color: '#7B5EA7' })
      expect(res).to.have.status(400)
      expect(res.body).to.have.property('message', 'Category already exists')
    })

    it('should not create category without token', async () => {
      const res = await chai.request(app)
        .post('/api/categories')
        .send({ name: 'No Auth Category' })
      expect(res).to.have.status(401)
    })
  })

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      const res = await chai.request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
    })

    it('should not get categories without token', async () => {
      const res = await chai.request(app)
        .get('/api/categories')
      expect(res).to.have.status(401)
    })
  })

  describe('DELETE /api/categories/:id', () => {
    it('should not delete General category', async () => {
      const categories = await chai.request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
      const general = categories.body.find(cat => cat.isDefault)

      const res = await chai.request(app)
        .delete(`/api/categories/${general._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ option: 'move' })
      expect(res).to.have.status(403)
    })

    it('should delete category and move notes to General', async () => {
      const user = await User.findOne({ email: testEmail })
      const note = await Note.create({
        title: 'Category Move Test Note',
        content: 'Testing note movement on category delete',
        userId: user._id,
        categoryId: categoryId
      })

      const res = await chai.request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ option: 'move' })
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('message', 'Category deleted successfully')

      const updatedNote = await Note.findById(note._id)
      const generalCat = await Category.findOne({ name: 'General', userId: user._id })
      expect(updatedNote.categoryId.toString()).to.equal(generalCat._id.toString())
    })
  })
})
