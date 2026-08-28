const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../server')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const Category = require('../src/models/Category')
const Note = require('../src/models/Notes')

chai.use(chaiHttp)
const { expect } = chai

const testEmail = `notetest_${Date.now()}@test.com`
const otherUserEmail = `other_notetest_${Date.now()}@test.com`

let token
let otherToken
let userId
let otherUserId
let categoryId
let targetCategoryId
let noteId

before(async () => {
  await connectDB()

  const res1 = await chai.request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Note Test User',
      email: testEmail,
      password: '12345678'
    })
  token = res1.body.token
  userId = res1.body.user.id

  const res2 = await chai.request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Other Note User',
      email: otherUserEmail,
      password: '12345678'
    })
  otherToken = res2.body.token
  otherUserId = res2.body.user.id

  const catRes = await chai.request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Work Notes', color: '#4A90E2' })
  categoryId = catRes.body._id

  const targetCatRes = await chai.request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Archived Notes', color: '#50E3C2' })
  targetCategoryId = targetCatRes.body._id
})

after(async () => {
  try {
    if (userId || otherUserId) {
      await Note.deleteMany({ userId: { $in: [userId, otherUserId] } })
      await Category.deleteMany({ userId: { $in: [userId, otherUserId] } })
    }
    await User.deleteMany({ email: { $in: [testEmail, otherUserEmail] } })
  } catch (err) {
    console.error('Teardown error in note.test.js:', err)
  }
})

describe('Note API', () => {
  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const res = await chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Meeting Notes',
          content: 'Discuss sprint goals and project timelines.',
          categoryId
        })
      expect(res).to.have.status(201)
      expect(res.body).to.have.property('title', 'Meeting Notes')
      expect(res.body).to.have.property('content', 'Discuss sprint goals and project timelines.')
      noteId = res.body._id
    })

    it('should not create a note with missing title', async () => {
      const res = await chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Content without title',
          categoryId
        })
      expect(res).to.have.status(400)
    })

    it('should not create a note with missing content', async () => {
      const res = await chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Title without content',
          categoryId
        })
      expect(res).to.have.status(400)
    })

    it('should not create a note without token', async () => {
      const res = await chai.request(app)
        .post('/api/notes')
        .send({
          title: 'Unauthorized Note',
          content: 'Some content',
          categoryId
        })
      expect(res).to.have.status(401)
    })
  })

  describe('GET /api/notes', () => {
    it('should fetch all notes for authenticated user', async () => {
      const res = await chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.be.at.least(1)
    })

    it('should not fetch notes without token', async () => {
      const res = await chai.request(app)
        .get('/api/notes')
      expect(res).to.have.status(401)
    })
  })

  describe('GET /api/notes/category/:categoryId', () => {
    it('should fetch notes belonging to a specific category', async () => {
      const res = await chai.request(app)
        .get(`/api/notes/category/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.be.at.least(1)
    })

    it('should return empty array for category with no notes', async () => {
      const res = await chai.request(app)
        .get(`/api/notes/category/${targetCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array').that.is.empty
    })
  })

  describe('GET /api/notes/search', () => {
    it('should search notes by title query', async () => {
      const res = await chai.request(app)
        .get('/api/notes/search?q=Meeting')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.be.at.least(1)
      expect(res.body[0].title).to.include('Meeting')
    })

    it('should return 400 if search query parameter is missing', async () => {
      const res = await chai.request(app)
        .get('/api/notes/search')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(400)
    })
  })

  describe('PUT /api/notes/:id', () => {
    it('should update note title and content', async () => {
      const res = await chai.request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Meeting Notes',
          content: 'Updated content for sprint review.',
          categoryId
        })
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('title', 'Updated Meeting Notes')
      expect(res.body).to.have.property('content', 'Updated content for sprint review.')
    })

    it('should not allow another user to update note', async () => {
      const res = await chai.request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title',
          content: 'Hacked content'
        })
      expect(res).to.have.status(403)
    })

    it('should return 404 when updating non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      const res = await chai.request(app)
        .put(`/api/notes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Non Existent',
          content: 'Non Existent'
        })
      expect(res).to.have.status(404)
    })
  })

  describe('PUT /api/notes/move', () => {
    it('should bulk move notes to target category', async () => {
      const res = await chai.request(app)
        .put('/api/notes/move')
        .set('Authorization', `Bearer ${token}`)
        .send({
          noteIds: [noteId],
          targetCategoryId
        })
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('message', 'Notes moved successfully')
    })

    it('should return 400 if noteIds parameter is missing', async () => {
      const res = await chai.request(app)
        .put('/api/notes/move')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetCategoryId
        })
      expect(res).to.have.status(400)
    })
  })

  describe('DELETE /api/notes/:id', () => {
    it('should not allow another user to delete note', async () => {
      const res = await chai.request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${otherToken}`)
      expect(res).to.have.status(403)
    })

    it('should delete note for authorized user', async () => {
      const res = await chai.request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('message', 'Note deleted successfully')
    })

    it('should return 404 when deleting already deleted note', async () => {
      const res = await chai.request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(404)
    })
  })
})
